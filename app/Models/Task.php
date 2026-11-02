<?php

namespace App\Models;

use App\Enums\TaskStatus;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $business_id
 * @property string $title
 * @property int $worker_quota
 * @property int $wage_amount
 * @property TaskStatus $status
 * @property Carbon|null $application_deadline
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property Carbon|null $published_at
 * @property-read Business|null $business
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
    'published_at',
])]
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Relasi tugas dengan pemilik UMKM.
     *
     * @return BelongsTo<Business, $this>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * Relasi tugas dengan seluruh lamaran pekerja.
     *
     * @return HasMany<TaskApplication, $this>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(TaskApplication::class);
    }

    /**
     * Mengatur konversi tipe data atribut.
     *
     * @return array<string, string>
     */
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

    /**
     * Scope untuk mengambil tugas yang dipublikasikan.
     *
     * @param  Builder<Task>  $query
     * @return Builder<Task>
     */
    public function scopePublished(
        Builder $query,
    ): Builder {
        return $query->where(
            'status',
            TaskStatus::Published->value,
        );
    }

    /**
     * Scope untuk mengambil tugas yang masih tersedia.
     *
     * @param  Builder<Task>  $query
     * @return Builder<Task>
     */
    public function scopeAvailable(
        Builder $query,
    ): Builder {
        return $query
            ->published()
            ->where(
                'application_deadline',
                '>',
                now(),
            )
            ->where(
                'starts_at',
                '>',
                now(),
            );
    }

    /**
     * Mempublikasikan tugas yang sebelumnya draft.
     */
    public function publish(): void
    {
        $this->forceFill([
            'status' => TaskStatus::Published,
            'published_at' => now(),
        ])->save();
    }
}
