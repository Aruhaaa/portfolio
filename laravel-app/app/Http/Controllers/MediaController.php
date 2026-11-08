<?php

namespace App\Http\Controllers;

use App\Models\ProjectImage;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MediaController extends Controller
{
    /**
     * Serves a project's screenshot. This route runs without sessions or cookies (see
     * bootstrap/app.php), which is what lets browsers and CDNs cache it for a long time.
     */
    public function projectImage(Request $request, int $project): Response
    {
        $image = ProjectImage::where('project_id', $project)->firstOrFail();

        $etag = '"' . $image->hash . '"';
        $headers = [
            'ETag' => $etag,
            'Cache-Control' => 'public, max-age=31536000, s-maxage=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ];

        if ($request->headers->get('If-None-Match') === $etag) {
            return response('', 304, $headers);
        }

        return response($image->bytes(), 200, $headers + ['Content-Type' => $image->mime]);
    }
}
