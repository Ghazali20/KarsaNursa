<?php

use App\Http\Controllers\Admin\TaskReviewController;
use App\Http\Controllers\Admin\VerificationController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\DashboardRedirectController;
use App\Http\Controllers\Employer\ApplicationInboxController;
use App\Http\Controllers\Employer\DashboardController as EmployerDashboardController;
use App\Http\Controllers\Employer\TaskApplicationController as EmployerTaskApplicationController;
use App\Http\Controllers\Employer\TaskController as EmployerTaskController;
use App\Http\Controllers\Employer\TaskPaymentController as EmployerTaskPaymentController;
use App\Http\Controllers\Worker\DashboardController as WorkerDashboardController;
use App\Http\Controllers\Worker\TaskApplicationController as WorkerTaskApplicationController;
use App\Http\Controllers\Worker\TaskController as WorkerTaskController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ========================================
// HALAMAN UTAMA
// ========================================

Route::inertia('/', 'welcome')->name('home');

// ========================================
// GOOGLE OAUTH - LOGIN & REGISTRASI
// ========================================

// Pengguna yang belum login dapat
// melakukan autentikasi menggunakan Google.
//
// Jika akun Google belum terdaftar,
// pengguna diarahkan untuk memilih role
// Worker atau Employer dan melengkapi profil.

Route::middleware('guest')->group(function () {

    // Mengarahkan pengguna ke halaman login Google.
    Route::get(
        '/auth/google/redirect',
        [GoogleAuthController::class, 'redirect']
    )->name('google.redirect');

    // Menerima callback autentikasi dari Google.
    Route::get(
        '/auth/google/callback',
        [GoogleAuthController::class, 'callback']
    )->name('google.callback');

    // Menampilkan halaman pemilihan role
    // dan kelengkapan profil pengguna baru.
    Route::get(
        '/auth/google/complete',
        [GoogleAuthController::class, 'showComplete']
    )->name('google.complete');

    // Menyimpan akun Google baru
    // beserta profil Worker atau Employer.
    Route::post(
        '/auth/google/complete',
        [GoogleAuthController::class, 'storeComplete']
    )->name('google.complete.store');
});

// ========================================
// AUTHENTICATION
// ========================================

