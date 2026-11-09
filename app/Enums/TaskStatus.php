<?php

namespace App\Enums;

enum TaskStatus: string
{
    case Draft = 'draft';
    case PendingReview = 'pending_review';
    case Published = 'published';
    case Rejected = 'rejected';
    case Closed = 'closed';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::PendingReview => 'Menunggu Peninjauan',
            self::Published => 'Dipublikasikan',
            self::Rejected => 'Ditolak Admin',
            self::Closed => 'Ditutup',
            self::InProgress => 'Sedang Berjalan',
            self::Completed => 'Selesai',
            self::Cancelled => 'Dibatalkan',
        };
    }
}
