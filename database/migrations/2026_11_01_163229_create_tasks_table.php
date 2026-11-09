<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();

            // Pemilik tugas
            $table->foreignId('business_id')
                ->constrained('businesses')
                ->cascadeOnDelete();

            // Informasi tugas
            $table->string('title');
            $table->string('category')->nullable();
            $table->text('description')->nullable();
            $table->text('requirements')->nullable();
            $table->text('instructions')->nullable();

            // Lokasi pekerjaan
            $table->text('location_address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->unsignedInteger(
                'attendance_radius_meters'
            )->default(100);

            // Jadwal pekerjaan
            $table->dateTime('application_deadline')->nullable();
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();

            // Kebutuhan tenaga kerja dan upah
            $table->unsignedSmallInteger('worker_quota')
                ->nullable();

            $table->unsignedBigInteger('wage_amount')
                ->nullable();

            // Status publikasi
            $table->string('status')->default('draft');
            $table->dateTime('published_at')->nullable();

            $table->timestamps();

            $table->index(['business_id', 'status']);
            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
