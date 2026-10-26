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
        if (! app()->environment('local')) {
            return;
        }

        $worker = User::query()->updateOrCreate(
            [
                'email' => 'worker@gmail.com',
            ],
            [
                'name' => 'Demo Pencari Kerja',
                'email_verified_at' => now(),
                'role' => 'worker',
                'phone' => '081234567801',
                'verification_status' => 'approved',
                'verified_at' => now(),
                'password' => Hash::make('password'),
            ],
        );

        WorkerProfile::query()->updateOrCreate(
            [
                'user_id' => $worker->id,
            ],
            [
                'identity_type' => 'ktp',
                'date_of_birth' => '2000-01-01',
                'address' => 'Kota Banda Aceh',
                'skills' => [
                    'Pelayanan pelanggan',
                    'Administrasi',
                    'Pengemasan',
                ],
            ],
        );

        $employer = User::query()->updateOrCreate(
            [
                'email' => 'umkm@gmail.com',
            ],
            [
                'name' => 'Demo Pemilik UMKM',
                'email_verified_at' => now(),
                'role' => 'employer',
                'phone' => '081234567802',
                'verification_status' => 'approved',
                'verified_at' => now(),
                'password' => Hash::make('password'),
            ],
        );

        Business::query()->updateOrCreate(
            [
                'user_id' => $employer->id,
            ],
            [
                'name' => 'Karsa Kuliner Nusantara',
                'document_type' => 'nib',
                'category' => 'Kuliner',
                'address' => 'Kota Banda Aceh',
            ],
        );
    }
}