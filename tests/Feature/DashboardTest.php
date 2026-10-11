<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('dashboard'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_worker_is_redirected_to_worker_dashboard(): void
    {
        $worker = User::factory()->create();

        $response = $this
            ->actingAs($worker)
            ->get(route('dashboard'));

        $response->assertRedirect(
            route('worker.dashboard'),
        );
    }
}
