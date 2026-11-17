<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\User;
use App\Models\WorkerProfile;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Seeder hanya dijalankan pada environment lokal.
        if (! app()->environment('local')) {
            return;
        }

        // ========================================
        // 1. AKUN ADMIN KARSA NURSA
        // ========================================

        $admin = User::query()->updateOrCreate(
            [
                'email' => 'admin@gmail.com',
            ],
            [
                'name' => 'Administrator KarsaNursa',
                'role' => 'admin',
                'phone' => '081234567800',
                'verification_status' => 'approved',
                'password' => Hash::make('Admin123!'),
            ],
        );

        $admin->forceFill([
            'email_verified_at' => now(),
            'verified_at' => now(),
        ])->save();

        // ========================================
        // 2. AKUN PEMILIK UMKM
        // Muhammad Ghazali
        // ========================================

        $employer = User::query()->updateOrCreate(
            [
                'email' => 'umkm@gmail.com',
            ],
            [
                'name' => 'Muhammad Ghazali',
                'role' => 'employer',
                'phone' => '081234567802',
                'verification_status' => 'approved',
                'password' => Hash::make('Password'),
            ],
        );

        $employer->forceFill([
            'email_verified_at' => now(),
            'verified_at' => now(),
        ])->save();

        // Membuat profil usaha untuk akun UMKM.
        Business::query()->updateOrCreate(
            [
                'user_id' => $employer->id,
            ],
            [
                'name' => 'UMKM Muhammad Ghazali',
                'document_type' => 'nib',
                'category' => 'Kuliner',
                'address' => 'Alamat usaha percobaan',
            ],
        );

        // ========================================
        // 3. AKUN PENCARI KERJA (WORKER)
        // Muhammad Nurudin
        // ========================================

        $worker = User::query()->updateOrCreate(
            [
                'email' => 'worker@gmail.com',
            ],
            [
                'name' => 'Muhammad Nurudin',
                'role' => 'worker',
                'phone' => '081234567801',
                'verification_status' => 'approved',
                'password' => Hash::make('Password'),
            ],
        );

        $worker->forceFill([
            'email_verified_at' => now(),
            'verified_at' => now(),
        ])->save();

        // Membuat profil untuk akun Worker.
        WorkerProfile::query()->updateOrCreate(
            [
                'user_id' => $worker->id,
            ],
            [
                'identity_type' => 'ktp',
                'date_of_birth' => null,
                'address' => 'Alamat percobaan',
                'skills' => [
                    'Pengemasan',
                    'Pelayanan pelanggan',
                    'Administrasi',
                ],
            ],
        );
    }
}
