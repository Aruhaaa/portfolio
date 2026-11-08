<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
