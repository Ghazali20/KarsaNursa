<?php

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(
        Request $request,
    ): Response {
        $tasks = Task::query()
            ->available()
            ->with([
                'business:id,name,address',
            ])
            ->orderBy('starts_at')
            ->paginate(12)
            ->through(
                fn (Task $task) => [
                    'id' => $task->id,
                    'title' => $task->title,
                    'category' => $task->category,
                    'description' => $task->description,
                    'locationAddress' => $task->location_address,
                    'workerQuota' => $task->worker_quota,
                    'wageAmount' => $task->wage_amount,
                    'applicationDeadline' => $task
                        ->application_deadline
                        ->toIso8601String(),
                    'startsAt' => $task
                        ->starts_at
                        ->toIso8601String(),
                    'endsAt' => $task
                        ->ends_at
                        ->toIso8601String(),
                    'business' => [
                        'name' => $task
                            ->business
                            ->name,
                        'address' => $task
                            ->business
                            ->address,
                    ],
                ],
            );

        return Inertia::render(
            'worker/tasks/index',
            [
                'tasks' => $tasks,
            ],
        );
    }

    public function show(
        int $task,
    ): Response {
        $task = Task::query()
            ->available()
            ->with('business')
            ->findOrFail($task);

        return Inertia::render(
            'worker/tasks/show',
            [
                'task' => [
                    'id' => $task->id,
                    'title' => $task->title,
                    'category' => $task->category,
                    'description' => $task->description,
                    'requirements' => $task->requirements,
                    'instructions' => $task->instructions,
                    'locationAddress' => $task->location_address,
                    'latitude' => $task->latitude,
                    'longitude' => $task->longitude,
                    'workerQuota' => $task->worker_quota,
                    'wageAmount' => $task->wage_amount,
                    'applicationDeadline' => $task
                        ->application_deadline
                        ->toIso8601String(),
                    'startsAt' => $task
                        ->starts_at
                        ->toIso8601String(),
                    'endsAt' => $task
                        ->ends_at
                        ->toIso8601String(),
                    'business' => [
                        'name' => $task
                            ->business
                            ->name,
                        'address' => $task
                            ->business
                            ->address,
                    ],
                ],
            ],
        );
    }
}
