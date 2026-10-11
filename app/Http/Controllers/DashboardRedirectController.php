<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardRedirectController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $route = match ($request->user()->role) {
            'worker' => 'worker.dashboard',
            'employer' => 'employer.dashboard',
            'admin' => 'admin.dashboard',
            default => abort(403),
        };

        return redirect()->route($route);
    }
}
