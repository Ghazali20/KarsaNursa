<?php

namespace App\Http\Middleware;

use App\Models\TaskApplication;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ?? null,
                ] : null,
            ],
            'workerNotifications' => function () use ($user) {
                if ($user === null || ($user->role ?? null) !== 'worker') {
                    return [];
                }

                $applications = TaskApplication::query()
                    ->where('worker_id', $user->id)
                    ->with(['task.business', 'payment'])
                    ->latest('updated_at')
                    ->limit(15)
                    ->get();

                $notifications = [];

                foreach ($applications as $app) {
                    $taskTitle = $app->task->title ?? 'Tugas';
                    $businessName = $app->task->business->name ?? 'UMKM Mitra';

                    if ($app->payment?->status === 'paid') {
                        $amountFormatted = 'Rp '.number_format(
                            (int) $app->payment->amount,
                            0,
                            ',',
                            '.'
                        );
                        $notifications[] = [
                            'id' => "paid-{$app->id}",
                            'type' => 'paid',
                            'title' => 'Upah telah diberikan',
                            'description' => "Pembayaran {$amountFormatted} untuk \"{$taskTitle}\" ({$businessName}) telah tercatat.",
                            'timeLabel' => ($app->payment->paid_at ?? $app->updated_at)?->diffForHumans() ?? 'Baru saja',
                            'href' => '/worker/earnings',
                        ];
                    } elseif ($app->proof_submitted_at !== null) {
                        $notifications[] = [
                            'id' => "proof-{$app->id}",
                            'type' => 'proof',
                            'title' => 'Bukti kerja terkirim',
                            'description' => "Laporan foto & catatan untuk \"{$taskTitle}\" telah dikirim ke {$businessName}.",
                            'timeLabel' => $app->proof_submitted_at->diffForHumans(),
                            'href' => '/worker/applications',
                        ];
                    }

                    if ($app->status === 'accepted') {
                        $notifications[] = [
                            'id' => "accepted-{$app->id}",
                            'type' => 'accepted',
                            'title' => 'Lamaran diterima',
                            'description' => "Kamu diterima pada tugas \"{$taskTitle}\" di {$businessName}. Silakan lakukan check-in.",
                            'timeLabel' => ($app->reviewed_at ?? $app->created_at)?->diffForHumans() ?? 'Baru saja',
                            'href' => '/worker/applications',
                        ];
                    } elseif ($app->status === 'rejected') {
                        $notifications[] = [
                            'id' => "rejected-{$app->id}",
                            'type' => 'rejected',
                            'title' => 'Lamaran belum terpilih',
                            'description' => "Lamaran untuk \"{$taskTitle}\" di {$businessName} belum berhasil kali ini.",
                            'timeLabel' => ($app->reviewed_at ?? $app->created_at)?->diffForHumans() ?? 'Baru saja',
                            'href' => '/worker/tasks',
                        ];
                    }
                }

                return array_slice($notifications, 0, 10);
            },
        ];
    }
}