Route::middleware(['auth'])->group(function () {

    // ========================================
    // HALAMAN STATUS VERIFIKASI AKUN
    // ========================================

    Route::get('/verification/pending', function (Request $request) {

        $user = $request->user();

        // Admin atau pengguna aktif
        // diarahkan ke dashboard sesuai role.
        if (
            $user->role === 'admin'
            || $user->verification_status === 'approved'
        ) {
            return redirect()->route('dashboard');
        }

        // Tetap dipertahankan untuk akun lama
        // yang masih memiliki status pending/rejected.
        return Inertia::render('auth/verification-pending');

    })->name('verification.pending');

    // ========================================
    // HANYA AKUN APPROVED
    // ========================================

    Route::middleware('approved')->group(function () {

        // Redirect ke dashboard sesuai role.
        Route::get(
            '/dashboard',
            DashboardRedirectController::class
        )->name('dashboard');

        // ========================================
        // PENCARI KERJA (WORKER)
        // ========================================

        Route::middleware('role:worker')->group(function () {

            // Dashboard Worker.
            Route::get(
                '/worker/dashboard',
                WorkerDashboardController::class
            )->name('worker.dashboard');

            // Halaman Cari Tugas.
            Route::get(
                '/worker/tasks',
                [WorkerTaskController::class, 'index']
            )->name('worker.tasks.index');

            // Halaman Lamaran Saya.
            Route::get(
                '/worker/applications',
                [WorkerTaskApplicationController::class, 'index']
            )->name('worker.applications.index');

            // Worker mengajukan lamaran.
            Route::post(
                '/worker/tasks/{task}/applications',
                [WorkerTaskApplicationController::class, 'store']
            )->name('worker.tasks.applications.store');

            // Detail tugas yang tersedia.
            Route::get(
                '/worker/tasks/{task}',
                [WorkerTaskController::class, 'show']
            )->name('worker.tasks.show');
        });

        // ========================================
        // PEMILIK UMKM (EMPLOYER)
        // ========================================

        Route::middleware('role:employer')->group(function () {

            // Dashboard UMKM.
            Route::get(
                '/employer/dashboard',
                EmployerDashboardController::class
            )->name('employer.dashboard');

            // Daftar semua tugas UMKM.
            Route::get(
                '/employer/tasks',
                [EmployerTaskController::class, 'index']
            )->name('employer.tasks.index');

            // Form membuat tugas baru.
            Route::get(
                '/employer/tasks/create',
                [EmployerTaskController::class, 'create']
            )->name('employer.tasks.create');

            // Menyimpan tugas sebagai Draft
            // atau sesuai alur publikasi aplikasi.
            Route::post(
                '/employer/tasks',
                [EmployerTaskController::class, 'store']
            )->name('employer.tasks.store');

            // Halaman Edit Draft.
            Route::get(
                '/employer/tasks/{task}/edit',
                [EmployerTaskController::class, 'edit']
            )->name('employer.tasks.edit');

            // Simpan hasil perubahan Draft.
            Route::patch(
                '/employer/tasks/{task}',
                [EmployerTaskController::class, 'update']
            )->name('employer.tasks.update');

            // Ajukan Draft untuk ditinjau Admin.
            Route::patch(
                '/employer/tasks/{task}/submit',
                [EmployerTaskController::class, 'submit']
            )->name('employer.tasks.submit');

            // ========================================
            // MANAJEMEN LAMARAN UMKM
            // ========================================

            // Pusat seluruh lamaran.
            Route::get(
                '/employer/applications',
                ApplicationInboxController::class
            )->name('employer.applications.index');

            // Daftar pelamar untuk satu tugas.
            Route::get(
                '/employer/tasks/{task}/applications',
                [EmployerTaskApplicationController::class, 'index']
            )->name('employer.tasks.applications.index');

            // Menerima atau menolak pelamar.
            Route::patch(
                '/employer/tasks/{task}/applications/{application}/decision',
                [EmployerTaskApplicationController::class, 'decide']
            )->name('employer.tasks.applications.decide');

            // Mencatat pembayaran upah pekerja.
            Route::patch(
                '/employer/applications/{application}/mark-paid',
                [EmployerTaskPaymentController::class, 'markPaid']
            )->name('employer.applications.mark-paid');
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

            // ========================================
            // PENINJAUAN TUGAS
            // ========================================

            // Daftar tugas untuk ditinjau.
            Route::get(
                '/admin/tasks',
                [TaskReviewController::class, 'index']
            )->name('admin.tasks.index');

            // Detail tugas.
            Route::get(
                '/admin/tasks/{task}',
                [TaskReviewController::class, 'show']
            )->name('admin.tasks.show');

            // Admin menyetujui tugas.
            Route::patch(
                '/admin/tasks/{task}/approve',
                [TaskReviewController::class, 'approve']
            )->name('admin.tasks.approve');

            // Admin menolak tugas.
            Route::patch(
                '/admin/tasks/{task}/reject',
                [TaskReviewController::class, 'reject']
            )->name('admin.tasks.reject');

            // ========================================
            // PERSETUJUAN AKUN PENGGUNA (LAMA)
            // ========================================

            // Masih dipertahankan agar fitur lama
            // tidak langsung rusak saat integrasi Google.
            // Nantinya dapat dihapus setelah alur
            // registrasi tanpa approval selesai diuji.

            // Admin menyetujui akun.
            Route::post(
                '/admin/verifications/{user}/approve',
                [VerificationController::class, 'approve']
            )->name('admin.verifications.approve');

            // Admin menolak akun.
            Route::post(
                '/admin/verifications/{user}/reject',
                [VerificationController::class, 'reject']
            )->name('admin.verifications.reject');

            // Unduh dokumen verifikasi.
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

require __DIR__.'/settings.php';
