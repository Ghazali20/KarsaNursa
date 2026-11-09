<?php

namespace App\Http\Controllers\Employer;

use App\Enums\TaskStatus;
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
                'statusLabel' => TaskStatus::tryFrom($task->status)?->label()
                    ?? ucfirst($task->status),
                'locationAddress' => $task->location_address,
                'workerQuota' => $task->worker_quota,
                'wageAmount' => $task->wage_amount === null
                    ? null
                    : (int) $task->wage_amount,
                'createdAt' => $task->created_at?->format('d/m/Y H:i'),
                'applicationDeadline' => $task->application_deadline?->format('d/m/Y H:i'),
                'adminNote' => $task->admin_note,
                'canEdit' => $this->canEdit($task),
                'canSubmit' => $this->canSubmit($task),
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

        return Inertia::render('employer/tasks/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $business = $request->user()?->business;

        abort_if($business === null, 403, 'Profil usaha belum tersedia.');

        $action = $request->validate([
            'action' => [
                'required',
                Rule::in([
                    'draft',
                    'submit',
                ]),
            ],
        ])['action'];

        $isSubmit = $action === 'submit';

        $validated = $request->validate(
            $this->taskRules($isSubmit)
        );

        $validated['attendance_radius_meters'] ??= 100;
        $validated['status'] = $isSubmit
            ? TaskStatus::PendingReview->value
            : TaskStatus::Draft->value;
        $validated['submitted_at'] = $isSubmit ? now() : null;
        $validated['reviewed_at'] = null;
        $validated['reviewed_by'] = null;
        $validated['admin_note'] = null;
        $validated['published_at'] = null;

        $business->tasks()->create($validated);

        return to_route('employer.tasks.index')->with(
            'success',
            $isSubmit
                ? 'Tugas berhasil diajukan dan sedang menunggu peninjauan admin.'
                : 'Draft tugas berhasil disimpan. Kamu bisa melanjutkannya kapan saja.'
        );
    }

    public function edit(Request $request, Task $task): Response
    {
        $task = $this->ownedTask($request, $task);

        abort_unless(
            $this->canEdit($task),
            403,
            'Hanya tugas draft atau tugas yang ditolak admin yang dapat diedit.'
        );

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
                'worker_quota' => $task->worker_quota === null
                    ? ''
                    : (string) $task->worker_quota,
                'wage_amount' => $task->wage_amount === null
                    ? ''
                    : (string) $task->wage_amount,
                'status' => $task->status,
                'admin_note' => $task->admin_note,
            ],
        ]);
    }

    public function update(Request $request, Task $task): RedirectResponse
    {
        $task = $this->ownedTask($request, $task);

        abort_unless(
            $this->canEdit($task),
            403,
            'Hanya tugas draft atau tugas yang ditolak admin yang dapat diedit.'
        );

        $validated = $request->validate(
            $this->taskRules(false)
        );

        $validated['attendance_radius_meters'] ??= 100;

        $task->update($validated);

        return to_route('employer.tasks.index')->with(
            'success',
            'Perubahan tugas berhasil disimpan.'
        );
    }

    public function submit(Request $request, Task $task): RedirectResponse
    {
        $task = $this->ownedTask($request, $task);

        if (! in_array(
            $task->status,
            [
                TaskStatus::Draft->value,
                TaskStatus::Rejected->value,
            ],
            true,
        )) {
            return back()->withErrors([
                'status' => 'Hanya tugas draft atau yang ditolak admin yang dapat diajukan.',
            ]);
        }

        // Jadwal dan kelengkapan divalidasi kembali saat tugas diajukan.
        $validator = Validator::make(
            $task->getAttributes(),
            $this->taskRules(true)
        );

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        $task->update([
            'status' => TaskStatus::PendingReview->value,
            'submitted_at' => now(),
            'reviewed_at' => null,
            'reviewed_by' => null,
            'admin_note' => null,
            'published_at' => null,
        ]);

        return to_route('employer.tasks.index')->with(
            'success',
            'Tugas berhasil diajukan dan sedang menunggu peninjauan admin.'
        );
    }

    /**
     * Memastikan tugas hanya dapat diubah pemilik UMKM.
     */
    private function ownedTask(Request $request, Task $task): Task
    {
        $business = $request->user()?->business;

        abort_if($business === null, 403, 'Profil usaha belum tersedia.');

        return $business->tasks()
            ->whereKey($task->getKey())
            ->firstOrFail();
    }

    /**
     * Draft tetap membutuhkan field yang NOT NULL pada tabel tasks.
     * Saat diajukan, kelengkapan dan jadwal masa depan divalidasi lagi.
     *
     * @return array<string, list<string>>
     */
    private function taskRules(bool $submitting): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'category' => ['required', 'string', 'max:50'],
            'description' => [
                'required',
                'string',
                ...($submitting ? ['min:20'] : []),
            ],
            'requirements' => ['nullable', 'string', 'max:5000'],
            'instructions' => ['nullable', 'string', 'max:5000'],
            'location_address' => ['required', 'string', 'max:1000'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'attendance_radius_meters' => [
                'nullable',
                'integer',
                'between:50,10000',
            ],
            'application_deadline' => [
                'required',
                'date',
                'before:starts_at',
                ...($submitting ? ['after:now'] : []),
            ],
            'starts_at' => [
                'required',
                'date',
                'after:application_deadline',
            ],
            'ends_at' => [
                'required',
                'date',
                'after:starts_at',
            ],
            'worker_quota' => [
                'required',
                'integer',
                'between:1,100',
            ],
            'wage_amount' => [
                'required',
                'integer',
                'min:1',
            ],
        ];
    }

    private function canEdit(Task $task): bool
    {
        return in_array(
            $task->status,
            [
                TaskStatus::Draft->value,
                TaskStatus::Rejected->value,
            ],
            true,
        );
    }

    private function canSubmit(Task $task): bool
    {
        return $this->canEdit($task)
            && Validator::make(
                $task->getAttributes(),
                $this->taskRules(true)
            )->passes();
    }
}
