<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use App\Models\TaskApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationInboxController extends Controller
{
    public function __invoke(Request $request): Response
    {
        // Mengambil profil usaha milik Employer.
        $business = $request->user()->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.'
        );

        // Mengambil seluruh lamaran dari tugas UMKM ini.
        $applications = TaskApplication::query()
            ->whereHas('task', function ($query) use ($business) {
                $query->where('business_id', $business->id);
            })
            ->with([
                'worker:id,name,email',
                'task:id,business_id,title,status,worker_quota',
            ])
            ->latest('created_at')
            ->get();

        // Menghitung penerimaan pada setiap tugas.
        $acceptedByTask = $applications
            ->where('status', 'accepted')
            ->groupBy('task_id')
            ->map(fn ($items) => $items->count());

        // Statistik halaman Menerima Pelamar.
        $stats = [
            'total' => $applications->count(),
            'pending' => $applications
                ->where('status', 'pending')
                ->count(),
            'accepted' => $applications
                ->where('status', 'accepted')
                ->count(),
            'rejected' => $applications
                ->where('status', 'rejected')
                ->count(),
        ];

        // Menyiapkan data untuk React.
        $applicationList = $applications
            ->map(fn (TaskApplication $application): array => [
                'id' => $application->id,

                'taskId' => $application->task->id,
                'taskTitle' => $application->task->title,
                'taskStatus' => $application->task->status,

                'taskQuota' =>
                    (int) $application->task->worker_quota,

                'taskAcceptedCount' =>
                    (int) ($acceptedByTask[$application->task_id] ?? 0),

                'workerName' => $application->worker->name,
                'workerEmail' => $application->worker->email,

                'status' => $application->status,

                'appliedAt' => $application->created_at
                    ?->format('d/m/Y H:i'),

                'reviewedAt' => $application->reviewed_at
                    ?->format('d/m/Y H:i'),

                'reviewNotes' => $application->review_notes,
            ])
            ->values()
            ->all();

        return Inertia::render('employer/applications/index', [
            'stats' => $stats,
            'applications' => $applicationList,
        ]);
    }
}
