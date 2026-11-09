<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TaskReviewController extends Controller
{
    /**
     * Menampilkan daftar tugas yang pernah diajukan kepada admin.
     */
    public function index(): Response
    {
        $reviewableStatuses = [
            TaskStatus::PendingReview->value,
            TaskStatus::Published->value,
            TaskStatus::Rejected->value,
        ];

        $tasks = Task::query()
            ->whereIn('status', $reviewableStatuses)
            ->with([
                'business.user',
                'reviewer',
            ])
            ->orderByRaw(
                "CASE WHEN status = 'pending_review' THEN 0 ELSE 1 END"
            )
            ->latest('submitted_at')
            ->get()
            ->map(fn (Task $task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'status' => $task->status,
                'statusLabel' => TaskStatus::tryFrom($task->status)?->label()
                    ?? ucfirst($task->status),
                'businessName' => $task->business->name,
                'employerName' => $task->business->user->name,
                'wageAmount' => (int) $task->wage_amount,
                'workerQuota' => (int) $task->worker_quota,
                'submittedAt' => $task->submitted_at?->format('d/m/Y H:i'),
                'reviewedAt' => $task->reviewed_at?->format('d/m/Y H:i'),
                'reviewerName' => $task->reviewer?->name,
                'adminNote' => $task->admin_note,
            ])
            ->values()
            ->all();

        $base = fn () => Task::query()
            ->whereIn('status', $reviewableStatuses);

        return Inertia::render('admin/tasks/index', [
            'stats' => [
                'pendingReview' => $base()
                    ->where('status', TaskStatus::PendingReview->value)
                    ->count(),
                'published' => $base()
                    ->where('status', TaskStatus::Published->value)
                    ->count(),
                'rejected' => $base()
                    ->where('status', TaskStatus::Rejected->value)
                    ->count(),
            ],
            'tasks' => $tasks,
        ]);
    }

    /**
     * Menampilkan informasi lengkap tugas untuk ditinjau.
     */
    public function show(Task $task): Response
    {
        abort_unless(
            in_array(
                $task->status,
                [
                    TaskStatus::PendingReview->value,
                    TaskStatus::Published->value,
                    TaskStatus::Rejected->value,
                ],
                true,
            ),
            404
        );

        $task->load([
            'business.user',
            'reviewer',
        ]);

        return Inertia::render('admin/tasks/show', [
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'description' => $task->description,
                'requirements' => $task->requirements,
                'instructions' => $task->instructions,
                'locationAddress' => $task->location_address,
                'latitude' => (string) $task->latitude,
                'longitude' => (string) $task->longitude,
                'attendanceRadiusMeters' => (int) $task->attendance_radius_meters,
                'applicationDeadline' => $task->application_deadline?->toIso8601String(),
                'startsAt' => $task->starts_at?->toIso8601String(),
                'endsAt' => $task->ends_at?->toIso8601String(),
                'workerQuota' => (int) $task->worker_quota,
                'wageAmount' => (int) $task->wage_amount,
                'status' => $task->status,
                'statusLabel' => TaskStatus::tryFrom($task->status)?->label()
                    ?? ucfirst($task->status),
                'businessName' => $task->business->name,
                'employerName' => $task->business->user->name,
                'employerEmail' => $task->business->user->email,
                'submittedAt' => $task->submitted_at?->toIso8601String(),
                'reviewedAt' => $task->reviewed_at?->toIso8601String(),
                'reviewerName' => $task->reviewer?->name,
                'adminNote' => $task->admin_note,
            ],
        ]);
    }

    /**
     * Menyetujui tugas dan memublikasikannya kepada pekerja.
     */
    public function approve(
        Request $request,
        Task $task
    ): RedirectResponse {
        $this->decide(
            task: $task,
            adminId: (int) $request->user()->id,
            decision: TaskStatus::Published,
            adminNote: null,
        );

        return to_route('admin.tasks.index')->with(
            'success',
            'Tugas berhasil disetujui dan telah dipublikasikan kepada pekerja.'
        );
    }

    /**
     * Menolak tugas beserta alasan yang dapat dibaca UMKM.
     */
    public function reject(
        Request $request,
        Task $task
    ): RedirectResponse {
        $validated = $request->validate([
            'admin_note' => [
                'required',
                'string',
                'min:5',
                'max:1000',
            ],
        ]);

        $this->decide(
            task: $task,
            adminId: (int) $request->user()->id,
            decision: TaskStatus::Rejected,
            adminNote: $validated['admin_note'],
        );

        return to_route('admin.tasks.index')->with(
            'success',
            'Tugas berhasil ditolak. Alasan penolakan dikirim kepada UMKM.'
        );
    }

    /**
     * Memproses keputusan dengan row lock untuk mencegah keputusan ganda.
     */
    private function decide(
        Task $task,
        int $adminId,
        TaskStatus $decision,
        ?string $adminNote,
    ): void {
        DB::transaction(function () use (
            $task,
            $adminId,
            $decision,
            $adminNote,
        ): void {
            $target = Task::query()
                ->lockForUpdate()
                ->findOrFail($task->id);

            if ($target->status !== TaskStatus::PendingReview->value) {
                throw ValidationException::withMessages([
                    'task' => 'Tugas ini sudah diproses. Muat ulang halaman.',
                ]);
            }

            $reviewedAt = now();

            $target->update([
                'status' => $decision->value,
                'reviewed_by' => $adminId,
                'reviewed_at' => $reviewedAt,
                'published_at' => $decision === TaskStatus::Published
                    ? $reviewedAt
                    : null,
                'admin_note' => $decision === TaskStatus::Rejected
                    ? $adminNote
                    : null,
            ]);
        });
    }
}
