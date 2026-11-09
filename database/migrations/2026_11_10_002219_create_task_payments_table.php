<?php

use App\Enums\TaskPaymentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('task_application_id')
                ->unique()
                ->constrained('task_applications')
                ->cascadeOnDelete();

            // Nominal Rupiah disimpan sebagai integer.
            $table->unsignedBigInteger('amount');

            $table->string('status', 20)
                ->default(TaskPaymentStatus::Pending->value);

            $table->timestamp('paid_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'status',
                'paid_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_payments');
    }
};
