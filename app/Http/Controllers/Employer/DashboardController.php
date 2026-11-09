<?php

namespace App\Http\Controllers\Employer;

use App\Enums\TaskPaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
use App\Models\TaskPayment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $business = $user->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.'
        );

        $activeTasks = $business->tasks()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('application_deadline', '>', now())
            ->count();

        $pendingApplicants = TaskApplication::query()
            ->where('status', 'pending')
            ->whereHas('task', function ($query) use ($business) {
                $query->where('business_id', $business->id);
            })
            ->count();

        $pendingPayments = TaskPayment::query()
            ->where('status', TaskPaymentStatus::Pending->value)
            ->whereHas(
                'application.task',
                function ($query) use ($business) {
                    $query->where('business_id', $business->id);
                }
            )
            ->count();

        $monthlyExpenses = TaskPayment::query()
            ->where('status', TaskPaymentStatus::Paid->value)
            ->whereBetween('paid_at', [
                now()->startOfMonth(),
                now()->endOfMonth(),
            ])
            ->whereHas(
                'application.task',
                function ($query) use ($business) {
                    $query->where('business_id', $business->id);
                }
            )
            ->sum('amount');

        $recentTasks = $business->tasks()
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn (Task $task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'status' => $task->status,
                'workerQuota' => $task->worker_quota,
                'wageAmount' => $task->wage_amount === null
                    ? null
                    : (int) $task->wage_amount,
            ])
            ->values()
            ->all();

        return Inertia::render('employer/dashboard', [
            'stats' => [
                'activeTasks' => $activeTasks,
                'pendingApplicants' => $pendingApplicants,
                'pendingPayments' => $pendingPayments,
                'monthlyExpenses' => (int) $monthlyExpenses,
            ],
            'recentTasks' => $recentTasks,
        ]);
    }
}
