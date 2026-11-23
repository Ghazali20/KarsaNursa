<?php

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Models\TaskApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class WorkHistoryController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $worker = $request->user();

        abort_unless(
            $worker !== null && $worker->role === 'worker',
            403
        );

        $applications = TaskApplication::query()
            ->where('worker_id', $worker->id)
            ->where('status', 'accepted')
            ->with([
                'task.business',
                'payment',
            ])
            ->latest('updated_at')
            ->get();

        $totalMinutes = $applications->sum(function (TaskApplication $app): int {
            if ($app->checked_in_at !== null && $app->checked_out_at !== null) {
                $minutes = $app->checked_in_at->diffInMinutes($app->checked_out_at);

                return max(60, (int) $minutes);
            }

            return $app->payment?->status === 'paid' ? 240 : 0;
        });

        $completedCount = $applications
            ->filter(fn (TaskApplication $app): bool => $app->payment?->status === 'paid')
            ->count();

        $joinedAt = $worker->created_at ?? Carbon::now();

        $histories = $applications->values()->map(function (TaskApplication $app): array {
            $isPaid = $app->payment?->status === 'paid';
            $isSubmitted = $app->proof_submitted_at !== null;

            $statusKey = $isPaid
                ? 'approved'
                : ($isSubmitted ? 'processing' : 'pending');

            $statusLabel = $isPaid
                ? 'Disetujui'
                : ($isSubmitted ? 'Diproses' : 'Berjalan');

            $dateRef = $app->payment->paid_at
                ?? $app->proof_submitted_at
                ?? $app->checked_out_at
                ?? $app->updated_at;

            return [
                'id' => $app->id,
                'taskTitle' => $app->task->title,
                'businessName' => $app->task->business->name ?? 'UMKM Mitra',
                'dateLabel' => $dateRef?->translatedFormat('d M Y') ?? '-',
                'wageAmount' => (int) ($app->payment->amount ?? $app->task->wage_amount ?? 0),
                'statusKey' => $statusKey,
                'statusLabel' => $statusLabel,
                'rating' => null,
                'reviewComment' => null,
                'canReview' => $isPaid,
            ];
        })->all();

        return Inertia::render('worker/history/index', [
            'profile' => [
                'name' => $worker->name,
                'completedTasksCount' => $completedCount,
                'totalHours' => round($totalMinutes / 60, 1),
                'joinedSince' => $joinedAt->translatedFormat('M Y'),
                'rating' => '0,0',
                'reviewCount' => 0,
            ],
            'histories' => $histories,
        ]);
    }
}
