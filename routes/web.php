<?php

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

    // Halaman menunggu persetujuan Admin
    Route::get('/verification/pending', function (Request $request) {

        if (
            $request->user()->role === 'admin'
            || $request->user()->verification_status === 'approved'
        ) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('auth/verification-pending');

    })->name('verification.pending');

    // Hanya pengguna approved yang dapat mengakses
    Route::middleware('approved')->group(function () {

        // Redirect dashboard sesuai role
        Route::get(
            '/dashboard',
            DashboardRedirectController::class,
        )->name('dashboard');

        // =================================================
        // 3. ROUTE PEN CARI KERJA (WORKER)
        // =================================================

        Route::middleware('role:worker')
            ->prefix('worker')
            ->name('worker.')
            ->group(function () {

                // Dashboard Pencari Kerja
                Route::inertia(
                    '/dashboard',
                    'worker/dashboard',
                )->name('dashboard');

                // -----------------------------------------
                // A. EKSPLORASI TUGAS
                // -----------------------------------------

                // Menampilkan daftar tugas yang tersedia
                Route::get(
                    '/tasks',
                    [WorkerTaskController::class, 'index'],
                )->name('tasks.index');

                // Menampilkan detail tugas
                Route::get(
                    '/tasks/{task}',
                    [WorkerTaskController::class, 'show'],
                )->name('tasks.show');

                // -----------------------------------------
                // B. FITUR 5 - LAMARAN TUGAS WORKER
                // -----------------------------------------

                // Worker mengirim lamaran pada suatu tugas
                Route::post(
                    '/tasks/{task}/applications',
                    [WorkerTaskApplicationController::class, 'store'],
                )->name('tasks.applications.store');

                // Menampilkan seluruh lamaran milik worker
                Route::get(
                    '/applications',
                    [WorkerTaskApplicationController::class, 'index'],
                )->name('applications.index');

                // Melihat detail lamaran
                Route::get(
                    '/applications/{application}',
                    [WorkerTaskApplicationController::class, 'show'],
                )->name('applications.show');

                // Membatalkan lamaran
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

                // Dashboard Pemilik UMKM
                Route::get(
                    '/dashboard',
                    EmployerDashboardController::class,
                )->name('dashboard');

                // -----------------------------------------
                // A. PUBLIKASI DAN PENGELOLAAN TUGAS
                // -----------------------------------------

                // Daftar tugas milik UMKM
                Route::get(
                    '/tasks',
                    [EmployerTaskController::class, 'index'],
                )->name('tasks.index');

                // Form membuat tugas baru
                Route::get(
                    '/tasks/create',
                    [EmployerTaskController::class, 'create'],
                )->name('tasks.create');

                // Menyimpan draft atau publikasi tugas
                Route::post(
                    '/tasks',
                    [EmployerTaskController::class, 'store'],
                )->name('tasks.store');

                // Menampilkan detail tugas
                Route::get(
                    '/tasks/{task}',
                    [EmployerTaskController::class, 'show'],
                )->name('tasks.show');

                // Mempublikasikan draft tugas
                Route::patch(
                    '/tasks/{task}/publish',
                    [EmployerTaskController::class, 'publish'],
                )->name('tasks.publish');

                // -----------------------------------------
                // B. FITUR 5 - PENGELOLAAN PELAMAR UMKM
                // -----------------------------------------

                // Melihat daftar pelamar suatu tugas
                Route::get(
                    '/tasks/{task}/applications',
                    [EmployerTaskApplicationController::class, 'index'],
                )->name('tasks.applications.index');

                // Menerima lamaran pekerja
                Route::patch(
                    '/applications/{application}/accept',
                    [EmployerTaskApplicationController::class, 'accept'],
                )->name('applications.accept');

                // Menolak lamaran pekerja
                Route::patch(
                    '/applications/{application}/reject',
                    [EmployerTaskApplicationController::class, 'reject'],
                )->name('applications.reject');
            });

        // =================================================
        // 5. ROUTE ADMIN
        // =================================================

        Route::middleware('role:admin')->group(function () {

            Route::inertia(
                '/admin',
                'admin/dashboard',
            )->name('admin.dashboard');

        });
    });
});

// =====================================================
// 6. ROUTE PENGATURAN AKUN
// =====================================================

require __DIR__.'/settings.php';
