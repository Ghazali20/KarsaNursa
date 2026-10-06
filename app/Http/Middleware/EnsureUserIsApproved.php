<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsApproved
{
    public function handle(
        Request $request,
        Closure $next,
    ): Response {
        $user = $request->user();

        if (
            $user !== null
            && (
                $user->role === 'admin'
                || $user->verification_status === 'approved'
            )
        ) {
            return $next($request);
        }

        return redirect()->route('verification.pending');
    }
}
