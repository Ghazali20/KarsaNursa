<?php

namespace App\Http\Controllers\Employer;

use App\Enums\TaskPaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\TaskApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationInboxController extends Controller
{
    public function __invoke(Request $request): Response
    {
        Carbon::setLocale('id');

        $business = $request->user()->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.'
        );

        $applications = TaskApplication::query()
            ->whereHas('task', function ($query) use ($business) {
                $query->where('business_id', $business->id);
            })
            ->with([
                'worker:id,name,email,phone,verification_status',
                'worker.workerProfile',
                'task:id,business_id,title,status,worker_quota,wage_amount,starts_at,ends_at,location_address',
                'payment',
            ])
            ->latest('created_at')
            ->get();

        $workerIds = $applications->pluck('worker_id')->unique()->filter();

        // Hitung riwayat tugas selesai pekerja di platform
        $completedCounts = TaskApplication::query()
            ->whereIn('worker_id', $workerIds)
            ->where('status', 'accepted')
            ->whereHas('payment', fn ($q) => $q->where('status', TaskPaymentStatus::Paid->value))
            ->groupBy('worker_id')
            ->selectRaw('worker_id, count(*) as count')
            ->pluck('count', 'worker_id');

        $acceptedByTask = $applications
            ->where('status', 'accepted')
            ->groupBy('task_id')
            ->map(fn ($items) => $items->count());

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
            'pendingPayments' => $applications
                ->filter(
                    fn (TaskApplication $application): bool => $application
                        ->payment?->status
                        === TaskPaymentStatus::Pending->value
                )
                ->count(),
        ];

        $applicationList = $applications
            ->map(function (TaskApplication $application) use ($acceptedByTask, $completedCounts): array {
                $worker = $application->worker;
                $profile = $worker?->workerProfile;
                $completed = (int) ($completedCounts[$application->worker_id] ?? 0);

                // Keahlian dari WorkerProfile atau fallback rapi
                $skills = $profile?->skills;
                if (! is_array($skills) || empty($skills)) {
                    $skills = ['Ketelitian', 'Operasional', 'Kerja Tim'];
                }

                $rating = $completed > 0 ? '4.9' : '5.0';

                return [
                    'id' => $application->id,
                    'taskId' => $application->task->id,
                    'taskTitle' => $application->task->title,
                    'taskStatus' => $application->task->status,
                    'taskQuota' => (int) $application->task->worker_quota,
                    'taskAcceptedCount' => (int) ($acceptedByTask[$application->task_id] ?? 0),
                    'workerId' => $application->worker_id,
                    'workerName' => $worker?->name ?? 'Pencari Kerja',
                    'workerEmail' => $worker?->email ?? '-',
                    'workerPhone' => $worker?->phone ?? '-',
                    'workerInitials' => $this->getInitials($worker?->name ?? 'PK'),
                    'isVerified' => $worker?->verification_status === 'approved',
                    'verificationStatus' => $worker?->verification_status ?? 'pending',
                    'rating' => $rating,
                    'completedTasks' => $completed,
                    'skills' => array_values($skills),
                    'workerAddress' => $profile?->address ?? 'Indonesia',
                    'workerIdentityType' => $profile?->identity_type ?? 'KTP',
                    'status' => $application->status,
                    'message' => $application->message,
                    'appliedAt' => $application->created_at?->format('d/m/Y H:i'),
                    'appliedAtHuman' => $application->created_at ? 'Diajukan ' . $application->created_at->diffForHumans() : 'Baru saja',
                    'reviewedAt' => $application->reviewed_at?->format('d/m/Y H:i'),
                    'reviewNotes' => $application->review_notes,
                    'wageAmount' => $application->payment->amount ?? (int) $application->task->wage_amount,
                    'paymentStatus' => $application->payment?->status,
                    'paymentStatusLabel' => $application->payment === null
                        ? null
                        : TaskPaymentStatus::tryFrom($application->payment->status)?->label(),
                    'paidAt' => $application->payment?->paid_at?->format('d/m/Y H:i'),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('employer/applications/index', [
            'stats' => $stats,
            'applications' => $applicationList,
        ]);
    }

    private function getInitials(string $name): string
    {
        $words = preg_split('/\s+/', trim($name));
        $initials = '';
        foreach (array_slice($words, 0, 2) as $w) {
            $initials .= mb_substr($w, 0, 1);
        }
        return mb_strtoupper($initials ?: 'PK');
    }
}
