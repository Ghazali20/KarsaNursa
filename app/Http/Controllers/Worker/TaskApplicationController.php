<?php

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TaskApplicationController extends Controller
{

    public function index(Request $request): Response
    {
        $worker = $request->user();

        abort_unless(
            $worker !== null && $worker->role === 'worker',
            403
        );

        $applications = TaskApplication::query()
            ->where('worker_id', $worker->id)
            ->with([
                'task.business',
                'payment',
            ])
            ->latest('created_at')
            ->get()
            ->map(fn (TaskApplication $application): array => [
                'id' => $application->id,

                'taskId' => $application->task->id,
                'taskTitle' => $application->task->title,
                'businessName' => $application->task->business->name,

                'locationAddress' => $application->task->location_address,
                'startsAt' => $application->task->starts_at
                    ?->format('d/m/Y H:i'),
                'endsAt' => $application->task->ends_at
                    ?->format('d/m/Y H:i'),

                'wageAmount' => $application->payment->amount
                    ?? (int) $application->task->wage_amount,

                'paymentStatus' => $application->payment?->status,
                'paidAt' => $application->payment?->paid_at
                    ?->format('d/m/Y H:i'),

                'status' => $application->status,

                'appliedAt' => $application->created_at
                    ?->format('d/m/Y H:i'),

                'reviewNotes' => $application->review_notes,
                'reviewedAt' => $application->reviewed_at
                    ?->format('d/m/Y H:i'),

                'checkedInAt' => $application->checked_in_at
                    ?->format('d/m/Y H:i'),

                'checkedInIso' => $application->checked_in_at
                    ?->toIso8601String(),

                'checkedOutAt' => $application->checked_out_at
                    ?->format('d/m/Y H:i'),

                'checkedOutIso' => $application->checked_out_at
                    ?->toIso8601String(),

                'proofPhotoUrl' => $application->proof_photo_path
                    ? Storage::url($application->proof_photo_path)
                    : null,

                'activityNotes' => $application->activity_notes,

                'proofSubmittedAt' => $application->proof_submitted_at
                    ?->format('d/m/Y H:i'),
            ])
            ->values()
            ->all();

        return Inertia::render('worker/applications/index', [
            'applications' => $applications,
        ]);
    }


    public function store(
        Request $request,
        Task $task
    ): RedirectResponse {
        $worker = $request->user();

        abort_unless(
            $worker !== null && $worker->role === 'worker',
            403
        );

        DB::transaction(function () use ($worker, $task): void {
            $lockedTask = Task::query()
                ->with('business.user')
                ->lockForUpdate()
                ->findOrFail($task->id);

            $isAvailable =
                $lockedTask->getRawOriginal('status') === 'published'
                && $lockedTask->published_at !== null
                && $lockedTask->application_deadline !== null
                && Carbon::parse($lockedTask->application_deadline)->isFuture()
                && $lockedTask->business?->user?->verification_status === 'approved';

            abort_unless($isAvailable, 404);

            $alreadyApplied = TaskApplication::query()
                ->where('task_id', $lockedTask->id)
                ->where('worker_id', $worker->id)
                ->exists();

            if ($alreadyApplied) {
                throw ValidationException::withMessages([
                    'application' => 'Kamu sudah pernah melamar tugas ini.',
                ]);
            }

            $quota = (int) $lockedTask->worker_quota;
            $acceptedCount = TaskApplication::query()
                ->where('task_id', $lockedTask->id)
                ->where('status', 'accepted')
                ->count();

            $remainingQuota = max(0, $quota - $acceptedCount);

            if ($quota < 1 || $remainingQuota <= 0) {
                throw ValidationException::withMessages([
                    'application' => 'Maaf, kuota pekerja untuk tugas ini sudah penuh. Silakan mencari tugas lainnya.',
                ]);
            }

            TaskApplication::query()->create([
                'task_id' => $lockedTask->id,
                'worker_id' => $worker->id,
                'status' => 'pending',
            ]);
        }, 3);

        return to_route('worker.tasks.show', $task)->with(
            'success',
            'Lamaran berhasil dikirim dan menunggu seleksi UMKM.'
        );
    }

    public function checkIn(
        Request $request,
        TaskApplication $application
    ): RedirectResponse {
        $worker = $request->user();

        abort_unless(
            $worker !== null
                && $worker->role === 'worker'
                && $application->worker_id === $worker->id
                && $application->status === 'accepted',
            403
        );

        if ($application->checked_in_at === null) {
            $application->update([
                'checked_in_at' => now(),
            ]);
        }

        return back()->with('success', 'Check-in berhasil dicatat.');
    }

    public function checkOut(
        Request $request,
        TaskApplication $application
    ): RedirectResponse {
        $worker = $request->user();

        abort_unless(
            $worker !== null
                && $worker->role === 'worker'
                && $application->worker_id === $worker->id
                && $application->status === 'accepted',
            403
        );

        if ($application->checked_in_at === null) {
            throw ValidationException::withMessages([
                'attendance' => 'Lakukan Check-in terlebih dahulu sebelum Check-out.',
            ]);
        }

        if ($application->checked_out_at === null) {
            $application->update([
                'checked_out_at' => now(),
            ]);
        }

        return back()->with('success', 'Check-out berhasil dicatat.');
    }

    public function submitProof(
        Request $request,
        TaskApplication $application
    ): RedirectResponse {
        $worker = $request->user();

        abort_unless(
            $worker !== null
                && $worker->role === 'worker'
                && $application->worker_id === $worker->id
                && $application->status === 'accepted',
            403
        );

        $validated = $request->validate([
            'proof_photo' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:5120'],
            'activity_notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'proof_photo.required' => 'Foto bukti hasil kerja wajib diunggah.',
            'proof_photo.image' => 'File bukti harus berupa gambar.',
            'proof_photo.mimes' => 'Format foto harus JPG atau PNG.',
            'proof_photo.max' => 'Ukuran foto maksimal 5 MB.',
        ]);

        if ($application->proof_photo_path) {
            Storage::disk('public')->delete($application->proof_photo_path);
        }

        $path = $request->file('proof_photo')->store('task-proofs', 'public');

        $application->update([
            'checked_in_at' => $application->checked_in_at ?? now(),
            'checked_out_at' => $application->checked_out_at ?? now(),
            'proof_photo_path' => $path,
            'activity_notes' => $validated['activity_notes'] ?? null,
            'proof_submitted_at' => now(),
        ]);

        return back()->with('success', 'Bukti penyelesaian tugas berhasil dikirim ke UMKM.');
    }
}
