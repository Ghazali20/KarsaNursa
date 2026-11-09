<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(Request $request): Response
    {
        $business = $request->user()?->business;

        abort_if($business === null, 403, 'Profil usaha belum tersedia.');

        $tasks = $business->tasks()
            ->latest('id')
            ->get()
            ->map(fn (Task $task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'status' => $task->status,
                'locationAddress' => $task->location_address,
                'workerQuota' => $task->worker_quota,
                'wageAmount' => $task->wage_amount === null
                    ? null
                    : (int) $task->wage_amount,
                'createdAt' => $task->created_at?->format('d/m/Y H:i'),
                'applicationDeadline' => $task->application_deadline?->format('d/m/Y H:i'),
                'canPublish' => $this->canPublish($task),
            ])
            ->values()
            ->all();

        return Inertia::render('employer/tasks/index', [
            'tasks' => $tasks,
        ]);
    }

    public function create(Request $request): Response
    {
        abort_if(
            $request->user()?->business === null,
            403,
            'Profil usaha belum tersedia.'
        );

        // Form create.tsx milikmu menggunakan state internal,
        // sehingga tidak memerlukan categories/defaults dari server.
        return Inertia::render('employer/tasks/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $business = $request->user()?->business;

        abort_if($business === null, 403, 'Profil usaha belum tersedia.');

        $action = $request->validate([
            'action' => ['required', Rule::in(['draft', 'publish'])],
        ])['action'];

        $isPublish = $action === 'publish';
        $validated = $request->validate($this->taskRules($isPublish));

        $validated['attendance_radius_meters'] ??= 100;
        $validated['status'] = $isPublish ? 'published' : 'draft';
        $validated['published_at'] = $isPublish ? now() : null;

        // business_id hanya diambil dari akun UMKM yang login.
        $business->tasks()->create($validated);

        return to_route('employer.tasks.index')->with(
            'success',
            $isPublish
                ? 'Tugas berhasil dipublikasikan.'
                : 'Draft tugas berhasil disimpan. Kamu bisa melanjutkannya kapan saja.'
        );
    }

    public function edit(Request $request, Task $task): Response
    {
        $task = $this->ownedTask($request, $task);
        abort_unless($task->status === 'draft', 403, 'Hanya draft yang dapat diedit.');

        return Inertia::render('employer/tasks/edit', [
            'task' => [
                'id' => $task->id,
                'title' => $task->title ?? '',
                'category' => $task->category ?? '',
                'description' => $task->description ?? '',
                'requirements' => $task->requirements ?? '',
                'instructions' => $task->instructions ?? '',
                'location_address' => $task->location_address ?? '',
                'latitude' => (string) $task->latitude,
                'longitude' => (string) $task->longitude,
                'attendance_radius_meters' => (string) ($task->attendance_radius_meters ?? 100),
                'application_deadline' => $task->application_deadline?->format('Y-m-d\TH:i') ?? '',
                'starts_at' => $task->starts_at?->format('Y-m-d\TH:i') ?? '',
                'ends_at' => $task->ends_at?->format('Y-m-d\TH:i') ?? '',
                'worker_quota' => $task->worker_quota === null ? '' : (string) $task->worker_quota,
                'wage_amount' => $task->wage_amount === null ? '' : (string) $task->wage_amount,
            ],
        ]);
    }

    public function update(Request $request, Task $task): RedirectResponse
    {
        $task = $this->ownedTask($request, $task);
        abort_unless($task->status === 'draft', 403, 'Hanya draft yang dapat diedit.');

        $validated = $request->validate($this->taskRules(false));
        $validated['attendance_radius_meters'] ??= 100;

        // Status dan published_at sengaja tidak dapat diedit dari form.
        $task->update($validated);

        return to_route('employer.tasks.index')->with(
            'success',
            'Perubahan draft berhasil disimpan.'
        );
    }

    public function publish(Request $request, Task $task): RedirectResponse
    {
        $task = $this->ownedTask($request, $task);

        if ($task->status !== 'draft') {
            return back()->withErrors([
                'status' => 'Hanya tugas berstatus Draft yang dapat dipublikasikan.',
            ]);
        }

        // Validasi ulang data tersimpan pada SAAT publikasi.
        // Draft yang jadwalnya sudah lewat harus diedit dahulu.
        $validator = Validator::make($task->getAttributes(), $this->taskRules(true));

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        $task->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        return to_route('employer.tasks.index')->with(
            'success',
            'Tugas berhasil dipublikasikan dan dapat dilihat Worker.'
        );
    }

    /** Memastikan task hanya dapat diubah oleh pemilik UMKM. */
    private function ownedTask(Request $request, Task $task): Task
    {
        $business = $request->user()?->business;
        abort_if($business === null, 403, 'Profil usaha belum tersedia.');

        return $business->tasks()->whereKey($task->getKey())->firstOrFail();
    }

    /**
     * Draft tetap membutuhkan field yang NOT NULL pada tabel tasks.
     * Saat publish, tambah validasi kelengkapan deskripsi dan jadwal masa depan.
     *
     * @return array<string, list<string>>
     */
    private function taskRules(bool $publishing): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'category' => ['required', 'string', 'max:50'],
            'description' => [
                'required',
                'string',
                ...($publishing ? ['min:20'] : []),
            ],
            'requirements' => ['nullable', 'string', 'max:5000'],
            'instructions' => ['nullable', 'string', 'max:5000'],
            'location_address' => ['required', 'string', 'max:1000'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'attendance_radius_meters' => ['nullable', 'integer', 'between:50,10000'],
            'application_deadline' => [
                'required',
                'date',
                'before:starts_at',
                ...($publishing ? ['after:now'] : []),
            ],
            'starts_at' => ['required', 'date', 'after:application_deadline'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'worker_quota' => ['required', 'integer', 'between:1,100'],
            'wage_amount' => ['required', 'integer', 'min:1'],
        ];
    }

    private function canPublish(Task $task): bool
    {
        return $task->status === 'draft'
            && Validator::make($task->getAttributes(), $this->taskRules(true))->passes();
    }
}
