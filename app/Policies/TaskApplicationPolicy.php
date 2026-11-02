<?php

namespace App\Policies;

use App\Enums\TaskApplicationStatus;
use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\TaskApplication;
use App\Models\User;

class TaskApplicationPolicy
{
    public function create(User $user, Task $task): bool
    {
        $status = $task->status->value;

        return $user->role === 'worker'
            && $user->verification_status === 'approved'
            && $task->status === TaskStatus::Published
            && $task->published_at !== null
            && $task->application_deadline !== null
            && $task->application_deadline->isFuture()
            && $task->starts_at !== null
            && $task->starts_at->isFuture()
            && $task->business?->user_id !== $user->id
            && ! $task->applications()
                ->where('worker_id', $user->id)
                ->exists()
            && $task->applications()
                ->where(
                    'status',
                    TaskApplicationStatus::Accepted->value
                )
                ->count() < $task->worker_quota;
    }

    public function view(
        User $user,
        TaskApplication $application
    ): bool {
        return (
            $user->role === 'worker'
            && $application->worker_id === $user->id
        ) || (
            $user->role === 'employer'
            && $user->business?->id === $application->task->business_id
        );
    }

    public function withdraw(
        User $user,
        TaskApplication $application
    ): bool {
        return $user->role === 'worker'
            && $application->worker_id === $user->id
            && $application->status === TaskApplicationStatus::Pending;
    }
}
