<?php

use App\Http\Controllers\Admin\VerificationController;
use App\Http\Controllers\DashboardRedirectController;
use App\Http\Controllers\Employer\TaskApplicationController as EmployerTaskApplicationController;
use App\Http\Controllers\Employer\TaskController as EmployerTaskController;
use App\Http\Controllers\EmployerDashboardController;
use App\Http\Controllers\Worker\TaskApplicationController as WorkerTaskApplicationController;
use App\Http\Controllers\Worker\TaskController as WorkerTaskController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// =====================================================
// 1. HALAMAN UTAMA KARSANURSA
// =====================================================

Route::inertia('/', 'welcome')->name('home');

// =====================================================
// 2. ROUTE PENGGUNA YANG SUDAH LOGIN
// =====================================================

Route::middleware(['auth', 'verified'])->group(function () {

    // Halaman pengguna yang menunggu verifikasi.
    Route::get('/verification/pending', function (
        Request $request,
    ) {
        if (
            $request->user()->role === 'admin'
            || $request->user()->verification_status === 'approved'
        ) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('auth/verification-pending');
    })->name('verification.pending');

    // Hanya pengguna approved yang dapat mengakses.
    Route::middleware('approved')->group(function () {

        // Redirect dashboard berdasarkan role.
        Route::get(
            '/dashboard',
            DashboardRedirectController::class,
        )->name('dashboard');

        // =================================================
        // 3. ROUTE PENCA​RI KERJA (WORKER)
        // =================================================

        Route::middleware('role:worker')
            ->prefix('worker')
            ->name('worker.')
            ->group(function () {

                // Dashboard Pencari Kerja.
                Route::inertia(
                    '/dashboard',
                    'worker/dashboard',
                )->name('dashboard');

                // A. EKSPLORASI TUGAS

                Route::get(
                    '/tasks',
                    [WorkerTaskController::class, 'index'],
                )->name('tasks.index');

                Route::get(
                    '/tasks/{task}',
                    [WorkerTaskController::class, 'show'],
                )->name('tasks.show');

                // B. LAMARAN TUGAS WORKER

                Route::post(
                    '/tasks/{task}/applications',
                    [WorkerTaskApplicationController::class, 'store'],
                )->name('tasks.applications.store');

                Route::get(
                    '/applications',
                    [WorkerTaskApplicationController::class, 'index'],
                )->name('applications.index');

                Route::get(
                    '/applications/{application}',
                    [WorkerTaskApplicationController::class, 'show'],
                )->name('applications.show');

                Route::delete(
                    '/applications/{application}',
                    [WorkerTaskApplicationController::class, 'withdraw'],
                )->name('applications.withdraw');
            });

        // =================================================
        // 4. ROUTE PEMILIK UMKM (EMPLOYER)
        // =================================================

        Route::middleware('role:employer')
            ->prefix('employer')
            ->name('employer.')
            ->group(function () {

                // Dashboard Pemilik UMKM.
                Route::get(
                    '/dashboard',
                    EmployerDashboardController::class,
                )->name('dashboard');

                // A. PUBLIKASI DAN PENGELOLAAN TUGAS

                Route::get(
                    '/tasks',
                    [EmployerTaskController::class, 'index'],
                )->name('tasks.index');

                Route::get(
                    '/tasks/create',
                    [EmployerTaskController::class, 'create'],
                )->name('tasks.create');

                Route::post(
                    '/tasks',
                    [EmployerTaskController::class, 'store'],
                )->name('tasks.store');

                Route::get(
                    '/tasks/{task}',
                    [EmployerTaskController::class, 'show'],
                )->name('tasks.show');

                Route::patch(
                    '/tasks/{task}/publish',
                    [EmployerTaskController::class, 'publish'],
                )->name('tasks.publish');

                // B. PENGELOLAAN PELAMAR UMKM

                Route::get(
                    '/tasks/{task}/applications',
                    [EmployerTaskApplicationController::class, 'index'],
                )->name('tasks.applications.index');

                Route::patch(
                    '/applications/{application}/accept',
                    [EmployerTaskApplicationController::class, 'accept'],
                )->name('applications.accept');

                Route::patch(
                    '/applications/{application}/reject',
                    [EmployerTaskApplicationController::class, 'reject'],
                )->name('applications.reject');
            });

        // =================================================
        // 5. ROUTE ADMIN
        // =================================================

        Route::middleware('role:admin')->group(function () {

            // Dashboard Admin dan verifikasi pengguna.
            Route::get(
                '/admin',
                [VerificationController::class, 'index'],
            )->name('admin.dashboard');

            // Approve akun.
            Route::post(
                '/admin/verifications/{user}/approve',
                [VerificationController::class, 'approve'],
            )->name('admin.verifications.approve');

            // Reject akun.
            Route::post(
                '/admin/verifications/{user}/reject',
                [VerificationController::class, 'reject'],
            )->name('admin.verifications.reject');

            // Download dokumen verifikasi.
            Route::get(
                '/admin/verifications/documents/{document}',
                [VerificationController::class, 'download'],
            )->name('admin.verifications.document');
        });
    });
});

// =====================================================
// 6. ROUTE PENGATURAN AKUN
// =====================================================

require __DIR__.'/settings.php';
