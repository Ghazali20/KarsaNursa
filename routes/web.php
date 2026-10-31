<?php

use App\Http\Controllers\Admin\VerificationController;
use App\Http\Controllers\DashboardRedirectController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

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

        return Inertia::render(
            'auth/verification-pending'
        );
    })->name('verification.pending');

    Route::middleware('approved')->group(function () {

        // Redirect dashboard berdasarkan role.
        Route::get(
            '/dashboard',
            DashboardRedirectController::class,
        )->name('dashboard');

        // ========================================
        // PENCA​​RI KERJA
        // ========================================
        Route::middleware('role:worker')->group(function () {
            Route::inertia(
                '/worker/dashboard',
                'worker/dashboard',
            )->name('worker.dashboard');
        });

        // ========================================
        // PEMILIK UMKM
        // ========================================
        Route::middleware('role:employer')->group(function () {
            Route::inertia(
                '/employer/dashboard',
                'employer/dashboard',
            )->name('employer.dashboard');
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

            // Approve akun.
            Route::post(
                '/admin/verifications/{user}/approve',
                [VerificationController::class, 'approve']
            )->name('admin.verifications.approve');

            // Reject akun.
            Route::post(
                '/admin/verifications/{user}/reject',
                [VerificationController::class, 'reject']
            )->name('admin.verifications.reject');

            // Download dokumen verifikasi.
            Route::get(
                '/admin/verifications/documents/{document}',
                [VerificationController::class, 'download']
            )->name('admin.verifications.document');

        });
    });
});

require __DIR__.'/settings.php';
