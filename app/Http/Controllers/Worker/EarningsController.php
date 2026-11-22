<?php

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Models\TaskApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class EarningsController extends Controller
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

        $now = Carbon::now();

        $availableEarnings = $applications
            ->filter(fn (TaskApplication $app): bool => $app->payment?->status === 'paid')
            ->sum(fn (TaskApplication $app): int => (int) ($app->payment->amount ?? $app->task->wage_amount ?? 0));

        $monthlyEarnings = $applications
            ->filter(function (TaskApplication $app) use ($now): bool {
                if ($app->payment?->status !== 'paid') {
                    return false;
                }
                $paidDate = $app->payment->paid_at ?? $app->updated_at;

                return $paidDate !== null
                    && $paidDate->year === $now->year
                    && $paidDate->month === $now->month;
            })
            ->sum(fn (TaskApplication $app): int => (int) ($app->payment->amount ?? $app->task->wage_amount ?? 0));

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

        $items = $applications->map(function (TaskApplication $app): array {
            $isPaid = $app->payment?->status === 'paid';
            $isSubmitted = $app->proof_submitted_at !== null;

            $statusKey = $isPaid
                ? 'approved'
                : ($isSubmitted ? 'processing' : 'pending');

            $statusText = $isPaid
                ? 'Disetujui'
                : ($isSubmitted ? 'Diproses' : 'Berjalan');

            $dateRef = $app->payment->paid_at
                ?? $app->proof_submitted_at
                ?? $app->updated_at;

            $hoursFormatted = '-';
            if ($app->checked_in_at !== null && $app->checked_out_at !== null) {
                $mins = max(1, (int) $app->checked_in_at->diffInMinutes($app->checked_out_at));
                $h = intdiv($mins, 60);
                $m = $mins % 60;
                $mFormatted = sprintf('%02d', $m);
                $hoursFormatted = $m > 0 ? "{$h}j {$mFormatted}m" : "{$h}j";
            } elseif ($isPaid) {
                $hoursFormatted = '4j';
            }

            return [
                'id' => $app->id,
                'taskTitle' => $app->task->title,
                'businessName' => $app->task->business->name ?? 'UMKM Mitra',
                'dateLabel' => $dateRef?->translatedFormat('d M Y') ?? '-',
                'hoursLabel' => $hoursFormatted,
                'wageAmount' => (int) ($app->payment->amount ?? $app->task->wage_amount ?? 0),
                'statusKey' => $statusKey,
                'statusLabel' => $statusText,
            ];
        })->values()->all();

        return Inertia::render('worker/earnings/index', [
            'periodLabel' => $now->translatedFormat('F Y'),
            'availableEarnings' => (int) $availableEarnings,
            'monthlyEarnings' => (int) $monthlyEarnings,
            'totalHours' => round($totalMinutes / 60, 1),
            'completedCount' => $completedCount,
            'items' => $items,
        ]);
    }
}
