<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoleDashboardRoutingTest extends TestCase
{
    use RefreshDatabase;

    public function test_worker_can_access_worker_dashboard(): void
    {
        $worker = User::factory()->create();

        $response = $this
            ->actingAs($worker)
            ->get(route('worker.dashboard'));

        $response
            ->assertOk()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->component('worker/dashboard'),
            );
    }

    public function test_worker_cannot_access_employer_or_admin_dashboard(): void
    {
        $worker = User::factory()->create();

        $this
            ->actingAs($worker)
            ->get(route('employer.dashboard'))
            ->assertForbidden();

        $this
            ->actingAs($worker)
            ->get(route('admin.dashboard'))
            ->assertForbidden();
    }

    public function test_employer_is_redirected_to_employer_dashboard(): void
    {
        $employer = User::factory()
            ->employer()
            ->create();

        $this
            ->actingAs($employer)
            ->get(route('dashboard'))
            ->assertRedirect(
                route('employer.dashboard'),
            );

        $this
            ->actingAs($employer)
            ->get(route('employer.dashboard'))
            ->assertOk()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->component('employer/dashboard'),
            );
    }

    public function test_admin_is_redirected_to_admin_dashboard(): void
    {
        $admin = User::factory()
            ->admin()
            ->create();

        $this
            ->actingAs($admin)
            ->get(route('dashboard'))
            ->assertRedirect(
                route('admin.dashboard'),
            );

        $this
            ->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->component('admin/dashboard'),
            );
    }
}
