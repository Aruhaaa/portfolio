<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Project extends Model
{
    protected $fillable = [
        'title',
        'description',
        'tech_stack',
        'thumbnail',
        'link',
        'repo_link',
        'featured',
        'is_hero'
    ];

    protected $casts = [
        'tech_stack' => 'array',
        'featured' => 'boolean',
    ];

    /**
     * The screenshot, without the picture itself. The picture is big, so only the media
     * route (MediaController) ever loads it.
     */
    public function image(): HasOne
    {
        return $this->hasOne(ProjectImage::class)->select(['id', 'project_id', 'mime', 'hash']);
    }

    /**
     * Address of the screenshot, or null when there is none. The short hash in the address
     * changes whenever the picture is replaced, so browsers never show an old copy.
     */
    public function imageUrl(): ?string
    {
        if ($this->image) {
            return route('projects.image', ['project' => $this->id, 'v' => substr($this->image->hash, 0, 12)]);
        }

        // An older upload that still lives as a file in public/uploads (before the newest migration)
        if ($this->thumbnail && !preg_match('#^https?://#i', $this->thumbnail) && is_file(public_path($this->thumbnail))) {
            return asset($this->thumbnail);
        }

        return null;
    }
}
