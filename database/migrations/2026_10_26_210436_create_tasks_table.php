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

            $table
                ->foreignId('business_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('title', 150);
            $table->string('category', 50);

            $table->text('description');
            $table->text('requirements')->nullable();
            $table->text('instructions')->nullable();

            $table->text('location_address');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);

            $table
                ->unsignedSmallInteger('attendance_radius_meters')
                ->default(150);

            $table->dateTime('application_deadline');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');

            $table->unsignedSmallInteger('worker_quota');

            // Nilai Rupiah disimpan sebagai integer.
            $table->unsignedBigInteger('wage_amount');

            $table
                ->string('status', 30)
                ->default('draft')
                ->index();

            $table->timestamp('published_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index([
                'business_id',
                'status',
            ]);

            $table->index([
                'status',
                'starts_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};