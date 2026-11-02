<?php

namespace App\Enums;

enum TaskApplicationStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case Withdrawn = 'withdrawn';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Menunggu Persetujuan',
            self::Accepted => 'Diterima',
            self::Rejected => 'Ditolak',
            self::Withdrawn => 'Dibatalkan',
        };
    }
}
