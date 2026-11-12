<?php

namespace Database\Seeders;

use App\Models\User;
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

        User::query()->updateOrCreate(
            [
                'email' => 'admin@gmail.com',
            ],
            [
                'name' => 'Administrator KarsaNursa',
                'email_verified_at' => now(),
                'role' => 'admin',
                'phone' => '081234567800',
                'verification_status' => 'approved',
                'verified_at' => now(),
                'password' => Hash::make('Admin123!'),
            ],
        );
    }
}
