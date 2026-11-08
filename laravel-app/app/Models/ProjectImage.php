<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;

/**
 * A project's screenshot, kept in the database instead of a folder, so the site works on hosts
 * where the disk is not permanent (Vercel, Render's free plan and similar).
 */
class ProjectImage extends Model
{
    public const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];

    /** Wider screenshots are scaled down to this many pixels, which keeps pages light. */
    public const MAX_WIDTH = 1400;

    /** A picture bigger than this is re-encoded even when it is not too wide. */
    public const MAX_BYTES = 300 * 1024;

    protected $fillable = ['project_id', 'mime', 'hash', 'data'];

    public static function storeFor(Project $project, UploadedFile $file): self
    {
        [$bytes, $mime] = static::prepare(
            (string) file_get_contents($file->getRealPath()),
            $file->getMimeType() ?: 'application/octet-stream'
        );

        return static::updateOrCreate(
            ['project_id' => $project->id],
            ['mime' => $mime, 'hash' => sha1($bytes), 'data' => base64_encode($bytes)]
        );
    }

    public function bytes(): string
    {
        return (string) base64_decode($this->data, true);
    }

    /**
     * Returns [bytes, mime]. Scales a wide or heavy screenshot down, and re-encodes it as WebP
     * (a fraction of the size of a PNG screenshot, and every current browser shows it).
     * Needs the GD extension; without it, or if anything looks risky, the original comes back untouched.
     */
    public static function prepare(string $bytes, string $mime): array
    {
        $mime = $mime === 'image/jpg' ? 'image/jpeg' : $mime;
        if (!in_array($mime, static::ALLOWED, true) || !function_exists('imagecreatefromstring')) {
            return [$bytes, $mime];
        }

        $info = @getimagesizefromstring($bytes);
        if (!$info) {
            return [$bytes, $mime];
        }
        [$w, $h] = $info;
        $tooWide = $w > static::MAX_WIDTH;
        if (!$tooWide && strlen($bytes) <= static::MAX_BYTES) {
            return [$bytes, $mime];
        }

        // GD holds the picture decoded, about 5 bytes per pixel. Skip if that would not fit in memory.
        $limit = static::memoryLimit();
        if ($limit > 0 && ($w * $h * 5 + memory_get_usage()) > $limit * 0.8) {
            return [$bytes, $mime];
        }

        $src = @imagecreatefromstring($bytes);
        if (!$src) {
            return [$bytes, $mime];
        }

        $nw = $tooWide ? static::MAX_WIDTH : $w;
        $nh = max(1, (int) round($h * $nw / $w));
        $dst = imagecreatetruecolor($nw, $nh);
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);

        $best = [$bytes, $mime];
        $candidates = [];
        if (function_exists('imagewebp')) {
            $candidates[] = ['image/webp', fn () => imagewebp($dst, null, 85)];
        }
        $candidates[] = $mime === 'image/png'
            ? ['image/png', fn () => imagepng($dst, null, 7)]
            : ['image/jpeg', fn () => imagejpeg($dst, null, 85)];

        foreach ($candidates as [$candidateMime, $encode]) {
            ob_start();
            $ok = $encode();
            $out = (string) ob_get_clean();
            // Keep the smallest result, but never a bigger file than the one that was uploaded
            if ($ok && $out !== '' && strlen($out) < strlen($best[0])) {
                $best = [$out, $candidateMime];
            }
        }

        imagedestroy($src);
        imagedestroy($dst);

        return $best;
    }

    private static function memoryLimit(): int
    {
        $raw = trim((string) ini_get('memory_limit'));
        if ($raw === '' || $raw === '-1') {
            return -1;
        }
        $n = (int) $raw;
        return match (strtolower(substr($raw, -1))) {
            'g' => $n * 1024 ** 3,
            'm' => $n * 1024 ** 2,
            'k' => $n * 1024,
            default => $n,
        };
    }
}
