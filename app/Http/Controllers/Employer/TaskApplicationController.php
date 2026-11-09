<?php

namespace App\Http\Controllers\Employer;

use App\Enums\TaskPaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TaskApplicationController extends Controller
{
    /**
     * Menampilkan lamaran untuk satu tugas UMKM.
     */
    public function index(Request $request, Task $task): Response
    {
        $business = $request->user()->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.'
        );

        // UMKM hanya dapat melihat tugas miliknya sendiri.
        abort_unless(
            (int) $task->business_id === (int) $business->id,
            403
        );

        // Periksa apakah kolom catatan tersedia.
        $hasReviewNotes = Schema::hasColumn(
            'task_applications',
            'review_notes'
        );

        $applications = $task->applications()
            ->with('worker:id,name,email')
            ->latest('id')
            ->get()
            ->map(fn (TaskApplication $application): array => [
                'id' => $application->id,

                'status' => $application->status,

                'workerName' => $application->worker->name,

                'workerEmail' => $application->worker->email,

                // Menggunakan created_at, bukan applied_at.
                'appliedAt' => $application->created_at
                    ?->format('d/m/Y H:i'),

                // Hanya membaca review_notes jika tersedia.
                'reviewNotes' => $hasReviewNotes
                    ? $application->review_notes
                    : null,

                'reviewedAt' => $application->reviewed_at
                    ? Carbon::parse($application->reviewed_at)
                        ->format('d/m/Y H:i')
                    : null,
            ])
            ->values()
            ->all();

        // Menghitung pelamar yang diterima.
        $acceptedCount = $task->applications()
            ->where('status', 'accepted')
            ->count();

        // Menghitung pelamar yang masih pending.
        $pendingCount = $task->applications()
            ->where('status', 'pending')
            ->count();

        return Inertia::render(
            'employer/tasks/applications',
            [
                'task' => [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->status,
                    'workerQuota' => $task->worker_quota,
                    'acceptedCount' => $acceptedCount,
                    'pendingCount' => $pendingCount,
                ],

                'applications' => $applications,
            ]
        );
    }

    /**
     * Menerima atau menolak lamaran.
     */
    public function decide(
        Request $request,
        Task $task,
        TaskApplication $application
    ): RedirectResponse {

        // ========================================
        // 1. VALIDASI DATA KEPUTUSAN
        // ========================================

        $validated = $request->validate([
            'decision' => [
                'required',
                Rule::in(['accepted', 'rejected']),
            ],

            'review_notes' => [
                'required_if:decision,rejected',
                'nullable',
                'string',
                'min:5',
                'max:1000',
            ],

            'return_to' => [
                'nullable',
                Rule::in(['inbox']),
            ],
        ]);

        // ========================================
        // 2. MENGAMBIL PROFIL USAHA
        // ========================================

        $business = $request->user()->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.'
        );

        // ========================================
        // 3. PERIKSA STRUKTUR DATABASE
        // ========================================

        $hasReviewNotes = Schema::hasColumn(
            'task_applications',
            'review_notes'
        );

        // Penolakan harus menyimpan alasannya.
        // Jangan diam-diam menghilangkan catatan.
        if (
            $validated['decision'] === 'rejected'
            && ! $hasReviewNotes
        ) {
            throw ValidationException::withMessages([
                'application' => 'Kolom review_notes belum tersedia pada database. '.
                    'Jalankan migration penambahan kolom terlebih dahulu.',
            ]);
        }

        // ========================================
        // 4. PROSES SELEKSI PELAMAR
        // ========================================

        DB::transaction(function () use (
            $request,
            $task,
            $application,
            $business,
            $validated,
            $hasReviewNotes
        ): void {

            // Mengunci tugas selama proses seleksi.
            $lockedTask = Task::query()
                ->lockForUpdate()
                ->findOrFail($task->id);

            // ========================================
            // 5. VALIDASI KEPEMILIKAN TUGAS
            // ========================================

            abort_unless(
                (int) $lockedTask->business_id
                    === (int) $business->id,
                403
            );

            // ========================================
            // 6. VALIDASI LAMARAN
            // ========================================

            $lockedApplication = TaskApplication::query()
                ->whereKey($application->id)
                ->where('task_id', $lockedTask->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Lamaran hanya dapat diproses sekali.
            if ($lockedApplication->status !== 'pending') {
                throw ValidationException::withMessages([
                    'application' => 'Lamaran ini sudah diproses sebelumnya.',
                ]);
            }

            // ========================================
            // 7. VALIDASI PENERIMAAN
            // ========================================

            if ($validated['decision'] === 'accepted') {

                if ($lockedTask->status !== 'published') {
                    throw ValidationException::withMessages([
                        'application' => 'Tugas ini belum dipublikasikan.',
                    ]);
                }

                if (
                    $lockedTask->ends_at !== null
                    && Carbon::parse($lockedTask->ends_at)->isPast()
                ) {
                    throw ValidationException::withMessages([
                        'application' => 'Pekerjaan ini sudah berakhir.',
                    ]);
                }

                // ========================================
                // 8. PERIKSA KUOTA PEKERJA
                // ========================================

                $quota = (int) $lockedTask->worker_quota;

                $acceptedCount = TaskApplication::query()
                    ->where('task_id', $lockedTask->id)
                    ->where('status', 'accepted')
                    ->count();

                if (
                    $quota < 1
                    || $acceptedCount >= $quota
                ) {
                    throw ValidationException::withMessages([
                        'application' => 'Kuota pekerja untuk tugas ini sudah penuh.',
                    ]);
                }
            }

            // ========================================
            // 9. SIMPAN KEPUTUSAN
            // ========================================

            $updateData = [
                'status' => $validated['decision'],
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ];

            // Hanya menyimpan catatan jika kolom tersedia.
            if ($hasReviewNotes) {
                $updateData['review_notes'] =
                    $validated['decision'] === 'rejected'
                        ? $validated['review_notes']
                        : null;
            }

            $lockedApplication->update($updateData);

            if ($validated['decision'] === 'accepted') {
                $lockedApplication->payment()->create([
                    'amount' => (int) $lockedTask->wage_amount,
                    'status' => TaskPaymentStatus::Pending->value,
                    'paid_at' => null,
                ]);
            }

        }, 3);

        // ========================================
        // 10. REDIRECT SESUAI HALAMAN ASAL
        // ========================================

        if (($validated['return_to'] ?? null) === 'inbox') {
            return to_route(
                'employer.applications.index'
            )->with(
                'success',
                'Keputusan seleksi pelamar berhasil disimpan.'
            );
        }

        return to_route(
            'employer.tasks.applications.index',
            $task
        )->with(
            'success',
            'Keputusan seleksi pelamar berhasil disimpan.'
        );
    }
}
