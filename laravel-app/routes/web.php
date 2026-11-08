<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\AdminController;

// Public routes
Route::get('/', [PortfolioController::class, 'index']);
Route::get('/projects', [PortfolioController::class, 'projects'])->name('projects');

// Admin auth
Route::post('/admin/login', [AdminController::class, 'login'])->name('admin.login');
Route::post('/admin/logout', [AdminController::class, 'logout'])->name('admin.logout');

// Admin dashboard (protected)
Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');

    Route::put('/personal-info', [AdminController::class, 'updatePersonalInfo'])->name('personal-info.update');

    Route::post('/skills', [AdminController::class, 'storeSkill'])->name('skills.store');
    Route::delete('/skills/{skill}', [AdminController::class, 'deleteSkill'])->name('skills.delete');

    Route::post('/experiences', [AdminController::class, 'storeExperience'])->name('experiences.store');
    Route::delete('/experiences/{experience}', [AdminController::class, 'deleteExperience'])->name('experiences.delete');

    Route::post('/projects', [AdminController::class, 'storeProject'])->name('projects.store');
    Route::get('/projects/{project}/edit', [AdminController::class, 'editProject'])->name('projects.edit');
    Route::put('/projects/{project}', [AdminController::class, 'updateProject'])->name('projects.update');
    Route::delete('/projects/{project}', [AdminController::class, 'deleteProject'])->name('projects.delete');
    Route::post('/projects/{project}/hero', [AdminController::class, 'setHeroProject'])->name('projects.hero');
});
