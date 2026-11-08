<?php

namespace App\Http\Controllers;

use App\Models\PersonalInfo;
use App\Models\Skill;
use App\Models\Experience;
use App\Models\Project;

class PortfolioController extends Controller
{
    /**
     * Shown until the first details are saved in the admin, so a brand-new database
     * still gives a working page (and a way to reach the admin login in the footer).
     */
    private const EMPTY_INFO = [
        'name' => 'Your Name',
        'title' => 'Your title',
        'bio' => 'This site has no content yet. Use the admin link in the footer to sign in and add your details.',
        'email' => 'you@example.com',
        'github' => '',
        'linkedin' => '',
    ];

    /**
     * Get all portfolio data from the database.
     */
    private function getPortfolioData(): array
    {
        $info = PersonalInfo::first();
        $skills = Skill::orderBy('sort_order')->get();
        $experiences = Experience::orderBy('sort_order')->get();
        $projects = Project::with('image')->orderBy('sort_order')->get();

        return [
            'personal_info' => $info ? array_merge(self::EMPTY_INFO, array_filter($info->toArray(), fn ($v) => $v !== null)) : self::EMPTY_INFO,
            'skills' => $skills->map(fn($s) => [
                'category' => $s->category,
                'items' => $s->items,
            ])->toArray(),
            'experience' => $experiences->map(fn($e) => [
                'role' => $e->role,
                'company' => $e->company,
                'duration' => $e->duration,
                'description' => $e->description,
            ])->toArray(),
            'projects' => $projects->map(fn($p) => [
                'id' => $p->id,
                'title' => $p->title,
                'description' => $p->description,
                'tech_stack' => $p->tech_stack,
                'link' => $p->link,
                'repo_link' => $p->repo_link,
                // Only screenshots uploaded from admin are shown; old remote URLs are ignored.
                'image' => $p->imageUrl(),
                'featured' => $p->featured,
                'is_hero' => $p->is_hero,
            ])->toArray(),
        ];
    }

    public function index()
    {
        $portfolio_data = $this->getPortfolioData();
        return view('portfolio.index', compact('portfolio_data'));
    }

    public function projects()
    {
        $portfolio_data = $this->getPortfolioData();
        return view('portfolio.projects', compact('portfolio_data'));
    }
}
