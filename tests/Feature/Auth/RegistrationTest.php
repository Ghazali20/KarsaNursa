<?php

namespace Tests\Feature\Auth;

use App\Models\VerificationDocument;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Features;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_worker_can_register_with_private_identity_document(): void
    {
        Storage::fake('local');

        $response = $this->post(route('register.store'), [
            'name' => 'Pekerja Test',
            'email' => 'worker@example.com',
            'role' => 'worker',
            'phone' => '081234567890',
            'identity_type' => 'ktp',
            'verification_document' => UploadedFile::fake()->create(
                'ktp.pdf',
                500,
                'application/pdf',
            ),
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(
            route('dashboard', absolute: false),
        );

        $this->assertDatabaseHas('users', [
            'email' => 'worker@example.com',
            'role' => 'worker',
            'verification_status' => 'pending',
        ]);

        $this->assertDatabaseHas('worker_profiles', [
            'identity_type' => 'ktp',
        ]);

        $document = VerificationDocument::query()->firstOrFail();

        $this->assertSame('local', $document->disk);
        $this->assertSame('pending', $document->status);

        Storage::disk('local')->assertExists(
            $document->storage_path,
        );
    }

    public function test_employer_can_register_with_private_business_document(): void
    {
        Storage::fake('local');

        $response = $this->post(route('register.store'), [
            'name' => 'Pemilik Usaha',
            'email' => 'employer@example.com',
            'role' => 'employer',
            'phone' => '081298765432',
            'business_name' => 'Dapur Test',
            'business_document_type' => 'nib',
            'verification_document' => UploadedFile::fake()->create(
                'nib.pdf',
                500,
                'application/pdf',
            ),
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(
            route('dashboard', absolute: false),
        );

        $this->assertDatabaseHas('users', [
            'email' => 'employer@example.com',
            'role' => 'employer',
            'verification_status' => 'pending',
        ]);

        $this->assertDatabaseHas('businesses', [
            'name' => 'Dapur Test',
            'document_type' => 'nib',
        ]);

        $document = VerificationDocument::query()->firstOrFail();

        $this->assertSame('nib', $document->document_type);

        Storage::disk('local')->assertExists(
            $document->storage_path,
        );
    }

    public function test_registration_rejects_unsupported_role_and_document(): void
    {
        Storage::fake('local');

        $response = $this->from(route('register'))->post(
            route('register.store'),
            [
                'name' => 'Invalid User',
                'email' => 'invalid@example.com',
                'role' => 'admin',
                'phone' => '081234567890',
                'verification_document' => UploadedFile::fake()->create(
                    'script.php',
                    10,
                    'text/x-php',
                ),
                'password' => 'password',
                'password_confirmation' => 'password',
            ],
        );

        $response->assertRedirect(route('register'));
        $response->assertSessionHasErrors([
            'role',
            'verification_document',
        ]);

        $this->assertGuest();
        $this->assertDatabaseMissing('users', [
            'email' => 'invalid@example.com',
        ]);
    }
}
