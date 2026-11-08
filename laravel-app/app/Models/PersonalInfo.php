<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PersonalInfo extends Model
{
    protected $table = 'personal_info';

    protected $fillable = [
        'name', 'title', 'bio', 'email', 'github', 'linkedin'
    ];
}
