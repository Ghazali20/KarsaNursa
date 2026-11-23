<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_applications', function (Blueprint $table): void {
            $table->text('applicant_note')->nullable()->after('status');
            $table->string('qualification_document_path')->nullable()->after('applicant_note');
            $table->boolean('schedule_confirmed')->default(false)->after('qualification_document_path');
        });
    }

    public function down(): void
    {
        Schema::table('task_applications', function (Blueprint $table): void {
            $table->dropColumn([
                'applicant_note',
                'qualification_document_path',
                'schedule_confirmed',
            ]);
        });
    }
};
