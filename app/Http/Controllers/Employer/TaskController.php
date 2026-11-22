<?php

namespace App\Http\Controllers\Employer;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(Request $request): Response
    {
        Carbon::setLocale('id');

        $business = $request->user()?->business;

        abort_if($business === null, 403, 'Profil usaha belum tersedia.');

        $tasks = $business->tasks()
            ->withCount(['applications as accepted_count' => function ($query) {
                $query->where('status', 'accepted');
            }])
            ->withCount(['applications as pending_count' => function ($query) {
                $query->where('status', 'pending');
            }])
            ->latest('id')
            ->get()
            ->map(function (Task $task): array {
                $accepted = (int) ($task->accepted_count ?? 0);
                $quota = (int) ($task->worker_quota ?? 1);

                // Mapping status database ke badge UI
                // Kategori: Draft, Menunggu Review, Mencari Pekerja, Berlangsung, Ditolak, Selesai, Dibatalkan
                $rawStatus = strtolower((string) $task->status);
                $uiStatus = 'draft';
                $uiStatusLabel = 'Draft';

                if ($rawStatus === 'draft') {
                    $uiStatus = 'draft';
                    $uiStatusLabel = 'Draft';
                } elseif (in_array($rawStatus, ['pending_review', 'in_review', 'submitted'], true)) {
                    $uiStatus = 'pending_review';
                    $uiStatusLabel = 'Menunggu Review';
                } elseif ($rawStatus === 'rejected') {
                    $uiStatus = 'rejected';
                    $uiStatusLabel = 'Ditolak';
                } elseif (in_array($rawStatus, ['in_progress', 'closed'], true)) {
                    $uiStatus = 'in_progress';
                    $uiStatusLabel = 'Berlangsung';
                } elseif ($rawStatus === 'completed') {
                    $uiStatus = 'completed';
                    $uiStatusLabel = 'Selesai';
                } elseif ($rawStatus === 'cancelled') {
                    $uiStatus = 'cancelled';
                    $uiStatusLabel = 'Dibatalkan';
                } elseif (in_array($rawStatus, ['published', 'open'], true)) {
                    if ($accepted >= $quota && $quota > 0) {
                        $uiStatus = 'in_progress';
                        $uiStatusLabel = 'Berlangsung';
                    } else {
                        $uiStatus = 'published';
                        $uiStatusLabel = 'Mencari Pekerja';
                    }
                } else {
                    $uiStatus = $rawStatus;
                    $uiStatusLabel = ucfirst(str_replace('_', ' ', $rawStatus));
                }

                // Format jadwal pelaksanaan
                $schedule = '-';
                if ($task->starts_at) {
                    $schedule = $task->starts_at->translatedFormat('d M Y').' · '.$task->starts_at->format('H:i').' WIB';
                } elseif ($task->created_at) {
                    $schedule = 'Dibuat · '.$task->created_at->translatedFormat('d M Y');
                }

                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'category' => $task->category,
                    'status' => $task->status,
                    'statusLabel' => TaskStatus::tryFrom($task->status)?->label() ?? ucfirst($task->status),
                    'uiStatus' => $uiStatus,
                    'uiStatusLabel' => $uiStatusLabel,
                    'locationAddress' => $task->location_address,
                    'workerQuota' => $task->worker_quota,
                    'acceptedCount' => $accepted,
                    'pendingCount' => (int) ($task->pending_count ?? 0),
                    'wageAmount' => $task->wage_amount === null ? null : (int) $task->wage_amount,
                    'startsAt' => $task->starts_at ? $task->starts_at->translatedFormat('d M Y · H:i').' WIB' : null,
                    'endsAt' => $task->ends_at ? $task->ends_at->translatedFormat('d M Y · H:i').' WIB' : null,
                    'scheduleDisplay' => $schedule,
                    'createdAt' => $task->created_at?->format('d/m/Y H:i'),
                    'applicationDeadline' => $task->application_deadline?->format('d/m/Y H:i'),
                    'adminNote' => $task->admin_note,
                    'description' => $task->description,
                    'requirements' => $task->requirements,
                    'instructions' => $task->instructions,
                    'canEdit' => $this->canEdit($task),
                    'canSubmit' => $this->canSubmit($task),
                ];
            })
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

        // Penanganan Latitude & Longitude default di balik layar
        if (! $request->filled('latitude')) {
            $request->merge(['latitude' => -6.2088]);
        }
        if (! $request->filled('longitude')) {
            $request->merge(['longitude' => 106.8456]);
        }
        if (! $request->filled('attendance_radius_meters')) {
            $request->merge(['attendance_radius_meters' => 100]);
        }

        // Fallback nilai wajib database saat user memilih Simpan Draft
        if (! $isSubmit) {
            if (! $request->filled('category')) {
                $request->merge(['category' => 'Lainnya']);
            }
            if (! $request->filled('description')) {
                $request->merge(['description' => 'Draft rincian tugas mikro.']);
            }
            if (! $request->filled('location_address')) {
                $request->merge(['location_address' => $business->address ?: 'Alamat belum ditentukan']);
            }
            if (! $request->filled('worker_quota')) {
                $request->merge(['worker_quota' => 1]);
            }
            if (! $request->filled('wage_amount')) {
                $request->merge(['wage_amount' => 50000]);
            }
            if (! $request->filled('starts_at')) {
                $request->merge(['starts_at' => now()->addDays(2)->format('Y-m-d H:i:s')]);
            }
            if (! $request->filled('ends_at')) {
                $startsAt = Carbon::parse($request->input('starts_at'));
                $request->merge(['ends_at' => $startsAt->copy()->addHours(2)->format('Y-m-d H:i:s')]);
            }
            if (! $request->filled('application_deadline')) {
                $startsAt = Carbon::parse($request->input('starts_at'));
                $request->merge(['application_deadline' => $startsAt->copy()->subHours(2)->format('Y-m-d H:i:s')]);
            }
        }

        $messages = [
            'title.required' => 'Judul tugas wajib diisi.',
            'category.required' => 'Pilih kategori pekerjaan.',
            'description.required' => 'Deskripsi pekerjaan wajib diisi.',
            'description.min' => 'Deskripsi minimal 20 karakter.',
            'location_address.required' => 'Alamat lokasi pekerjaan wajib diisi.',
            'application_deadline.required' => 'Batas penerimaan lamaran wajib diisi.',
            'application_deadline.after' => 'Batas lamaran harus setelah waktu sekarang.',
            'application_deadline.before' => 'Batas lamaran harus sebelum waktu mulai tugas.',
            'starts_at.required' => 'Tanggal dan waktu mulai tugas wajib diisi.',
            'starts_at.after' => 'Waktu mulai tugas harus setelah batas lamaran.',
            'ends_at.required' => 'Waktu selesai tugas wajib diisi.',
            'ends_at.after' => 'Waktu selesai harus setelah waktu mulai.',
            'worker_quota.required' => 'Kuota pekerja wajib diisi.',
            'worker_quota.between' => 'Kuota pekerja harus antara 1 sampai 100 orang.',
            'wage_amount.required' => 'Upah bersih per pekerja wajib diisi.',
            'wage_amount.min' => 'Upah pekerja minimal Rp 1.',
        ];

        $validated = $request->validate(
            $this->taskRules($isSubmit),
            $messages
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
     * Aturan validasi tugas.
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
