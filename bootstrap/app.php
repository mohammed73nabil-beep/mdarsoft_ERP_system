<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\AutoLoginInDev::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (
            \App\Exceptions\InsufficientStockException $e,
            \Illuminate\Http\Request $request
        ) {
            $rawMsg = $e->getMessage();
            $message = (! empty($rawMsg) && ! str_starts_with($rawMsg, 'Insufficient stock'))
                ? $rawMsg
                : 'المخزون غير كافٍ لإتمام هذه العملية.';

            if ($request->wantsJson() && ! $request->header('X-Inertia')) {
                return response()->json([
                    'message' => $message,
                    'errors' => ['stock' => [$message]],
                ], 422);
            }

            return back()->withErrors(['stock' => $message])->withInput();
        });

        $exceptions->render(function (
            \App\Exceptions\InvalidSerialStatusException $e,
            \Illuminate\Http\Request $request
        ) {
            $rawMsg = $e->getMessage();
            $message = (! empty($rawMsg) && ! str_contains($rawMsg, 'Invalid status') && ! str_contains($rawMsg, 'invalid status'))
                ? $rawMsg
                : 'حالة الرقم التسلسلي (السيريال) غير صالحة لهذه العملية.';

            if ($request->wantsJson() && ! $request->header('X-Inertia')) {
                return response()->json([
                    'message' => $message,
                    'errors' => ['serials' => [$message]],
                ], 422);
            }

            return back()->withErrors(['serials' => $message])->withInput();
        });
    })->create();


