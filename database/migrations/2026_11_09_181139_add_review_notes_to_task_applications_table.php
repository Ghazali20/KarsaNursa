<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('task_applications', 'review_notes')) {
            Schema::table('task_applications', function (Blueprint $table): void {
                $table->text('review_notes')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('task_applications', 'review_notes')) {
            Schema::table('task_applications', function (Blueprint $table): void {
                $table->dropColumn('review_notes');
            });
        }
    }
};
