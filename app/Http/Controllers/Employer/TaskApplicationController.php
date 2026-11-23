<?php

namespace App\Http\Controllers\Employer;

use App\Enums\TaskPaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
use App\Models\TaskPayment;
use App\Notifications\TaskApplicationRejected;
use BackedEnum;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
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
            ->with(['worker:id,name,email,phone,verification_status', 'worker.workerProfile', 'payment'])
            ->latest('id')
            ->get()
            ->map(function (TaskApplication $application) use ($hasReviewNotes, $task): array {
                $worker = $application->worker;
                $profile = $worker?->workerProfile;
                $completed = TaskApplication::query()
                    ->where('worker_id', $application->worker_id)
                    ->where('status', 'accepted')
                    ->whereHas('payment', fn ($q) => $q->where('status', TaskPaymentStatus::Paid->value))
                    ->count();

                $skills = $profile?->skills;
                if (! is_array($skills) || empty($skills)) {
                    $skills = ['Ketelitian', 'Operasional', 'Kerja Tim'];
                }

                return [
                    'id' => $application->id,
                    'status' => $this->statusValue($application->status),
                    'workerName' => $worker?->name ?? 'Pekerja tidak tersedia',
                    'workerEmail' => $worker?->email ?? '-',
                    'workerPhone' => $worker?->phone ?? '-',
                    'isVerified' => $worker?->verification_status === 'approved',
                    'rating' => $completed > 0 ? '4.9' : '5.0',
                    'completedTasks' => $completed,
                    'skills' => array_values($skills),
                    'appliedAt' => $application->created_at?->format('d/m/Y H:i'),
                    'appliedAtHuman' => $application->created_at ? 'Diajukan '.$application->created_at->diffForHumans() : 'Baru saja',
                    'applicantNote' => $application->applicant_note ?? $application->message ?? null,
                    'qualificationDocumentUrl' => $application->qualification_document_path
                        ? Storage::url($application->qualification_document_path)
                        : null,
                    'reviewNotes' => $hasReviewNotes ? $application->review_notes : null,
                    'reviewedAt' => $application->reviewed_at
                        ? Carbon::parse($application->reviewed_at)->format('d/m/Y H:i')
                        : null,
                    'checkedInAt' => $application->checked_in_at?->format('d/m/Y H:i'),
                    'checkedOutAt' => $application->checked_out_at?->format('d/m/Y H:i'),
                    'proofPhotoUrl' => $application->proof_photo_path
                        ? Storage::url($application->proof_photo_path)
                        : null,
                    'activityNotes' => $application->activity_notes,
                    'proofSubmittedAt' => $application->proof_submitted_at?->format('d/m/Y H:i'),
                    'payment' => [
                        'status' => $application->payment?->status ?? 'pending',
                        'amount' => $application->payment?->amount !== null
                            ? (int) $application->payment->amount
                            : (int) ($task->wage_amount ?? 0),
                        'paidAt' => $application->payment?->paid_at?->format('d/m/Y H:i'),
                    ],
                ];
            })
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

        $quota = (int) $task->worker_quota;

        return Inertia::render(
            'employer/tasks/applications',
            [
                'task' => [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $this->statusValue($task->status),
                    'workerQuota' => $task->worker_quota,
                    'wageAmount' => $task->wage_amount === null ? null : (int) $task->wage_amount,
                    'acceptedCount' => $acceptedCount,
                    'pendingCount' => $pendingCount,

                    // Tambahan untuk UI revisi dosen.
                    'isFull' => $quota > 0 && $acceptedCount >= $quota,
                    'remainingQuota' => max(0, $quota - $acceptedCount),
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
        // 3. VALIDASI KEPEMILIKAN TUGAS
        // ========================================

        // Tolak akses UMKM lain sebelum memeriksa struktur database.
        // Pemeriksaan ulang di dalam transaksi tetap dipertahankan.
        abort_unless(
            (int) $task->business_id === (int) $business->id,
            403,
            'Anda tidak berhak memproses lamaran tugas ini.'
        );

        // ========================================
        // 4. PERIKSA STRUKTUR DATABASE
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

        // Revisi dosen: notifikasi penolakan wajib tersimpan.
        // Pastikan tabel notifications telah dibuat.
        if (! Schema::hasTable('notifications')) {
            throw ValidationException::withMessages([
                'application' => 'Tabel notifications belum tersedia. '.
                    'Jalankan migration notifikasi Laravel terlebih dahulu.',
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
            // Semua keputusan pada tugas yang sama harus
            // mengikuti urutan penguncian ini.
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
            if ($this->statusValue($lockedApplication->status) !== 'pending') {
                throw ValidationException::withMessages([
                    'application' => 'Lamaran ini sudah diproses sebelumnya.',
                ]);
            }

            // ========================================
            // 7. VALIDASI PENERIMAAN
            // ========================================

            // Kuota tugas yang ditetapkan UMKM.
            $quota = (int) $lockedTask->worker_quota;

            if ($validated['decision'] === 'accepted') {

                if (! in_array($this->statusValue($lockedTask->status), ['published', 'in_progress'], true)) {
                    throw ValidationException::withMessages([
                        'application' => 'Tugas ini belum dipublikasikan atau kuotanya sudah penuh.',
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
                // ========================================
                // 10. CATAT PEMBAYARAN (TETAP ADA)
                // ========================================

                $lockedApplication->payment()->create([
                    'amount' => (int) $lockedTask->wage_amount,
                    'status' => TaskPaymentStatus::Pending->value,
                    'paid_at' => null,
                ]);

                // ========================================
                // 11. CEK APAKAH KUOTA BARU SAJA PENUH
                // ========================================

                // Hitung ulang setelah status lamaran diubah.
                $newAcceptedCount = $lockedTask->applications()
                    ->where('status', 'accepted')
                    ->count();

                if ($newAcceptedCount >= $quota) {
                    // Ketika kuota pekerja terpenuhi, status tugas beralih ke in_progress (Berlangsung).
                    // Status 'completed' hanya terjadi setelah pekerja mengunggah bukti & check-out.
                    $lockedTask->update([
                        'status' => 'in_progress',
                    ]);

                    // ====================================
                    // 12. AUTO-REJECT PELAMAR SISA
                    // ====================================

                    $pendingApplications = TaskApplication::query()
                        ->where('task_id', $lockedTask->id)
                        ->where('status', 'pending')
                        ->orderBy('id')
                        ->lockForUpdate()
                        ->get();

                    $autoRejectReason =
                        'Lamaran otomatis ditolak karena kuota pekerja '
                        .'untuk tugas ini sudah terpenuhi.';

                    foreach ($pendingApplications as $pendingApplication) {
                        $autoRejectData = [
                            'status' => 'rejected',
                            'reviewed_by' => $request->user()->id,
                            'reviewed_at' => now(),
                        ];

                        if ($hasReviewNotes) {
                            $autoRejectData['review_notes'] = $autoRejectReason;
                        }

                        $pendingApplication->update($autoRejectData);

                        // Notifikasi disimpan ke DB pada transaksi
                        // yang sama agar tidak kehilangan pesan.
                        $pendingApplication->worker?->notify(
                            new TaskApplicationRejected(
                                taskId: (int) $lockedTask->id,
                                applicationId: (int) $pendingApplication->id,
                                taskTitle: (string) $lockedTask->title,
                                reason: $autoRejectReason,
                                automatic: true,
                            )
                        );
                    }
                }
            } else {
                // ========================================
                // 13. NOTIFIKASI PENOLAKAN MANUAL
                // ========================================

                $manualRejectReason = (string) $validated['review_notes'];

                $lockedApplication->worker?->notify(
                    new TaskApplicationRejected(
                        taskId: (int) $lockedTask->id,
                        applicationId: (int) $lockedApplication->id,
                        taskTitle: (string) $lockedTask->title,
                        reason: $manualRejectReason,
                        automatic: false,
                    )
                );
            }
        }, 3);

        // ========================================
        // 14. REDIRECT SESUAI HALAMAN ASAL
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

    /**
     * Menyetujui hasil pekerjaan dan mencatat pencairan upah.
     */
    public function approveWork(
        Request $request,
        Task $task,
        TaskApplication $application
    ): RedirectResponse {
        $business = $request->user()->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.'
        );

        abort_unless(
            (int) $task->business_id === (int) $business->id,
            403
        );

        abort_unless(
            (int) $application->task_id === (int) $task->id,
            404
        );

        DB::transaction(function () use ($application, $task, $request): void {
            $lockedApp = TaskApplication::query()
                ->lockForUpdate()
                ->findOrFail($application->id);

            abort_unless(
                $this->statusValue($lockedApp->status) === 'accepted',
                422,
                'Upah hanya dapat disetujui untuk pelamar yang telah diterima.'
            );

            // Cari atau buat TaskPayment jika belum ada
            $payment = TaskPayment::query()
                ->where('task_application_id', $lockedApp->id)
                ->lockForUpdate()
                ->first();

            if ($payment === null) {
                TaskPayment::query()->create([
                    'task_application_id' => $lockedApp->id,
                    'amount' => (int) $task->wage_amount,
                    'status' => TaskPaymentStatus::Paid->value,
                    'paid_at' => now(),
                ]);
            } else {
                $payment->update([
                    'status' => TaskPaymentStatus::Paid->value,
                    'paid_at' => now(),
                ]);
            }

            // Catatan atau apresiasi opsional jika diisi
            if ($request->filled('review_notes') && Schema::hasColumn('task_applications', 'review_notes')) {
                $lockedApp->update([
                    'review_notes' => $request->string('review_notes')->trim(),
                    'reviewed_by' => $request->user()->id,
                    'reviewed_at' => now(),
                ]);
            }

            // Cek apakah seluruh pelamar yang diterima (accepted) pada tugas ini sudah dibayar (paid)
            $totalAccepted = TaskApplication::query()
                ->where('task_id', $task->id)
                ->where('status', 'accepted')
                ->count();

            $totalPaid = TaskPayment::query()
                ->where('task_payments.status', TaskPaymentStatus::Paid->value)
                ->whereHas('application', function ($q) use ($task) {
                    $q->where('task_id', $task->id)
                        ->where('status', 'accepted');
                })
                ->count();

            // Jika semua pelamar diterima sudah dibayar, otomatis perbarui status Task menjadi completed
            if ($totalAccepted > 0 && $totalPaid >= $totalAccepted) {
                Task::query()
                    ->where('id', $task->id)
                    ->update([
                        'status' => 'completed',
                    ]);
            }
        }, 3);

        return back()->with('success', 'Hasil pekerjaan disetujui dan pembayaran upah berhasil dicatat!');
    }

    /**
     * Mengirimkan catatan atau saran perbaikan hasil kerja ke pekerja.
     */
    public function giveFeedback(
        Request $request,
        Task $task,
        TaskApplication $application
    ): RedirectResponse {
        $business = $request->user()->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.'
        );

        abort_unless(
            (int) $task->business_id === (int) $business->id,
            403
        );

        abort_unless(
            (int) $application->task_id === (int) $task->id,
            404
        );

        $validated = $request->validate([
            'notes' => ['required', 'string', 'min:5', 'max:1000'],
        ], [
            'notes.required' => 'Saran atau catatan wajib diisi.',
            'notes.min' => 'Saran perbaikan minimal 5 karakter.',
            'notes.max' => 'Saran perbaikan maksimal 1000 karakter.',
        ]);

        if (Schema::hasColumn('task_applications', 'review_notes')) {
            $application->update([
                'review_notes' => $validated['notes'],
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        }

        return back()->with('success', 'Saran perbaikan berhasil dikirimkan kepada pekerja.');
    }

    /**
     * Mendukung status string maupun enum cast Laravel.
     */
    private function statusValue(mixed $status): string
    {
        return $status instanceof BackedEnum
            ? (string) $status->value
            : (string) $status;
    }
}
