<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AutoLoginInDev
{
    /**
     * Handle an incoming request.
     * In local development, automatically authenticate as admin if not already logged in,
     * allowing seamless UI testing without a separate auth flow.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('local') && !Auth::check()) {
            $admin = User::where('email', 'admin@erp.local')->first() ?? User::first();
            if ($admin) {
                Auth::login($admin);
            }
        }

        return $next($request);
    }
}
