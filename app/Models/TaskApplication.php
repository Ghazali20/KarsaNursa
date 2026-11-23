<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $task_id
 * @property int $worker_id
 * @property string $status
 * @property string|null $message
 * @property string|null $review_notes
 * @property int|null $reviewed_by
 * @property Carbon|null $reviewed_at
 * @property Carbon|null $checked_in_at
 * @property Carbon|null $checked_out_at
 * @property string|null $proof_photo_path
 * @property string|null $activity_notes
 * @property Carbon|null $proof_submitted_at
 * @property string|null $applicant_note
 * @property string|null $qualification_document_path
 * @property bool $schedule_confirmed
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'task_id',
    'worker_id',
    'status',
    'message',
    'applicant_note',
    'qualification_document_path',
    'schedule_confirmed',
    'reviewed_by',
    'reviewed_at',
    'review_notes',
    'checked_in_at',
    'checked_out_at',
    'proof_photo_path',
    'activity_notes',
    'proof_submitted_at',
])]
class TaskApplication extends Model
{
    /** @return BelongsTo<Task, $this> */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /** @return BelongsTo<User, $this> */
    public function worker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'worker_id');
    }

    /** @return HasOne<TaskPayment, $this> */
    public function payment(): HasOne
    {
        return $this->hasOne(
            TaskPayment::class,
            'task_application_id',
        );
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'checked_in_at' => 'datetime',
            'checked_out_at' => 'datetime',
            'proof_submitted_at' => 'datetime',
            'schedule_confirmed' => 'boolean',
        ];
    }
}