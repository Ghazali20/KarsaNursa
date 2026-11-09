<?php

namespace Tests\Feature;

use App\Enums\TaskApplicationStatus;
use App\Enums\TaskPaymentStatus;
use App\Models\Business;
use App\Models\Task;
use App\Models\TaskApplication;
use App\Models\TaskPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PaymentDashboardSummaryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_employer_monthly_expense_only_counts_own_paid_payments_this_month(): void
    {
        $employer = $this->createEmployer('UMKM Utama');
        $business = $employer->business;

        $this->createPayment(
            business: $business,
            worker: $this->createWorker(),
            amount: 100000,
            status: TaskPaymentStatus::Paid,
            paidAt: now(),
        );

        // Pembayaran bulan lalu tidak boleh dihitung.
        $this->createPayment(
            business: $business,
            worker: $this->createWorker(),
            amount: 50000,
            status: TaskPaymentStatus::Paid,
            paidAt: now()->subMonth(),
        );

        // Pembayaran pending tidak termasuk pengeluaran.
        $this->createPayment(
            business: $business,
            worker: $this->createWorker(),
            amount: 75000,
            status: TaskPaymentStatus::Pending,
            paidAt: null,
        );

        // Pembayaran milik UMKM lain tidak boleh dihitung.
        $otherEmployer = $this->createEmployer('UMKM Lain');

        $this->createPayment(
            business: $otherEmployer->business,
            worker: $this->createWorker(),
            amount: 900000,
            status: TaskPaymentStatus::Paid,
            paidAt: now(),
        );

        $this
            ->actingAs($employer)
            ->get(route('employer.dashboard'))
            ->assertOk()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->component('employer/dashboard')
                    ->where('stats.monthlyExpenses', 100000)
                    ->where('stats.pendingPayments', 1),
            );
    }

    public function test_worker_wage_summary_only_counts_own_payments(): void
    {
        $employer = $this->createEmployer('UMKM Upah');
        $worker = $this->createWorker();

        $this->createPayment(
            business: $employer->business,
            worker: $worker,
            amount: 120000,
            status: TaskPaymentStatus::Paid,
            paidAt: now(),
        );

        // Upah bulan lalu tidak masuk upah bulan ini.
        $this->createPayment(
            business: $employer->business,
            worker: $worker,
            amount: 80000,
            status: TaskPaymentStatus::Paid,
            paidAt: now()->subMonth(),
        );

        // Upah pending masuk ke pendingWages.
        $this->createPayment(
            business: $employer->business,
            worker: $worker,
            amount: 70000,
            status: TaskPaymentStatus::Pending,
            paidAt: null,
        );

        // Upah pekerja lain tidak boleh ikut terhitung.
        $this->createPayment(
            business: $employer->business,
            worker: $this->createWorker(),
            amount: 999000,
            status: TaskPaymentStatus::Paid,
            paidAt: now(),
        );

        $this
            ->actingAs($worker)
            ->get(route('worker.dashboard'))
            ->assertOk()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->component('worker/dashboard')
                    ->where('monthlyWages', 120000)
                    ->where('pendingWages', 70000)
                    ->where('activeAssignments', 1),
            );
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

    private function createWorker(): User
    {
        return User::factory()->create([
            'role' => 'worker',
            'verification_status' => 'approved',
        ]);
    }

    private function createPayment(
        Business $business,
        User $worker,
        int $amount,
        TaskPaymentStatus $status,
        mixed $paidAt,
    ): TaskPayment {
        $task = Task::query()->create([
            'business_id' => $business->id,
            'title' => 'Tugas Pembayaran '.$amount.'-'.fake()->uuid(),
            'category' => 'produksi',
            'description' => 'Tugas untuk pengujian pembayaran pekerja.',
            'location_address' => 'Banda Aceh',
            'latitude' => 5.5483,
            'longitude' => 95.3238,
            'attendance_radius_meters' => 150,
            'application_deadline' => now()->addDay(),
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(2)->addHours(4),
            'worker_quota' => 1,
            'wage_amount' => $amount,
            'status' => 'published',
            'published_at' => now(),
        ]);

        $application = TaskApplication::query()->create([
            'task_id' => $task->id,
            'worker_id' => $worker->id,
            'status' => TaskApplicationStatus::Accepted->value,
            'reviewed_by' => $business->user_id,
            'reviewed_at' => now(),
        ]);

        return TaskPayment::query()->create([
            'task_application_id' => $application->id,
            'amount' => $amount,
            'status' => $status->value,
            'paid_at' => $paidAt,
        ]);
    }
}
