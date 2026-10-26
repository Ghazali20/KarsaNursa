<?php

namespace App\Policies;

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
        return $user->business?->is($task->business);
    }

    public function update(User $user, Task $task): bool
    {
        return $user->business?->is($task->business);
    }

    public function delete(User $user, Task $task): bool
    {
        return $user->business?->is($task->business)
            && $task->status->value === 'draft';
    }
}