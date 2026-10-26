<?php

namespace App\Enums;

enum TaskStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Closed = 'closed';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Published => 'Dipublikasikan',
            self::Closed => 'Ditutup',
            self::InProgress => 'Sedang Berjalan',
            self::Completed => 'Selesai',
            self::Cancelled => 'Dibatalkan',
        };
    }
}