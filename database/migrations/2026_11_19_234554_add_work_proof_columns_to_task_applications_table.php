<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_applications', function (Blueprint $table): void {$table->timestamp('checked_in_at')->nullable()->after('review_notes');
            $table->timestamp('checked_out_at')->nullable()->after('checked_in_at');$table->string('proof_photo_path')->nullable()->after('checked_out_at');
            $table->text('activity_notes')->nullable()->after('proof_photo_path');$table->timestamp('proof_submitted_at')->nullable()->after('activity_notes');
        });
    }

    public function down(): void
    {
        Schema::table('task_applications', function (Blueprint $table): void {$table->dropColumn([
                'checked_in_at',
                'checked_out_at',
                'proof_photo_path',
                'activity_notes',
                'proof_submitted_at',
            ]);
        });
    }
};