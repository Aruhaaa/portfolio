<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personal_info', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('title');
            $table->text('bio');
            $table->string('email');
            $table->string('github')->nullable();
            $table->string('linkedin')->nullable();
            $table->timestamps();
        });

        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('category');
            $table->json('items'); // Store skill items as JSON array
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('experiences', function (Blueprint $table) {
            $table->id();
            $table->string('role');
            $table->string('company');
            $table->string('duration');
            $table->text('description');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->json('tech_stack'); // Store tech stack as JSON array
            $table->string('link')->nullable();
            $table->string('thumbnail')->nullable();
            $table->boolean('featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
        Schema::dropIfExists('experiences');
        Schema::dropIfExists('skills');
        Schema::dropIfExists('personal_info');
    }
};
