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
// GOOGLE OAUTH - LOGIN DAN REGISTRASI
// ========================================

Route::middleware('guest')->group(function () {

    // Mengarahkan pengguna ke Google.
    Route::get(
        '/auth/google/redirect',
        [GoogleAuthController::class, 'redirect']
    )->name('google.redirect');

    // Callback dari Google.
    Route::get(
        '/auth/google/callback',
        [GoogleAuthController::class, 'callback']
    )->name('google.callback');

    // Form melengkapi pendaftaran Google.
    Route::get(
        '/auth/google/complete',
        [GoogleAuthController::class, 'showComplete']
    )->name('google.complete');

    // Simpan data pendaftaran Google.
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
    // HALAMAN STATUS VERIFIKASI LAMA
    // ========================================

    Route::get('/verification/pending', function (Request $request) {
        $user = $request->user();

        if (
            $user->role === 'admin'
            || $user->verification_status === 'approved'
        ) {
            return redirect()->route('dashboard');
        }

        // Untuk akun lama yang belum approved.
        return Inertia::render('auth/verification-pending');
    })->name('verification.pending');

    // ========================================
    // AKUN YANG DAPAT MENGAKSES DASHBOARD
    // ========================================

    Route::middleware('approved')->group(function () {

        // Redirect berdasarkan role.
        Route::get(
            '/dashboard',
            DashboardRedirectController::class
        )->name('dashboard');

        // ========================================
        // ROLE PENCARI KERJA (WORKER)
        // ========================================

        Route::middleware('role:worker')->group(function () {

            // Dashboard Pencari Kerja.
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

            // Mengajukan lamaran tugas.
            Route::post(
                '/worker/tasks/{task}/applications',
                [WorkerTaskApplicationController::class, 'store']
            )->name('worker.tasks.applications.store');

            // Detail tugas.
            Route::get(
                '/worker/tasks/{task}',
                [WorkerTaskController::class, 'show']
            )->name('worker.tasks.show');
        });

        // ========================================
        // ROLE PEMILIK UMKM (EMPLOYER)
        // ========================================

        Route::middleware('role:employer')->group(function () {

            // Dashboard Pemilik UMKM.
            Route::get(
                '/employer/dashboard',
                EmployerDashboardController::class
            )->name('employer.dashboard');

            // Daftar tugas UMKM.
            Route::get(
                '/employer/tasks',
                [EmployerTaskController::class, 'index']
            )->name('employer.tasks.index');

            // Form membuat tugas.
            Route::get(
                '/employer/tasks/create',
                [EmployerTaskController::class, 'create']
            )->name('employer.tasks.create');

            // Simpan tugas.
            Route::post(
                '/employer/tasks',
                [EmployerTaskController::class, 'store']
            )->name('employer.tasks.store');

            // Edit tugas Draft.
            Route::get(
                '/employer/tasks/{task}/edit',
                [EmployerTaskController::class, 'edit']
            )->name('employer.tasks.edit');

            // Update tugas Draft.
            Route::patch(
                '/employer/tasks/{task}',
                [EmployerTaskController::class, 'update']
            )->name('employer.tasks.update');

            // Ajukan tugas untuk diperiksa Admin.
            Route::patch(
                '/employer/tasks/{task}/submit',
                [EmployerTaskController::class, 'submit']
            )->name('employer.tasks.submit');

            // ====================================
            // MANAJEMEN LAMARAN UMKM
            // ====================================

            // Seluruh lamaran yang masuk.
            Route::get(
                '/employer/applications',
                ApplicationInboxController::class
            )->name('employer.applications.index');

            // Lamaran pada satu tugas.
            Route::get(
                '/employer/tasks/{task}/applications',
                [EmployerTaskApplicationController::class, 'index']
            )->name('employer.tasks.applications.index');

            // Menerima atau menolak pelamar.
            Route::patch(
                '/employer/tasks/{task}/applications/{application}/decision',
                [EmployerTaskApplicationController::class, 'decide']
            )->name('employer.tasks.applications.decide');

            // Mencatat pembayaran pekerja.
            Route::patch(
                '/employer/applications/{application}/mark-paid',
                [EmployerTaskPaymentController::class, 'markPaid']
            )->name('employer.applications.mark-paid');
        });

        // ========================================
        // ROLE ADMIN
        // SESUAI STRUKTUR FIGMA FINAL
        // ========================================

        Route::middleware('role:admin')->group(function () {

            // ====================================
            // 1. DASHBOARD ADMIN
            // ====================================

            // Dashboard statistik platform.
            // Menggunakan index() yang sudah
            // diperbarui di VerificationController.
            Route::get(
                '/admin',
                [VerificationController::class, 'index']
            )->name('admin.dashboard');


            // ========================================
            // MANAJEMEN AKUN ADMIN
            // ========================================

            // Menampilkan halaman Manajemen Akun.
            Route::get(
                '/admin/users',
                [VerificationController::class, 'users']
            )->name('admin.users.index');

            // Menyetujui dokumen pengguna.
            Route::patch(
                '/admin/users/documents/{document}/approve',
                [VerificationController::class, 'approveDocument']
            )->name('admin.users.documents.approve');

            // Menolak dokumen dengan alasan.
            Route::patch(
                '/admin/users/documents/{document}/reject',
                [VerificationController::class, 'rejectDocument']
            )->name('admin.users.documents.reject');


            // ====================================
            // 3. MANAJEMEN TUGAS
            // ====================================

            // Daftar tugas yang ditinjau Admin.
            Route::get(
                '/admin/tasks',
                [TaskReviewController::class, 'index']
            )->name('admin.tasks.index');

            // Detail tugas.
            Route::get(
                '/admin/tasks/{task}',
                [TaskReviewController::class, 'show']
            )->name('admin.tasks.show');

            // Menyetujui tugas.
            Route::patch(
                '/admin/tasks/{task}/approve',
                [TaskReviewController::class, 'approve']
            )->name('admin.tasks.approve');

            // Menolak tugas dengan alasan.
            Route::patch(
                '/admin/tasks/{task}/reject',
                [TaskReviewController::class, 'reject']
            )->name('admin.tasks.reject');

            // ====================================
            // 4. SENGKETA & LAPORAN
            // ====================================

            // Halaman awal laporan pengguna.
            // Sistem pengaduan akan dibuat
            // pada pengembangan berikutnya.
            Route::get(
                '/admin/reports',
                fn() => Inertia::render(
                    'admin/section-placeholder',
                    [
                        'title' => 'Sengketa & Laporan',
                        'description' => 'Kelola pengaduan pengguna dan sengketa pekerjaan di KarsaNursa.',
                    ]
                )
            )->name('admin.reports.index');

            // ====================================
            // 5. LOG AKTIVITAS
            // ====================================

            // Halaman awal log aktivitas.
            // Backend audit log belum tersedia.
            Route::get(
                '/admin/logs',
                fn() => Inertia::render(
                    'admin/section-placeholder',
                    [
                        'title' => 'Log Aktivitas',
                        'description' => 'Lihat riwayat aktivitas dan tindakan administratif KarsaNursa.',
                    ]
                )
            )->name('admin.logs.index');

            // ====================================
            // PEMERIKSAAN DOKUMEN
            // BAGIAN DARI MANAJEMEN AKUN
            // ====================================

            // Redirect ke halaman Manajemen Akun.
            Route::get(
                '/admin/documents',
                fn() => redirect()->route('admin.users.index')
            )->name('admin.documents.index');

            // ====================================
            // VERIFIKASI AKUN LAMA
            // ====================================

            // Dipertahankan untuk kompatibilitas
            // fitur dan pengujian sebelumnya.
            //
            // Akun baru langsung aktif,
            // sehingga tidak perlu approval akun.

            // Approve akun lama.
            Route::post(
                '/admin/verifications/{user}/approve',
                [VerificationController::class, 'approve']
            )->name('admin.verifications.approve');

            // Reject akun lama.
            Route::post(
                '/admin/verifications/{user}/reject',
                [VerificationController::class, 'reject']
            )->name('admin.verifications.reject');

            // ====================================
            // DOWNLOAD DOKUMEN PRIVAT
            // ====================================

            // Dokumen hanya boleh diakses Admin.
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
