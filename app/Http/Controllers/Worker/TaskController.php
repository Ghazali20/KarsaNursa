<?php

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(): Response
    {
        $tasks = Task::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('application_deadline', '>', now())
            ->whereHas('business.user', function ($query) {
                $query->where('verification_status', 'approved');
            })
            ->with('business')
            ->latest('published_at')
            ->get()
            ->map(fn (Task $task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'description' => $task->description,
                'locationAddress' => $task->location_address,
                'workerQuota' => $task->worker_quota,
                'wageAmount' => $task->wage_amount === null
                    ? null
                    : (int) $task->wage_amount,
                'businessName' => $task->business->name,
                'applicationDeadline' => $task->application_deadline?->format('d/m/Y H:i'),
            ])
            ->values()
            ->all();

        return Inertia::render('worker/tasks/index', [
            'tasks' => $tasks,
        ]);
    }

    public function show(Request $request, Task $task): Response
    {
        // Hanya tugas tersedia yang dapat dibuka.
        $task = Task::query()
            ->whereKey($task->id)
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
            ->firstOrFail();

        // Memeriksa apakah pekerja sudah melamar.
        $applicationStatus = TaskApplication::query()
            ->where('task_id', $task->id)
            ->where('worker_id', $request->user()->id)
            ->value('status');

        return Inertia::render('worker/tasks/show', [
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'description' => $task->description,
                'requirements' => $task->requirements,
                'locationAddress' => $task->location_address,
                'businessName' => $task->business->name,
                'workerQuota' => $task->worker_quota,
                'wageAmount' => (int) $task->wage_amount,
                'applicationDeadline' => $task->application_deadline?->format('d/m/Y H:i'),
                'startsAt' => $task->starts_at?->format('d/m/Y H:i'),
                'endsAt' => $task->ends_at?->format('d/m/Y H:i'),
            ],

            'applicationStatus' => $applicationStatus,
        ]);
    }
}
