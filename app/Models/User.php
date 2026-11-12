<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

// ========================================
// MODEL USER KARSA NURSA
//
// Mendukung autentikasi:
// 1. Email dan password (manual).
// 2. Login menggunakan akun Google.
//
// Role pengguna:
// - admin
// - employer (Pemilik UMKM)
// - worker (Pencari Kerja)
//
// Akun Worker dan Employer dapat aktif
// tanpa persetujuan Admin.
//
// Email verification, Passkey, dan 2FA
// tidak digunakan sebagai syarat login.
// ========================================

#[Fillable([
    'name',
    'email',
    'password',
    'role',
    'phone',
    'verification_status',

    // Identitas akun Google untuk Laravel Socialite.
    // NULL jika pengguna mendaftar secara manual.
    'google_id',
])]
#[Hidden([
    'password',
    'remember_token',

    // Identitas Google tidak perlu ditampilkan
    // dalam respons data pengguna.
    'google_id',

    // Tetap disembunyikan untuk keamanan
    // selama kolom 2FA lama masih ada.
    'two_factor_secret',
    'two_factor_recovery_codes',
])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    // ========================================
    // RELASI PROFIL PENCARI KERJA
    // ========================================

    /** @return HasOne<WorkerProfile, $this> */
    public function workerProfile(): HasOne
    {
        return $this->hasOne(WorkerProfile::class);
    }

    // ========================================
    // RELASI PROFIL UMKM
    // ========================================

    /** @return HasOne<Business, $this> */
    public function business(): HasOne
    {
        return $this->hasOne(Business::class);
    }

    // ========================================
    // RELASI DOKUMEN VERIFIKASI
    // ========================================

    /** @return HasMany<VerificationDocument, $this> */
    public function verificationDocuments(): HasMany
    {
        return $this->hasMany(VerificationDocument::class);
    }

    // ========================================
    // RELASI LAMARAN PENCARI KERJA
    // ========================================

    /** @return HasMany<TaskApplication, $this> */
    public function taskApplications(): HasMany
    {
        return $this->hasMany(
            TaskApplication::class,
            'worker_id',
        );
    }

    // ========================================
    // CAST ATRIBUT DATABASE
    // ========================================

    protected function casts(): array
    {
        return [
            // Tetap dipertahankan untuk kompatibilitas
            // dan informasi verifikasi email Google.
            'email_verified_at' => 'datetime',

            // Kolom lama waktu persetujuan Admin.
            'verified_at' => 'datetime',

            // Password otomatis disimpan sebagai hash.
            'password' => 'hashed',
        ];
    }
}
