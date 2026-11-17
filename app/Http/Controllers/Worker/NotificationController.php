<?php

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Menampilkan notifikasi milik Worker yang sedang login.
     */
    public function index(Request $request): Response
    {
        $worker = $request->user();

        abort_unless(
            $worker !== null && $worker->role === 'worker',
            403
        );

        $notifications = $worker->notifications()
            ->latest()
            ->limit(50)
            ->get()
            ->map(function (DatabaseNotification $notification): array {
                $data = $notification->data;

                return [
                    'id' => (string) $notification->getKey(),
                    'title' => (string) ($data['title'] ?? 'Notifikasi'),
                    'message' => (string) ($data['message'] ?? ''),
                    'reason' => (string) ($data['reason'] ?? ''),
                    'taskTitle' => (string) ($data['task_title'] ?? ''),
                    'automatic' => (bool) ($data['automatic'] ?? false),
                    'readAt' => $notification->read_at?->toIso8601String(),
                    'createdAt' => $notification->created_at?->format('d/m/Y H:i'),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('worker/notifications/index', [
            'notifications' => $notifications,
            'unreadCount' => $worker->unreadNotifications()->count(),
        ]);
    }

    /**
     * Menandai satu notifikasi milik Worker sebagai dibaca.
     */
    public function markAsRead(Request $request, string $notification): RedirectResponse
    {
        $worker = $request->user();

        abort_unless(
            $worker !== null && $worker->role === 'worker',
            403
        );

        // Query melalui relasi user mencegah membaca notifikasi orang lain.
        $record = $worker->notifications()
            ->whereKey($notification)
            ->firstOrFail();

        $record->markAsRead();

        return to_route('worker.notifications.index');
    }
}
