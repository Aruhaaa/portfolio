<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Experience extends Model
{
    protected $fillable = ['role', 'company', 'duration', 'description', 'sort_order'];
}
