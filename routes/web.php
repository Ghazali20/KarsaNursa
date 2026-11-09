<?php

use App\Http\Controllers\Admin\VerificationController;
use App\Http\Controllers\DashboardRedirectController;
use App\Http\Controllers\Employer\DashboardController as EmployerDashboardController;
use App\Http\Controllers\Worker\DashboardController as WorkerDashboardController;
use App\Http\Controllers\Employer\TaskController as EmployerTaskController;
use App\Http\Controllers\Worker\TaskController as WorkerTaskController;
use App\Http\Controllers\Worker\TaskApplicationController as WorkerTaskApplicationController;
use App\Http\Controllers\Employer\TaskApplicationController as EmployerTaskApplicationController;
use App\Http\Controllers\Employer\ApplicationInboxController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ========================================
// HALAMAN UTAMA
// ========================================

Route::inertia('/', 'welcome')->name('home');

// ========================================
// AUTHENTICATION
// ========================================

Route::middleware(['auth', 'verified'])->group(function () {

    // Halaman pengguna yang menunggu verifikasi.
    Route::get('/verification/pending', function (Request $request) {

        if (
            $request->user()->role === 'admin'
            || $request->user()->verification_status === 'approved'
        ) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('auth/verification-pending');
    })->name('verification.pending');

    // Hanya pengguna approved yang dapat mengakses fitur.
    Route::middleware('approved')->group(function () {

        // Redirect dashboard sesuai role.
        Route::get(
            '/dashboard',
            DashboardRedirectController::class
        )->name('dashboard');

        // ========================================
        // PEN​​CARI KERJA (WORKER)
        // ========================================

        Route::middleware('role:worker')->group(function () {

            // Dashboard Worker dengan data tugas terbaru.
            Route::get(
                '/worker/dashboard',
                WorkerDashboardController::class
            )->name('worker.dashboard');

            // Halaman Cari Tugas.
            Route::get(
                '/worker/tasks',
                [WorkerTaskController::class, 'index']
            )->name('worker.tasks.index');

            // Halaman Daftar Lamaran.
            Route::get(
                '/worker/applications',
                [WorkerTaskApplicationController::class, 'index']
            )->name('worker.applications.index');

            // Mengajukan lamaran untuk tugas tertentu.
            Route::post(
                '/worker/tasks/{task}/applications',
                [WorkerTaskApplicationController::class, 'store']
            )->name('worker.tasks.applications.store');

            // Halaman Detail Tugas.
            Route::get(
                '/worker/tasks/{task}',
                [WorkerTaskController::class, 'show']
            )->name('worker.tasks.show');
        });

        // ========================================
        // PEMILIK UMKM (EMPLOYER)
        // ========================================

        Route::middleware('role:employer')->group(function () {

            // Dashboard UMKM dengan data dari database.
            Route::get(
                '/employer/dashboard',
                EmployerDashboardController::class
            )->name('employer.dashboard');

            // Daftar semua tugas milik UMKM.
            Route::get(
                '/employer/tasks',
                [EmployerTaskController::class, 'index']
            )->name('employer.tasks.index');

            // Halaman form membuat tugas baru.
            Route::get(
                '/employer/tasks/create',
                [EmployerTaskController::class, 'create']
            )->name('employer.tasks.create');

            // Menyimpan draft atau publikasi tugas.
            Route::post(
                '/employer/tasks',
                [EmployerTaskController::class, 'store']
            )->name('employer.tasks.store');

            // Daftar tugas UMKM
            Route::get(
                '/employer/tasks',
                [EmployerTaskController::class, 'index']
            )->name('employer.tasks.index');

            // Form tugas baru
            Route::get(
                '/employer/tasks/create',
                [EmployerTaskController::class, 'create']
            )->name('employer.tasks.create');

            // Simpan Draft atau Published
            Route::post(
                '/employer/tasks',
                [EmployerTaskController::class, 'store']
            )->name('employer.tasks.store');

            // Form Edit Draft
            Route::get(
                '/employer/tasks/{task}/edit',
                [EmployerTaskController::class, 'edit']
            )->name('employer.tasks.edit');

            // Simpan hasil Edit Draft
            Route::patch(
                '/employer/tasks/{task}',
                [EmployerTaskController::class, 'update']
            )->name('employer.tasks.update');

            // Publikasikan Draft
            Route::patch(
                '/employer/tasks/{task}/publish',
                [EmployerTaskController::class, 'publish']
            )->name('employer.tasks.publish');

            // Halaman pusat penerimaan pelamar UMKM.
            Route::get(
                '/employer/applications',
                ApplicationInboxController::class
            )->name('employer.applications.index');

            // Melihat pelamar pada tugas milik UMKM.
            Route::get(
                '/employer/tasks/{task}/applications',
                [EmployerTaskApplicationController::class, 'index']
            )->name('employer.tasks.applications.index');

            // Menerima atau menolak pelamar.
            Route::patch(
                '/employer/tasks/{task}/applications/{application}/decision',
                [EmployerTaskApplicationController::class, 'decide']
            )->name('employer.tasks.applications.decide');
        });

        // ========================================
        // ADMIN
        // ========================================

        Route::middleware('role:admin')->group(function () {

            // Dashboard Admin.
            Route::get(
                '/admin',
                [VerificationController::class, 'index']
            )->name('admin.dashboard');

            // Menyetujui akun pengguna.
            Route::post(
                '/admin/verifications/{user}/approve',
                [VerificationController::class, 'approve']
            )->name('admin.verifications.approve');

            // Menolak akun pengguna.
            Route::post(
                '/admin/verifications/{user}/reject',
                [VerificationController::class, 'reject']
            )->name('admin.verifications.reject');

            // Mengunduh dokumen verifikasi pengguna.
            Route::get(
                '/admin/verifications/documents/{document}',
                [VerificationController::class, 'download']
            )->name('admin.verifications.document');
        });
    });
});

// ========================================
// SETTINGS
// ========================================

require __DIR__ . '/settings.php';
