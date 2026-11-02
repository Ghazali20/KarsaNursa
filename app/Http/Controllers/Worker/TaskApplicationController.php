<?php

namespace App\Http\Controllers\Worker;

use App\Enums\TaskApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Worker\StoreTaskApplicationRequest;
use App\Models\Task;
use App\Models\TaskApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TaskApplicationController extends Controller
{
    public function store(
        StoreTaskApplicationRequest $request,
        Task $task
    ): RedirectResponse {
        Gate::authorize(
            'create',
            [TaskApplication::class, $task]
        );

        $request->user()->taskApplications()->create([
            'task_id' => $task->id,
            'message' => $request->validated('message'),
            'status' => TaskApplicationStatus::Pending,
        ]);

        return redirect()
            ->route('worker.applications.index')
            ->with('success', 'Lamaran berhasil dikirim.');
    }

    public function index(Request $request): Response
    {
        $applications = $request
            ->user()
            ->taskApplications()
            ->with('task:id,title')
            ->latest()
            ->paginate(10);

        return Inertia::render(
            'worker/applications/index',
            ['applications' => $applications]
        );
    }

    public function show(
        TaskApplication $application
    ): Response {
        Gate::authorize('view', $application);

        $application->load('task:id,title');

        return Inertia::render(
            'worker/applications/show',
            ['application' => $application]
        );
    }

    public function withdraw(
        TaskApplication $application
    ): RedirectResponse {
        Gate::authorize('withdraw', $application);

        $application->update([
            'status' => TaskApplicationStatus::Withdrawn,
        ]);

        return redirect()
            ->route('worker.applications.index')
            ->with('success', 'Lamaran berhasil dibatalkan.');
    }
}
