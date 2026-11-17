<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TaskApplicationRejected extends Notification
{
    use Queueable;

    public function __construct(
        public readonly int $taskId,
        public readonly int $applicationId,
        public readonly string $taskTitle,
        public readonly string $reason,
        public readonly bool $automatic = false,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, int|string|bool> */
    public function toArray(object $notifiable): array
    {
        return [
            'event' => 'task_application_rejected',
            'task_id' => $this->taskId,
            'application_id' => $this->applicationId,
            'title' => $this->automatic
                ? 'Lamaran ditolak otomatis - kuota penuh'
                : 'Lamaran ditolak oleh UMKM',
            'task_title' => $this->taskTitle,
            'reason' => $this->reason,
            'message' => $this->automatic
                ? "Lamaran Anda untuk tugas {$this->taskTitle} otomatis ditolak karena kuota pekerja sudah penuh."
                : "Lamaran Anda untuk tugas {$this->taskTitle} ditolak oleh UMKM.",
            'automatic' => $this->automatic,
            'url' => '/worker/applications',
        ];
    }
}
