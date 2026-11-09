<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_applications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('task_id')
                ->constrained('tasks')
                ->cascadeOnDelete();

            $table->foreignId('worker_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('status')->default('pending');

            $table->timestamp('applied_at')->useCurrent();

            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('reviewed_at')->nullable();

            $table->text('review_notes')->nullable();

            $table->timestamps();

            // Satu pekerja hanya boleh melamar
            // satu kali untuk tugas yang sama.
            $table->unique(['task_id', 'worker_id']);

            $table->index(['worker_id', 'status']);
            $table->index(['task_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_applications');
    }
};
