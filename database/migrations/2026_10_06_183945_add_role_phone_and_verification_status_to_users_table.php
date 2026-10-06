<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')
                ->default('worker')
                ->after('email');

            $table->string('phone')
                ->nullable()
                ->after('role');

            $table->string('verification_status')
                ->default('pending')
                ->after('phone');

            $table->timestamp('verified_at')
                ->nullable()
                ->after('verification_status');

            $table->index('role');
            $table->index('verification_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['verification_status']);

            $table->dropColumn([
                'role',
                'phone',
                'verification_status',
                'verified_at',
            ]);
        });
    }
};
