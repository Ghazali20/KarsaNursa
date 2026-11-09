<?php

namespace Tests\Feature\Employer;

use App\Models\Task;
use App\Models\TaskApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskApplicationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    /**
     * Membuat akun Employer beserta profil usahanya.
     */
    private function createEmployer(): User
    {
        $employer = User::factory()
            ->employer()
            ->create([
                'verification_status' => 'approved',
                'email_verified_at' => now(),
            ]);

        $employer->business()->create([
            'name' => 'UMKM Pengujian',
            'document_type' => 'nib',
            'category' => 'Kuliner',
            'address' => 'Alamat pengujian',
        ]);

        return $employer;
    }

    /**
     * Membuat tugas published milik Employer.
     */
    private function createTask(
        User $employer,
        int $quota = 1
    ): Task {
        return $employer->business->tasks()->create([
            'title' => 'Membantu Pengemasan',
            'category' => 'Kuliner',
            'description' =>
                'Membantu mengemas pesanan pelanggan.',
            'location_address' => 'Alamat pengujian',
            'application_deadline' => now()->addDay(),
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(2)->addHours(4),
            'worker_quota' => $quota,
            'wage_amount' => 100000,
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /**
     * Membuat lamaran Worker dengan status pending.
     *
     * Nama method diubah agar tidak bentrok
     * dengan createApplication() bawaan Laravel.
     */
    private function createTestApplication(
        Task $task
    ): TaskApplication {
        $worker = User::factory()->create([
            'role' => 'worker',
            'verification_status' => 'approved',
            'email_verified_at' => now(),
        ]);

        return TaskApplication::query()->create([
            'task_id' => $task->id,
            'worker_id' => $worker->id,
            'status' => 'pending',
            'applied_at' => now(),
        ]);
    }

    /**
     * TEST 1:
     * Employer berhasil menerima pelamar.
     */
    public function test_employer_can_accept_applicant(): void
    {
        $employer = $this->createEmployer();
        $task = $this->createTask($employer);
        $application = $this->createTestApplication($task);

        $this->actingAs($employer)
            ->patch(route(
                'employer.tasks.applications.decide',
                [$task, $application]
            ), [
                'decision' => 'accepted',
            ])
            ->assertRedirect(route(
                'employer.tasks.applications.index',
                $task
            ));

        $this->assertDatabaseHas(
            'task_applications',
            [
                'id' => $application->id,
                'status' => 'accepted',
                'reviewed_by' => $employer->id,
            ]
        );
    }

    /**
     * TEST 2:
     * Employer berhasil menolak pelamar.
     */
    public function test_employer_can_reject_applicant(): void
    {
        $employer = $this->createEmployer();
        $task = $this->createTask($employer);
        $application = $this->createTestApplication($task);

        $this->actingAs($employer)
            ->patch(route(
                'employer.tasks.applications.decide',
                [$task, $application]
            ), [
                'decision' => 'rejected',
                'review_notes' => 'Kualifikasi belum sesuai',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas(
            'task_applications',
            [
                'id' => $application->id,
                'status' => 'rejected',
                'review_notes' => 'Kualifikasi belum sesuai',
            ]
        );
    }

    /**
     * TEST 3:
     * Employer tidak boleh menyeleksi
     * pelamar dari tugas UMKM lain.
     */
    public function test_employer_cannot_review_another_business_applicant(): void
    {
        $owner = $this->createEmployer();
        $otherEmployer = $this->createEmployer();

        $task = $this->createTask($owner);
        $application = $this->createTestApplication($task);

        $this->actingAs($otherEmployer)
            ->patch(route(
                'employer.tasks.applications.decide',
                [$task, $application]
            ), [
                'decision' => 'accepted',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas(
            'task_applications',
            [
                'id' => $application->id,
                'status' => 'pending',
            ]
        );
    }

    /**
     * TEST 4:
     * Employer tidak boleh menerima pekerja
     * melebihi kuota tugas.
     */
    public function test_employer_cannot_exceed_worker_quota(): void
    {
        $employer = $this->createEmployer();
        $task = $this->createTask($employer, 1);

        $firstApplication = $this->createTestApplication($task);
        $secondApplication = $this->createTestApplication($task);

        $firstApplication->update([
            'status' => 'accepted',
            'reviewed_by' => $employer->id,
            'reviewed_at' => now(),
        ]);

        $this->actingAs($employer)
            ->patch(route(
                'employer.tasks.applications.decide',
                [$task, $secondApplication]
            ), [
                'decision' => 'accepted',
            ])
            ->assertSessionHasErrors('application');

        $this->assertDatabaseHas(
            'task_applications',
            [
                'id' => $secondApplication->id,
                'status' => 'pending',
            ]
        );
    }

    /**
     * TEST 5:
     * Lamaran yang sudah diproses
     * tidak boleh diproses kembali.
     */
    public function test_decision_cannot_be_repeated(): void
    {
        $employer = $this->createEmployer();
        $task = $this->createTask($employer);
        $application = $this->createTestApplication($task);

        $application->update([
            'status' => 'rejected',
            'review_notes' => 'Tidak memenuhi syarat',
            'reviewed_by' => $employer->id,
            'reviewed_at' => now(),
        ]);

        $this->actingAs($employer)
            ->patch(route(
                'employer.tasks.applications.decide',
                [$task, $application]
            ), [
                'decision' => 'accepted',
            ])
            ->assertSessionHasErrors('application');
    }

    /**
     * TEST 6:
     * Employer wajib memberikan alasan
     * ketika menolak pelamar.
     */
    public function test_rejection_requires_reason(): void
    {
        $employer = $this->createEmployer();
        $task = $this->createTask($employer);
        $application = $this->createTestApplication($task);

        $this->actingAs($employer)
            ->patch(route(
                'employer.tasks.applications.decide',
                [$task, $application]
            ), [
                'decision' => 'rejected',
                'review_notes' => '',
            ])
            ->assertSessionHasErrors('review_notes');

        $this->assertDatabaseHas(
            'task_applications',
            [
                'id' => $application->id,
                'status' => 'pending',
            ]
        );
    }
}
