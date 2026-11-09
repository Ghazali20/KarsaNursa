<?php

namespace Tests\Feature\Admin;

use App\Enums\TaskStatus;
use App\Models\Business;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TaskReviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_admin_can_view_submitted_tasks(): void
    {
        $admin = User::factory()
            ->admin()
            ->create();

        $task = $this->createPendingTask();

        $this
            ->actingAs($admin)
            ->get(route('admin.tasks.index'))
            ->assertOk()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->component('admin/tasks/index')
                    ->where('stats.pendingReview', 1)
                    ->has('tasks', 1)
                    ->where('tasks.0.id', $task->id)
                    ->where(
                        'tasks.0.status',
                        TaskStatus::PendingReview->value
                    ),
            );
    }

    public function test_employer_cannot_access_task_review_page(): void
    {
        $employer = User::factory()
            ->employer()
            ->create();

        $this
            ->actingAs($employer)
            ->get(route('admin.tasks.index'))
            ->assertForbidden();
    }

    public function test_admin_can_approve_pending_task(): void
    {
        $admin = User::factory()
            ->admin()
            ->create();

        $task = $this->createPendingTask();

        $this
            ->actingAs($admin)
            ->patch(
                route('admin.tasks.approve', $task)
            )
            ->assertRedirect(route('admin.tasks.index'));

        $task->refresh();

        $this->assertSame(
            TaskStatus::Published->value,
            $task->status,
        );

        $this->assertSame(
            $admin->id,
            $task->reviewed_by,
        );

        $this->assertNotNull($task->reviewed_at);
        $this->assertNotNull($task->published_at);
        $this->assertNull($task->admin_note);
    }

    public function test_admin_can_reject_pending_task_with_reason(): void
    {
        $admin = User::factory()
            ->admin()
            ->create();

        $task = $this->createPendingTask();

        $this
            ->actingAs($admin)
            ->patch(
                route('admin.tasks.reject', $task),
                [
                    'admin_note' => 'Deskripsi pekerjaan belum cukup jelas.',
                ],
            )
            ->assertRedirect(route('admin.tasks.index'));

        $task->refresh();

        $this->assertSame(
            TaskStatus::Rejected->value,
            $task->status,
        );

        $this->assertSame(
            $admin->id,
            $task->reviewed_by,
        );

        $this->assertSame(
            'Deskripsi pekerjaan belum cukup jelas.',
            $task->admin_note,
        );

        $this->assertNotNull($task->reviewed_at);
        $this->assertNull($task->published_at);
    }

    public function test_rejection_requires_reason(): void
    {
        $admin = User::factory()
            ->admin()
            ->create();

        $task = $this->createPendingTask();

        $this
            ->actingAs($admin)
            ->patch(
                route('admin.tasks.reject', $task),
                [
                    'admin_note' => '',
                ],
            )
            ->assertSessionHasErrors('admin_note');

        $this->assertSame(
            TaskStatus::PendingReview->value,
            $task->fresh()->status,
        );
    }

    public function test_task_decision_cannot_be_repeated(): void
    {
        $admin = User::factory()
            ->admin()
            ->create();

        $task = $this->createPendingTask();

        $this
            ->actingAs($admin)
            ->patch(
                route('admin.tasks.approve', $task)
            )
            ->assertRedirect(route('admin.tasks.index'));

        $this
            ->actingAs($admin)
            ->patch(
                route('admin.tasks.approve', $task)
            )
            ->assertSessionHasErrors('task');
    }

    public function test_approved_task_is_visible_to_worker(): void
    {
        $admin = User::factory()
            ->admin()
            ->create();

        $worker = User::factory()->create();

        $task = $this->createPendingTask();

        $this
            ->actingAs($worker)
            ->get(route('worker.tasks.index'))
            ->assertInertia(
                fn (Assert $page) => $page
                    ->has('tasks', 0),
            );

        $this
            ->actingAs($admin)
            ->patch(
                route('admin.tasks.approve', $task)
            );

        $this
            ->actingAs($worker)
            ->get(route('worker.tasks.index'))
            ->assertInertia(
                fn (Assert $page) => $page
                    ->has('tasks', 1)
                    ->where('tasks.0.id', $task->id),
            );
    }

    private function createPendingTask(): Task
    {
        $employer = User::factory()
            ->employer()
            ->create();

        $business = Business::query()->create([
            'user_id' => $employer->id,
            'name' => 'UMKM Pengujian',
            'document_type' => 'nib',
            'category' => 'Kuliner',
            'address' => 'Banda Aceh',
        ]);

        return Task::query()->create([
            'business_id' => $business->id,
            'title' => 'Membantu Pengemasan Produk',
            'category' => 'produksi',
            'description' => 'Membantu proses pengemasan produk untuk pesanan pelanggan.',
            'requirements' => 'Teliti dan disiplin.',
            'instructions' => 'Hadir tepat waktu.',
            'location_address' => 'Banda Aceh, Aceh',
            'latitude' => 5.5483,
            'longitude' => 95.3238,
            'attendance_radius_meters' => 150,
            'application_deadline' => now()->addDay(),
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(2)->addHours(4),
            'worker_quota' => 2,
            'wage_amount' => 100000,
            'status' => TaskStatus::PendingReview->value,
            'submitted_at' => now(),
            'published_at' => null,
        ]);
    }
}
