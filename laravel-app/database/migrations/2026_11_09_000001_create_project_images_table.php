<?php

use App\Models\ProjectImage;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id')->unique();
            $table->string('mime', 50);
            $table->string('hash', 40);
            $table->longText('data'); // the picture, base64 encoded, so it works on every database
            $table->timestamps();
        });

        // Screenshots uploaded before this table existed are files in public/uploads.
        // Copy them in, so nothing is lost on a host that has no permanent disk.
        foreach (DB::table('projects')->whereNotNull('thumbnail')->get(['id', 'thumbnail']) as $row) {
            $path = preg_match('#^https?://#i', $row->thumbnail) ? null : public_path($row->thumbnail);
            if (!$path || !is_file($path)) {
                continue;
            }
            $mime = mime_content_type($path) ?: '';
            if (!in_array($mime, ProjectImage::ALLOWED, true)) {
                continue;
            }
            [$bytes, $mime] = ProjectImage::prepare((string) file_get_contents($path), $mime);
            DB::table('project_images')->insert([
                'project_id' => $row->id,
                'mime' => $mime,
                'hash' => sha1($bytes),
                'data' => base64_encode($bytes),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('project_images');
    }
};
