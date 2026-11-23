<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    private function createUser(
        string $role,
        string $status = 'pending'
    ): User {
        return User::factory()->create([
            'role' => $role,
            'verification_status' => $status,
            'email_verified_at' => now(),
            'verified_at' => $status === 'approved'
                ? now()
                : null,
        ]);
    }

    private function createDocument(
        User $user,
        string $documentType = 'ktp'
    ): int {
        return DB::table('verification_documents')
            ->insertGetId([
                'user_id' => $user->id,
                'document_type' => $documentType,
                'disk' => 'local',
                'storage_path' => "verifications/{$user->id}/{$documentType}.pdf",
                'original_name' => "{$documentType}.pdf",
                'mime_type' => 'application/pdf',
                'file_size' => 100,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
    }

    public function test_account_is_approved_only_after_all_documents_are_approved(): void
    {
        $admin = $this->createUser('admin', 'approved');
        $worker = $this->createUser('worker');

        $ktpId = $this->createDocument($worker, 'ktp');
        $ktmId = $this->createDocument($worker, 'ktm');

        // Setujui dokumen pertama.
        $this->actingAs($admin)
            ->patch(route('admin.users.documents.approve', $ktpId));

        $this->assertDatabaseHas('verification_documents', [
            'id' => $ktpId,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('verification_documents', [
            'id' => $ktmId,
            'status' => 'pending',
        ]);

        // Akun belum boleh approved karena dokumen kedua belum disetujui.
        $this->assertDatabaseHas('users', [
            'id' => $worker->id,
            'verification_status' => 'pending',
            'verified_at' => null,
        ]);

        // Setujui dokumen kedua.
        $this->patch(route('admin.users.documents.approve', $ktmId));

        // Sekarang seluruh dokumen sudah approved.
        $this->assertDatabaseHas('users', [
            'id' => $worker->id,
            'verification_status' => 'approved',
        ]);

        $this->assertNotNull($worker->fresh()->verified_at);
    }

    public function test_account_remains_pending_when_one_document_is_rejected(): void
    {
        $admin = $this->createUser('admin', 'approved');
        $worker = $this->createUser('worker');

        $ktpId = $this->createDocument($worker, 'ktp');
        $ktmId = $this->createDocument($worker, 'ktm');

        // Tolak salah satu dokumen.
        $this->actingAs($admin)
            ->patch(
                route('admin.users.documents.reject', $ktpId),
                [
                    'review_notes' => 'Dokumen tidak valid',
                ]
            );

        $this->assertDatabaseHas('verification_documents', [
            'id' => $ktpId,
            'status' => 'rejected',
            'review_notes' => 'Dokumen tidak valid',
        ]);

        $this->assertDatabaseHas('verification_documents', [
            'id' => $ktmId,
            'status' => 'pending',
        ]);

        // Akun tidak boleh otomatis approved.
        $this->assertDatabaseHas('users', [
            'id' => $worker->id,
            'verification_status' => 'rejected',
            'verified_at' => null,
        ]);
    }

    public function test_account_is_approved_when_its_only_document_is_approved(): void
    {
        $admin = $this->createUser('admin', 'approved');
        $worker = $this->createUser('worker');

        $documentId = $this->createDocument($worker);

        $this->actingAs($admin)
            ->patch(
                route('admin.users.documents.approve', $documentId)
            );

        $this->assertDatabaseHas('verification_documents', [
            'id' => $documentId,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $worker->id,
            'verification_status' => 'approved',
        ]);

        $this->assertNotNull($worker->fresh()->verified_at);
    }

    public function test_admin_can_approve_pending_worker(): void
    {
        $admin = $this->createUser('admin', 'approved');
        $worker = $this->createUser('worker');
        $documentId = $this->createDocument($worker);

        $this->actingAs($admin)
            ->post(route(
                'admin.verifications.approve',
                $worker
            ))
            ->assertRedirect(route('admin.dashboard'));

        $this->assertDatabaseHas('users', [
            'id' => $worker->id,
            'verification_status' => 'approved',
        ]);

        $this->assertDatabaseHas('verification_documents', [
            'id' => $documentId,
            'status' => 'approved',
            'reviewed_by' => $admin->id,
        ]);

        $this->assertNotNull(
            $worker->fresh()->verified_at
        );
    }

    public function test_admin_can_reject_pending_employer(): void
    {
        $admin = $this->createUser('admin', 'approved');
        $employer = $this->createUser('employer');
        $documentId = $this->createDocument($employer);

        $this->actingAs($admin)
            ->post(
                route(
                    'admin.verifications.reject',
                    $employer
                ),
                [
                    'review_notes' => 'Dokumen tidak valid',
                ]
            )
            ->assertRedirect(route('admin.dashboard'));

        $this->assertDatabaseHas('users', [
            'id' => $employer->id,
            'verification_status' => 'rejected',
            'verified_at' => null,
        ]);

        $this->assertDatabaseHas('verification_documents', [
            'id' => $documentId,
            'status' => 'rejected',
            'review_notes' => 'Dokumen tidak valid',
            'reviewed_by' => $admin->id,
        ]);
    }

    public function test_worker_cannot_approve_accounts(): void
    {
        $worker = $this->createUser('worker', 'approved');
        $target = $this->createUser('employer');
        $this->createDocument($target);

        $this->actingAs($worker)
            ->post(route(
                'admin.verifications.approve',
                $target
            ))
            ->assertForbidden();

        $this->assertDatabaseHas('users', [
            'id' => $target->id,
            'verification_status' => 'pending',
        ]);
    }

    public function test_approved_account_cannot_be_reviewed_again(): void
    {
        $admin = $this->createUser('admin', 'approved');
        $worker = $this->createUser('worker', 'approved');
        $this->createDocument($worker);

        $this->actingAs($admin)
            ->post(route(
                'admin.verifications.approve',
                $worker
            ))
            ->assertSessionHasErrors('verification');
    }

    public function test_rejection_requires_reason(): void
    {
        $admin = $this->createUser('admin', 'approved');
        $worker = $this->createUser('worker');
        $this->createDocument($worker);

        $this->actingAs($admin)
            ->post(
                route(
                    'admin.verifications.reject',
                    $worker
                ),
                ['review_notes' => '']
            )
            ->assertSessionHasErrors('review_notes');

        $this->assertDatabaseHas('users', [
            'id' => $worker->id,
            'verification_status' => 'pending',
        ]);
    }

    public function test_only_admin_can_download_document(): void
    {
        Storage::fake('local');

        $admin = $this->createUser('admin', 'approved');
        $worker = $this->createUser('worker', 'approved');

        $documentId = $this->createDocument($worker);

        Storage::disk('local')->put(
            "verifications/{$worker->id}/ktp.pdf",
            'Test document content'
        );

        $url = route(
            'admin.verifications.document',
            $documentId
        );

        $response = $this->actingAs($admin)
            ->get($url)
            ->assertOk();

        $this->assertStringContainsString(
            'inline',
            (string) $response->headers->get('Content-Disposition')
        );

        $this->actingAs($worker)
            ->get($url)
            ->assertForbidden();
    }
}
