<?php

namespace App\Policies;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function create(User $user): bool
    {
        return $user->role === 'employer'
            && $user->verification_status === 'approved'
            && $user->business()->exists();
    }

    public function view(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'worker') {
            return $task->status === TaskStatus::Published->value;
        }

        return $user->role === 'employer'
            && $user->business?->is($task->business) === true;
    }

    public function update(User $user, Task $task): bool
    {
        return $this->ownsTask($user, $task)
            && in_array(
                $task->status,
                [
                    TaskStatus::Draft->value,
                    TaskStatus::Rejected->value,
                ],
                true,
            );
    }

    public function submit(User $user, Task $task): bool
    {
        return $this->update($user, $task);
    }

    public function review(User $user, Task $task): bool
    {
        return $user->role === 'admin'
            && $task->status === TaskStatus::PendingReview->value;
    }

    public function delete(User $user, Task $task): bool
    {
        return $this->ownsTask($user, $task)
            && $task->status === TaskStatus::Draft->value;
    }

    private function ownsTask(User $user, Task $task): bool
    {
        return $user->role === 'employer'
            && $user->business?->is($task->business) === true;
    }
}
