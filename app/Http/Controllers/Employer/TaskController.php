<?php

namespace App\Http\Controllers\Employer;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\StoreTaskRequest;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function create(): Response
    {
        Gate::authorize('create', Task::class);

        return Inertia::render('employer/tasks/create', [
            'categories' => [
                [
                    'value' => 'kuliner',
                    'label' => 'Kuliner',
                ],
                [
                    'value' => 'retail',
                    'label' => 'Retail',
                ],
                [
                    'value' => 'produksi',
                    'label' => 'Produksi',
                ],
                [
                    'value' => 'administrasi',
                    'label' => 'Administrasi',
                ],
                [
                    'value' => 'event',
                    'label' => 'Event',
                ],
                [
                    'value' => 'logistik',
                    'label' => 'Logistik',
                ],
                [
                    'value' => 'lainnya',
                    'label' => 'Lainnya',
                ],
            ],
            'defaults' => [
                'attendanceRadiusMeters' => 150,
            ],
        ]);
    }

    public function store(
        StoreTaskRequest $request,
    ): RedirectResponse {
        Gate::authorize('create', Task::class);

        $validated = $request->validated();

        $action = $validated['action'];

        unset($validated['action']);

        $status = $action === 'publish'
            ? TaskStatus::Published
            : TaskStatus::Draft;

        $task = $request
            ->user()
            ->business
            ->tasks()
            ->create([
                ...$validated,
                'status' => $status,
                'published_at' => $status === TaskStatus::Published
                    ? now()
                    : null,
            ]);

        $message = $status === TaskStatus::Published
            ? 'Tugas berhasil dipublikasikan.'
            : 'Draft tugas berhasil disimpan.';

        return redirect()
            ->route('employer.dashboard')
            ->with('success', $message)
            ->with('created_task_id', $task->id);
    }
}