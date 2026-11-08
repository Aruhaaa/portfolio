<?php

use App\Http\Controllers\MediaController;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Screenshots are served without the web middleware (no session, no cookies), so
            // browsers and CDNs are allowed to cache them.
            Route::get('/media/projects/{project}', [MediaController::class, 'projectImage'])
                ->whereNumber('project')
                ->name('projects.image');
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo('/');

        // The site sits behind a proxy on Vercel, Render and most hosts. Trust it, so links
        // use https and the visitor's real address (for the login limit) comes through.
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
