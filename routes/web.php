<?php

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
        Route::inertia(
            '/dashboard',
            'dashboard',
        )->name('dashboard');
    });
});

require __DIR__.'/settings.php';
