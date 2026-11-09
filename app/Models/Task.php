<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

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
    /** @return HasMany<TaskApplication, $this> */
    public function applications(): HasMany
    {
        return $this->hasMany(TaskApplication::class);
    }
    
    /** @return BelongsTo<Business, $this> */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    protected function casts(): array
    {
        return [
            'application_deadline' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'published_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'worker_quota' => 'integer',
            'wage_amount' => 'integer',
            'attendance_radius_meters' => 'integer',
        ];
    }
}
