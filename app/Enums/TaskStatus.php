<?php

namespace App\Enums;

enum TaskStatus: string
{
    // UMKM masih menyusun tugas.
    case Draft = 'draft';

    // Tugas menunggu persetujuan Admin.
    case PendingReview = 'pending_review';

    // Admin menyetujui tugas.
    // Tugas dapat dilihat Pencari Kerja.
    case Published = 'published';

    // Admin menolak publikasi tugas.
    case Rejected = 'rejected';

    // BARU: Kuota pekerja sudah terpenuhi.
    // Tugas tidak bisa menerima pelamar lagi.
    case Closed = 'closed';

    /**
     * Nama status untuk ditampilkan
     * pada antarmuka KarsaNursa.
     */
    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::PendingReview => 'Menunggu Persetujuan',
            self::Published => 'Dipublikasikan',
            self::Rejected => 'Ditolak Admin',
            self::Closed => 'Kuota Penuh',
        };
    }
}
