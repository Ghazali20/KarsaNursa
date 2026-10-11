<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class VerificationAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_user_is_redirected_from_dashboard(): void
    {
        $user = User::factory()
            ->pendingVerification()
            ->create();

        $response = $this
            ->actingAs($user)
            ->get(route('dashboard'));

        $response->assertRedirect(
            route('verification.pending'),
        );
    }

    public function test_pending_user_can_view_verification_status(): void
    {
        $user = User::factory()
            ->pendingVerification()
            ->create();

        $response = $this
            ->actingAs($user)
            ->get(route('verification.pending'));

        $response
            ->assertOk()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->component(
                        'auth/verification-pending',
                    ),
            );
    }

    public function test_approved_user_can_view_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('dashboard'));

        $response->assertRedirect(
            route('worker.dashboard'),
        );
    }

    public function test_approved_user_is_redirected_from_pending_page(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('verification.pending'));

        $response->assertRedirect(route('dashboard'));
    }

    public function test_admin_can_access_dashboard_while_document_status_is_pending(): void
    {
        $admin = User::factory()
            ->admin()
            ->pendingVerification()
            ->create();

        $response = $this
            ->actingAs($admin)
            ->get(route('dashboard'));

        $response->assertRedirect(
            route('admin.dashboard'),
        );
    }
}
