<?php

namespace App\Http\Controllers\Employer;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\PublishTaskRequest;
use App\Http\Requests\Employer\StoreTaskRequest;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    /**
     * Menampilkan daftar tugas milik UMKM.
     */
    public function index(
        Request $request,
    ): Response {
        $business = $request
            ->user()
            ->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.',
        );

        $tasks = $business
            ->tasks()
            ->latest()
            ->paginate(10)
            ->through(fn (Task $task) => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'status' => $task->status->value,
                'statusLabel' => $task->status->label(),
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
                'publishedAt' => $task
                    ->published_at
                    ?->toIso8601String(),
                'canPublish' => $request
                    ->user()
                    ->can('publish', $task),
                'applicantsCount' => $task
                    ->applications()
                    ->count(),
            ]);

        return Inertia::render(
            'employer/tasks/index',
            [
                'tasks' => $tasks,
            ],
        );
    }

    /**
     * Menampilkan halaman pembuatan tugas.
     */
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

    /**
     * Menyimpan tugas baru sebagai draft atau published.
     */
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

        $business = $request->user()->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.',
        );

        $task = $business
            ->tasks()
            ->create([
                ...$validated,
                'status' => $status,
                'published_at' => $status === TaskStatus::Published
                    ? now()
                    : null,
            ]);

        if ($status === TaskStatus::Draft) {
            return redirect()
                ->route('employer.tasks.index')
                ->with(
                    'success',
                    'Draft tugas berhasil disimpan. Anda dapat mempublikasikannya nanti.',
                );
        }

        return redirect()
            ->route('employer.tasks.show', $task)
            ->with(
                'success',
                'Tugas berhasil dipublikasikan.',
            );
    }

    /**
     * Menampilkan detail tugas.
     */
    public function show(Task $task): Response
    {
        Gate::authorize('view', $task);

        return Inertia::render(
            'employer/tasks/show',
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
                    'attendanceRadiusMeters' => $task->attendance_radius_meters,
                    'applicationDeadline' => $task
                        ->application_deadline
                        ->toIso8601String(),
                    'startsAt' => $task
                        ->starts_at
                        ->toIso8601String(),
                    'endsAt' => $task
                        ->ends_at
                        ->toIso8601String(),
                    'workerQuota' => $task->worker_quota,
                    'wageAmount' => $task->wage_amount,
                    'status' => $task->status->value,
                    'statusLabel' => $task->status->label(),
                    'publishedAt' => $task
                        ->published_at
                        ?->toIso8601String(),
                ],
            ],
        );
    }

    /**
     * Mempublikasikan tugas draft.
     */
    public function publish(
        PublishTaskRequest $request,
        Task $task,
    ): RedirectResponse {
        // Periksa kepemilikan dan izin publikasi.
        Gate::authorize('publish', $task);

        // Pastikan status tugas masih draft.
        abort_unless(
            $task->status === TaskStatus::Draft,
            422,
            'Tugas ini tidak dapat dipublikasikan.',
        );

        // Perbarui status dan waktu publikasi.
        $task->forceFill([
            'status' => TaskStatus::Published,
            'published_at' => now(),
        ])->save();

        // Ambil ulang data dari database.
        $task->refresh();

        // Pastikan perubahan berhasil disimpan.
        abort_unless(
            $task->status === TaskStatus::Published,
            500,
            'Gagal menyimpan status publikasi tugas.',
        );

        return redirect()
            ->route('employer.tasks.show', $task)
            ->with(
                'success',
                'Tugas berhasil dipublikasikan dan sekarang dapat dilihat oleh pencari kerja.',
            );
    }
}
