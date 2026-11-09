<?php

namespace Tests\Feature\Employer;

use App\Enums\TaskApplicationStatus;
use App\Enums\TaskPaymentStatus;
use App\Models\Business;
use App\Models\Task;
use App\Models\TaskApplication;
use App\Models\TaskPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_employer_can_mark_accepted_worker_payment_as_paid(): void
    {
        [$employer, $application, $payment] =
            $this->createAcceptedApplicationWithPayment();

        $this
            ->actingAs($employer)
            ->patch(
                route(
                    'employer.applications.mark-paid',
                    $application
                )
            )
            ->assertRedirect(
                route('employer.applications.index')
            );

        $payment->refresh();

        $this->assertSame(
            TaskPaymentStatus::Paid->value,
            $payment->status,
        );

        $this->assertNotNull($payment->paid_at);
    }

    public function test_other_employer_cannot_mark_payment_as_paid(): void
    {
        [, $application, $payment] =
            $this->createAcceptedApplicationWithPayment();

        $otherEmployer = $this->createEmployer(
            'UMKM Lain'
        );

        $this
            ->actingAs($otherEmployer)
            ->patch(
                route(
                    'employer.applications.mark-paid',
                    $application
                )
            )
            ->assertForbidden();

        $this->assertSame(
            TaskPaymentStatus::Pending->value,
            $payment->fresh()->status,
        );
    }

    public function test_payment_cannot_be_processed_twice(): void
    {
        [$employer, $application] =
            $this->createAcceptedApplicationWithPayment();

        $this
            ->actingAs($employer)
            ->patch(
                route(
                    'employer.applications.mark-paid',
                    $application
                )
            )
            ->assertRedirect(
                route('employer.applications.index')
            );

        $this
            ->actingAs($employer)
            ->patch(
                route(
                    'employer.applications.mark-paid',
                    $application
                )
            )
            ->assertSessionHasErrors('payment');
    }

    public function test_non_accepted_application_cannot_be_paid(): void
    {
        [$employer, $application, $payment] =
            $this->createAcceptedApplicationWithPayment();

        $application->update([
            'status' => TaskApplicationStatus::Rejected->value,
        ]);

        $this
            ->actingAs($employer)
            ->patch(
                route(
                    'employer.applications.mark-paid',
                    $application
                )
            )
            ->assertSessionHasErrors('payment');

        $this->assertSame(
            TaskPaymentStatus::Pending->value,
            $payment->fresh()->status,
        );
    }

    /**
     * @return array{User, TaskApplication, TaskPayment}
     */
    private function createAcceptedApplicationWithPayment(): array
    {
        $employer = $this->createEmployer(
            'UMKM Pembayaran'
        );

        $task = $this->createTask(
            $employer->business
        );

        $worker = User::factory()->create([
            'role' => 'worker',
            'verification_status' => 'approved',
        ]);

        $application = TaskApplication::query()->create([
            'task_id' => $task->id,
            'worker_id' => $worker->id,
            'status' => TaskApplicationStatus::Accepted->value,
            'reviewed_by' => $employer->id,
            'reviewed_at' => now(),
        ]);

        $payment = TaskPayment::query()->create([
            'task_application_id' => $application->id,
            'amount' => $task->wage_amount,
            'status' => TaskPaymentStatus::Pending->value,
            'paid_at' => null,
        ]);

        return [
            $employer,
            $application,
            $payment,
        ];
    }

    private function createEmployer(string $businessName): User
    {
        $employer = User::factory()
            ->employer()
            ->create([
                'verification_status' => 'approved',
            ]);

        Business::query()->create([
            'user_id' => $employer->id,
            'name' => $businessName,
            'document_type' => 'nib',
            'category' => 'Kuliner',
            'address' => 'Banda Aceh',
        ]);

        return $employer->fresh('business');
    }

    private function createTask(Business $business): Task
    {
        return Task::query()->create([
            'business_id' => $business->id,
            'title' => 'Membantu Pengemasan',
            'category' => 'produksi',
            'description' => 'Membantu mengemas pesanan pelanggan.',
            'location_address' => 'Banda Aceh',
            'latitude' => 5.5483,
            'longitude' => 95.3238,
            'attendance_radius_meters' => 150,
            'application_deadline' => now()->addDay(),
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(2)->addHours(4),
            'worker_quota' => 1,
            'wage_amount' => 100000,
            'status' => 'published',
            'published_at' => now(),
        ]);
    }
}
