<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $business = $request
            ->user()
            ->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.',
        );

        $activeTasks = $business
            ->tasks()
            ->where(
                'status',
                TaskStatus::Published->value,
            )
            ->count();

        $recentTasks = $business
            ->tasks()
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($task) => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'status' => $task->status->value,
                'statusLabel' => $task->status->label(),
                'workerQuota' => $task->worker_quota,
                'wageAmount' => $task->wage_amount,
                'startsAt' => $task->starts_at?->toIso8601String(),
                'publishedAt' => $task->published_at?->toIso8601String(),
            ])
            ->values();

        return Inertia::render(
            'employer/dashboard',
            [
                'stats' => [
                    'activeTasks' => $activeTasks,

                    // Diisi setelah fitur application dibuat.
                    'newApplicants' => 0,

                    // Diisi setelah fitur completion dibuat.
                    'pendingApprovals' => 0,

                    // Diisi setelah fitur ledger dibuat.
                    'monthlyExpenses' => 0,
                ],

                'recentTasks' => $recentTasks,
            ],
        );
    }
}
