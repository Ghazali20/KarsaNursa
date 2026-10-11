<?php

use App\Http\Controllers\DashboardRedirectController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
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
            'auth/verification-pending',
        );
    })->name('verification.pending');

    Route::middleware('approved')->group(function () {
        Route::get(
            '/dashboard',
            DashboardRedirectController::class,
        )->name('dashboard');

        Route::middleware('role:worker')->group(function () {
            Route::inertia(
                '/worker/dashboard',
                'worker/dashboard',
            )->name('worker.dashboard');
        });

        Route::middleware('role:employer')->group(function () {
            Route::inertia(
                '/employer/dashboard',
                'employer/dashboard',
            )->name('employer.dashboard');
        });

        Route::middleware('role:admin')->group(function () {
            Route::inertia(
                '/admin',
                'admin/dashboard',
            )->name('admin.dashboard');
        });
    });
});

require __DIR__.'/settings.php';
