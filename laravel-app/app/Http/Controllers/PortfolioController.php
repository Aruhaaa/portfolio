<?php

namespace App\Http\Controllers;

use App\Models\PersonalInfo;
use App\Models\Skill;
use App\Models\Experience;
use App\Models\Project;

class PortfolioController extends Controller
{
    /**
     * Get all portfolio data from the database.
     */
    private function getPortfolioData(): array
    {
        $info = PersonalInfo::first();
        $skills = Skill::orderBy('sort_order')->get();
        $experiences = Experience::orderBy('sort_order')->get();
        $projects = Project::orderBy('sort_order')->get();

        return [
            'personal_info' => $info ? $info->toArray() : [],
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
                'image' => ($p->thumbnail && !preg_match('#^https?://#i', $p->thumbnail))
                    ? asset($p->thumbnail)
                    : null,
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
