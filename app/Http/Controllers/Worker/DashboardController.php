<?php

namespace App\Http\Controllers\Worker;

use App\Enums\TaskApplicationStatus;
use App\Enums\TaskPaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
use App\Models\TaskPayment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $worker = $request->user();

        $recommendedTasks = Task::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('application_deadline', '>', now())
            ->whereHas('business.user', function ($query) {
                $query->where(
                    'verification_status',
                    'approved'
                );
            })
            ->with('business')
            ->latest('published_at')
            ->limit(4)
            ->get()
            ->map(fn (Task $task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'businessName' => $task->business->name,
                'locationAddress' => $task->location_address,
                'wageAmount' => $task->wage_amount === null
                    ? null
                    : (int) $task->wage_amount,
                'workerQuota' => $task->worker_quota,
            ])
            ->values()
            ->all();

        $pendingApplications = TaskApplication::query()
            ->where('worker_id', $worker->id)
            ->where('status', TaskApplicationStatus::Pending->value)
            ->count();

        $activeAssignments = TaskApplication::query()
            ->where('worker_id', $worker->id)
            ->where('status', TaskApplicationStatus::Accepted->value)
            ->whereHas('payment', function ($query) {
                $query->where(
                    'status',
                    TaskPaymentStatus::Pending->value
                );
            })
            ->count();

        $pendingWages = TaskPayment::query()
            ->where('status', TaskPaymentStatus::Pending->value)
            ->whereHas(
                'application',
                function ($query) use ($worker) {
                    $query->where('worker_id', $worker->id);
                }
            )
            ->sum('amount');

        $monthlyWages = TaskPayment::query()
            ->where('status', TaskPaymentStatus::Paid->value)
            ->whereBetween('paid_at', [
                now()->startOfMonth(),
                now()->endOfMonth(),
            ])
            ->whereHas(
                'application',
                function ($query) use ($worker) {
                    $query->where('worker_id', $worker->id);
                }
            )
            ->sum('amount');

        return Inertia::render('worker/dashboard', [
            'recommendedTasks' => $recommendedTasks,
            'pendingApplications' => $pendingApplications,
            'activeAssignments' => $activeAssignments,
            'pendingWages' => (int) $pendingWages,
            'monthlyWages' => (int) $monthlyWages,
        ]);
    }
}
