<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployerTaskPublicationTest extends TestCase
{
    use RefreshDatabase;
    protected function setUp(): void
{
    parent::setUp();

    $this->withoutVite();
}

    public function test_approved_employer_can_view_create_task_page(): void
    {
        $employer = $this->createEmployer();

        $this
            ->actingAs($employer)
            ->get(route('employer.tasks.create'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('employer/tasks/create')
                    ->has('categories')
                    ->where(
                        'defaults.attendanceRadiusMeters',
                        150,
                    ),
            );
    }

    public function test_worker_cannot_view_create_task_page(): void
    {
        $worker = User::factory()->create();

        $this
            ->actingAs($worker)
            ->get(route('employer.tasks.create'))
            ->assertForbidden();
    }

    public function test_employer_can_save_task_as_draft(): void
    {
        $employer = $this->createEmployer();

        $response = $this
            ->actingAs($employer)
            ->post(
                route('employer.tasks.store'),
                $this->validTaskData([
                    'action' => 'draft',
                ]),
            );

        $response->assertRedirect(
            route('employer.dashboard'),
        );

        $this->assertDatabaseHas('tasks', [
            'business_id' => $employer->business->id,
            'title' => 'Membantu Pengemasan Produk',
            'status' => 'draft',
            'published_at' => null,
        ]);
    }

    public function test_employer_can_publish_task(): void
    {
        $employer = $this->createEmployer();

        $response = $this
            ->actingAs($employer)
            ->post(
                route('employer.tasks.store'),
                $this->validTaskData([
                    'action' => 'publish',
                ]),
            );

        $response->assertRedirect(
            route('employer.dashboard'),
        );

        $task = $employer
            ->business
            ->tasks()
            ->firstOrFail();

        $this->assertSame(
            'published',
            $task->status->value,
        );

        $this->assertNotNull(
            $task->published_at,
        );
    }

    public function test_task_requires_a_valid_schedule(): void
    {
        $employer = $this->createEmployer();

        $this
            ->actingAs($employer)
            ->post(
                route('employer.tasks.store'),
                $this->validTaskData([
                    'application_deadline' => now()
                        ->addDays(3)
                        ->format('Y-m-d H:i:s'),

                    'starts_at' => now()
                        ->addDays(2)
                        ->format('Y-m-d H:i:s'),
                ]),
            )
            ->assertSessionHasErrors([
                'application_deadline',
            ]);
    }

    private function createEmployer(): User
    {
        $employer = User::factory()
            ->employer()
            ->create();

        Business::query()->create([
            'user_id' => $employer->id,
            'name' => 'UMKM Test',
            'document_type' => 'nib',
            'category' => 'Kuliner',
            'address' => 'Banda Aceh',
        ]);

        return $employer->fresh('business');
    }

    /**
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    private function validTaskData(
        array $overrides = [],
    ): array {
        return [
            'title' => 'Membantu Pengemasan Produk',
            'category' => 'produksi',
            'description' => 'Membantu proses pengemasan produk makanan untuk kebutuhan penjualan harian.',
            'requirements' => 'Teliti dan mampu bekerja dalam tim.',
            'instructions' => 'Hadir 15 menit sebelum pekerjaan dimulai.',
            'location_address' => 'Banda Aceh, Aceh',
            'latitude' => 5.5483,
            'longitude' => 95.3238,
            'attendance_radius_meters' => 150,

            'application_deadline' => now()
                ->addDay()
                ->format('Y-m-d H:i:s'),

            'starts_at' => now()
                ->addDays(2)
                ->format('Y-m-d H:i:s'),

            'ends_at' => now()
                ->addDays(2)
                ->addHours(4)
                ->format('Y-m-d H:i:s'),

            'worker_quota' => 3,
            'wage_amount' => 100000,
            'action' => 'publish',

            ...$overrides,
        ];
    }
}