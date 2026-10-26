<?php

namespace App\Models;

use App\Enums\TaskStatus;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'business_id',
    'title',
    'category',
    'description',
    'requirements',
    'instructions',
    'location_address',
    'latitude',
    'longitude',
    'attendance_radius_meters',
    'application_deadline',
    'starts_at',
    'ends_at',
    'worker_quota',
    'wage_amount',
    'status',
    'published_at',
])]
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory, SoftDeletes;

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'application_deadline' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'worker_quota' => 'integer',
            'wage_amount' => 'integer',
            'status' => TaskStatus::class,
            'published_at' => 'datetime',
        ];
    }
}