<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
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

        // Menghitung tugas published yang masih
        // menerima lamaran.
        $activeTasks = $business->tasks()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('application_deadline', '>', now())
            ->count();

        // Menghitung semua lamaran pending pada
        // tugas milik UMKM yang login.
        $pendingApplicants = TaskApplication::query()
            ->where('status', 'pending')
            ->whereHas('task', function ($query) use ($business) {
                $query->where('business_id', $business->id);
            })
            ->count();

        // Menampilkan lima tugas terbaru milik UMKM.
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
            ],
            'recentTasks' => $recentTasks,
        ]);
    }
}
