<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class Cors
{
    public function handle(Request $request, Closure $next)
    {
        /** @var Response $response */
        $response = $next($request);

        $allowedOrigins = array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', '*'))));
        $origin = $request->headers->get('origin');

        if (in_array('*', $allowedOrigins, true)) {
            $response->headers->set('Access-Control-Allow-Origin', '*');
        } elseif ($origin && in_array($origin, $allowedOrigins, true)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Vary', 'Origin');
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type,Accept,Authorization,X-Requested-With,X-CSRF-TOKEN');

        if ($request->method() === 'OPTIONS') {
            $response->setStatusCode(204);
        }

        return $response;
    }
}
