<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoleDashboardRoutingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test 1:
     * Worker dapat mengakses Dashboard Pencari Kerja.
     */
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

    /**
     * Test 2:
     * Worker tidak dapat mengakses Dashboard UMKM
     * maupun Dashboard Admin.
     */
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

    /**
     * Test 3:
     * Employer diarahkan ke Dashboard UMKM
     * dan dapat mengakses dashboard jika memiliki Business.
     */
    public function test_employer_is_redirected_to_employer_dashboard(): void
    {
        // Membuat akun Pemilik UMKM.
        $employer = User::factory()
            ->employer()
            ->create();

        // Membuat profil usaha untuk akun Employer.
        // Dashboard UMKM membutuhkan relasi Business.
        $employer->business()->firstOrCreate(
            [],
            [
                'name' => 'UMKM Pengujian KarsaNursa',
                'document_type' => 'nib',
                'category' => 'Kuliner',
                'address' => 'Jl. Pengujian No. 1',
            ]
        );

        // Memastikan Employer diarahkan ke dashboard UMKM.
        $this
            ->actingAs($employer)
            ->get(route('dashboard'))
            ->assertRedirect(
                route('employer.dashboard'),
            );

        // Memastikan Dashboard UMKM dapat dibuka.
        $this
            ->actingAs($employer)
            ->get(route('employer.dashboard'))
            ->assertOk()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->component('employer/dashboard'),
            );
    }

    /**
     * Test 4:
     * Admin diarahkan ke Dashboard Admin.
     */
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
