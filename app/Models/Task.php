<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $business_id
 * @property string $title
 * @property string|null $category
 * @property string $status
 * @property string|null $description
 * @property string|null $requirements
 * @property string|null $instructions
 * @property string|null $location_address
 * @property int|null $worker_quota
 * @property int|null $wage_amount
 * @property int|null $attendance_radius_meters
 * @property int|null $reviewed_by
 * @property string|null $admin_note
 * @property Carbon|null $application_deadline
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property Carbon|null $submitted_at
 * @property Carbon|null $reviewed_at
 * @property Carbon|null $published_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
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
    'submitted_at',
    'reviewed_at',
    'reviewed_by',
    'admin_note',
    'published_at',
])]
class Task extends Model
{
    use SoftDeletes;

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

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    protected function casts(): array
    {
        return [
            'application_deadline' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'published_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'worker_quota' => 'integer',
            'wage_amount' => 'integer',
            'attendance_radius_meters' => 'integer',
            'reviewed_by' => 'integer',
        ];
    }
}
