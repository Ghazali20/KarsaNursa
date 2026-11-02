<?php

namespace App\Http\Controllers\Employer;

use App\Enums\TaskApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
use BackedEnum;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TaskApplicationController extends Controller
{
    // Menampilkan daftar pelamar untuk tugas milik UMKM.
    public function index(Request $request, Task $task): Response
    {
        $this->authorizeTaskOwner($request, $task);

        $applications = $task->applications()
            ->with('worker:id,name,email')
            ->latest()
            ->paginate(10)
            ->through(fn (TaskApplication $application): array => [
                'id' => $application->id,
                'worker' => $application->worker === null ? null : [
                    'id' => $application->worker->id,
                    'name' => $application->worker->name,
                    'email' => $application->worker->email,
                ],
                'message' => $application->message,
                'status' => $this->statusValue($application->status),
                'createdAt' => $application->created_at?->toIso8601String(),
                'reviewedAt' => $application->reviewed_at?->toIso8601String(),
            ]);

        return Inertia::render('employer/tasks/applications/index', [
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'workerQuota' => $task->worker_quota,
            ],
            'counts' => [
                'total' => $task->applications()->count(),
                'pending' => $task->applications()
                    ->where('status', TaskApplicationStatus::Pending->value)
                    ->count(),
                'accepted' => $task->applications()
                    ->where('status', TaskApplicationStatus::Accepted->value)
                    ->count(),
            ],
            'applications' => $applications,
        ]);
    }

    // Menerima lamaran pekerja.
    public function accept(
        Request $request,
        TaskApplication $application
    ): RedirectResponse {
        $this->review(
            $request,
            $application,
            TaskApplicationStatus::Accepted
        );

        return back()->with(
            'success',
            'Lamaran pekerja berhasil diterima.'
        );
    }

    // Menolak lamaran pekerja.
    public function reject(
        Request $request,
        TaskApplication $application
    ): RedirectResponse {
        $this->review(
            $request,
            $application,
            TaskApplicationStatus::Rejected
        );

        return back()->with(
            'success',
            'Lamaran pekerja berhasil ditolak.'
        );
    }

    // Memproses keputusan secara aman di dalam transaksi.
    private function review(
        Request $request,
        TaskApplication $application,
        TaskApplicationStatus $decision
    ): void {
        DB::transaction(function () use ($request, $application, $decision): void {
            // Kunci tugas agar proses penerimaan pada tugas yang sama
            // tidak berjalan bersamaan.
            $task = Task::query()
                ->whereKey($application->task_id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->authorizeTaskOwner($request, $task);

            // Ambil ulang lamaran agar status yang diperiksa terbaru.
            $currentApplication = TaskApplication::query()
                ->whereKey($application->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                (int) $currentApplication->task_id === (int) $task->getKey(),
                403,
                'Lamaran tidak sesuai dengan tugas.'
            );

            abort_unless(
                $this->statusValue($currentApplication->status)
                    === TaskApplicationStatus::Pending->value,
                422,
                'Lamaran ini sudah diproses atau dibatalkan.'
            );

            // Pengecekan tambahan saat menerima pelamar.
            if ($decision === TaskApplicationStatus::Accepted) {
                abort_unless(
                    $this->statusValue($task->status) === 'published',
                    422,
                    'Hanya tugas yang dipublikasikan dapat menerima pelamar.'
                );

                $acceptedCount = $task->applications()
                    ->where(
                        'status',
                        TaskApplicationStatus::Accepted->value
                    )
                    ->count();

                abort_if(
                    $acceptedCount >= (int) $task->worker_quota,
                    422,
                    'Kuota pekerja untuk tugas ini sudah penuh.'
                );
            }

            // Simpan keputusan beserta informasi reviewer.
            $currentApplication->update([
                'status' => $decision->value,
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()->getAuthIdentifier(),
            ]);
        }, 3);
    }

    // Memastikan UMKM hanya mengelola tugas miliknya sendiri.
    private function authorizeTaskOwner(
        Request $request,
        Task $task
    ): void {
        Gate::authorize('view', $task);

        abort_unless(
            $request->user()->role === 'employer'
                && $request->user()->business?->is($task->business) === true,
            403,
            'Anda tidak berhak mengelola pelamar tugas ini.'
        );
    }

    // Mendukung status yang disimpan sebagai enum atau string.
    private function statusValue(mixed $status): string
    {
        return $status instanceof BackedEnum
            ? (string) $status->value
            : (string) $status;
    }
}
