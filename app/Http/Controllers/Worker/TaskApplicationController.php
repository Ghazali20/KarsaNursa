<?php

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TaskApplicationController extends Controller
{
    /**
     * Menampilkan halaman Lamaran Saya.
     */
    public function index(Request $request): Response
    {
        $worker = $request->user();

        abort_unless(
            $worker !== null && $worker->role === 'worker',
            403
        );

        $applications = TaskApplication::query()
            ->where('worker_id', $worker->id)
            ->with([
                'task.business',
                'payment',
            ])

            // PERBAIKAN: Gunakan created_at,
            // karena applied_at tidak ada di database.
            ->latest('created_at')
            ->get()
            ->map(fn (TaskApplication $application): array => [
                'id' => $application->id,

                'taskTitle' => $application->task->title,

                'businessName' => $application->task->business->name,

                'wageAmount' => $application->payment->amount
                    ?? (int) $application->task->wage_amount,

                'paymentStatus' => $application->payment?->status,

                'paidAt' => $application->payment?->paid_at
                    ?->format('d/m/Y H:i'),

                'status' => $application->status,

                // PERBAIKAN: Waktu pengajuan
                // diambil dari created_at.
                'appliedAt' => $application->created_at
                    ?->format('d/m/Y H:i'),

                'reviewNotes' => $application->review_notes ?? null,

                'reviewedAt' => $application->reviewed_at
                    ? Carbon::parse(
                        $application->reviewed_at
                    )->format('d/m/Y H:i')
                    : null,
            ])
            ->values()
            ->all();

        return Inertia::render('worker/applications/index', [
            'applications' => $applications,
        ]);
    }

    /**
     * Worker mengajukan lamaran ke tugas UMKM.
     */
    public function store(
        Request $request,
        Task $task
    ): RedirectResponse {
        $worker = $request->user();

        abort_unless(
            $worker !== null && $worker->role === 'worker',
            403
        );

        DB::transaction(function () use ($worker, $task): void {

            // Mengunci tugas selama proses pengajuan.
            $lockedTask = Task::query()
                ->with('business.user')
                ->lockForUpdate()
                ->findOrFail($task->id);

            // Periksa apakah tugas masih tersedia.
            $isAvailable =
                $lockedTask->status === 'published'
                && $lockedTask->published_at !== null
                && $lockedTask->application_deadline !== null
                && Carbon::parse(
                    $lockedTask->application_deadline
                )->isFuture()
                && $lockedTask->business?->user
                    ?->verification_status === 'approved';

            abort_unless($isAvailable, 404);

            // Mencegah Worker melamar tugas yang sama
            // lebih dari satu kali.
            $alreadyApplied = TaskApplication::query()
                ->where('task_id', $lockedTask->id)
                ->where('worker_id', $worker->id)
                ->exists();

            if ($alreadyApplied) {
                throw ValidationException::withMessages([
                    'application' => 'Kamu sudah pernah melamar tugas ini.',
                ]);
            }

            // PERBAIKAN: Tidak lagi mengirim applied_at.
            // created_at akan diisi otomatis oleh Eloquent
            // apabila timestamps model aktif.
            TaskApplication::query()->create([
                'task_id' => $lockedTask->id,
                'worker_id' => $worker->id,
                'status' => 'pending',
            ]);
        });

        return to_route(
            'worker.tasks.show',
            $task
        )->with(
            'success',
            'Lamaran berhasil dikirim.'
        );
    }
}
