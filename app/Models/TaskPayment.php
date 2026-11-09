<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $task_application_id
 * @property int $amount
 * @property string $status
 * @property Carbon|null $paid_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'task_application_id',
    'amount',
    'status',
    'paid_at',
])]
class TaskPayment extends Model
{
    /** @return BelongsTo<TaskApplication, $this> */
    public function application(): BelongsTo
    {
        return $this->belongsTo(
            TaskApplication::class,
            'task_application_id',
        );
    }

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }
}
