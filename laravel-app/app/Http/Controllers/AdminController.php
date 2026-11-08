<?php

namespace App\Http\Controllers;

use App\Models\PersonalInfo;
use App\Models\Skill;
use App\Models\Experience;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    /**
     * Show the admin dashboard.
     */
    public function dashboard()
    {
        $info = PersonalInfo::first();
        $skills = Skill::orderBy('sort_order')->get();
        $experiences = Experience::orderBy('sort_order')->get();
        $projects = Project::orderBy('sort_order')->get();

        return view('admin.dashboard', compact('info', 'skills', 'experiences', 'projects'));
    }

    /**
     * Handle admin login.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            return redirect()->route('admin.dashboard');
        }

        return back()->withErrors(['email' => 'Invalid credentials.']);
    }

    /**
     * Handle admin logout.
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }

    /**
     * Update personal info.
     */
    public function updatePersonalInfo(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'bio' => 'required|string',
            'email' => 'required|email',
            'github' => 'nullable|string|max:255',
            'linkedin' => 'nullable|string|max:255',
        ]);

        PersonalInfo::updateOrCreate(['id' => 1], $data);
        return back()->with('success', 'Personal info updated!');
    }

    /**
     * Store a new skill.
     */
    public function storeSkill(Request $request)
    {
        $data = $request->validate([
            'category' => 'required|string|max:255',
            'items' => 'required|string', // Comma-separated
        ]);

        Skill::create([
            'category' => $data['category'],
            'items' => array_map('trim', explode(',', $data['items'])),
            'sort_order' => Skill::max('sort_order') + 1,
        ]);

        return back()->with('success', 'Skill added!');
    }

    /**
     * Delete a skill.
     */
    public function deleteSkill(Skill $skill)
    {
        $skill->delete();
        return back()->with('success', 'Skill deleted!');
    }

    /**
     * Store a new experience.
     */
    public function storeExperience(Request $request)
    {
        $data = $request->validate([
            'role' => 'required|string|max:255',
            'company' => 'required|string|max:255',
            'duration' => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        Experience::create(array_merge($data, [
            'sort_order' => Experience::max('sort_order') + 1,
        ]));

        return back()->with('success', 'Experience added!');
    }

    /**
     * Delete an experience.
     */
    public function deleteExperience(Experience $experience)
    {
        $experience->delete();
        return back()->with('success', 'Experience deleted!');
    }

    /**
     * Store a new project.
     */
    public function storeProject(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'tech_stack' => 'required|string', // Comma-separated
            'link' => 'nullable|url|max:255',
            'repo_link' => 'nullable|url|max:255',
            'screenshot' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'featured' => 'nullable',
        ]);

        $thumbnail = null;
        if ($request->hasFile('screenshot')) {
            $file = $request->file('screenshot');
            $name = Str::random(20) . '.' . $file->extension();
            $file->move(public_path('uploads/projects'), $name);
            $thumbnail = 'uploads/projects/' . $name;
        }

        Project::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'tech_stack' => array_map('trim', explode(',', $data['tech_stack'])),
            'link' => $data['link'] ?? '#',
            'repo_link' => $data['repo_link'] ?? null,
            'thumbnail' => $thumbnail,
            'featured' => isset($data['featured']),
            'sort_order' => Project::max('sort_order') + 1,
        ]);

        return back()->with('success', 'Project added!');
    }

    /**
     * Show the edit form for a project.
     */
    public function editProject(Project $project)
    {
        return view('admin.project-edit', compact('project'));
    }

    /**
     * Update a project. Leaves the hero flag and sort order alone.
     */
    public function updateProject(Request $request, Project $project)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'tech_stack' => 'required|string', // Comma-separated
            'link' => 'nullable|url|max:255',
            'repo_link' => 'nullable|url|max:255',
            'screenshot' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $hasUpload = $project->thumbnail && !preg_match('#^https?://#i', $project->thumbnail);
        $thumbnail = $project->thumbnail;

        if ($request->hasFile('screenshot')) {
            $file = $request->file('screenshot');
            $name = Str::random(20) . '.' . $file->extension();
            $file->move(public_path('uploads/projects'), $name);
            if ($hasUpload) {
                @unlink(public_path($project->thumbnail));
            }
            $thumbnail = 'uploads/projects/' . $name;
        } elseif ($request->boolean('remove_screenshot')) {
            if ($hasUpload) {
                @unlink(public_path($project->thumbnail));
            }
            $thumbnail = null;
        }

        $project->update([
            'title' => $data['title'],
            'description' => $data['description'],
            'tech_stack' => array_values(array_filter(array_map('trim', explode(',', $data['tech_stack'])))),
            'link' => $data['link'] ?? '#',
            'repo_link' => $data['repo_link'] ?? null,
            'thumbnail' => $thumbnail,
            'featured' => $request->boolean('featured'),
        ]);

        return redirect()->route('admin.dashboard')->with('success', 'Project updated!');
    }

    /**
     * Delete a project.
     */
    public function deleteProject(Project $project)
    {
        if ($project->thumbnail && !preg_match('#^https?://#i', $project->thumbnail)) {
            @unlink(public_path($project->thumbnail));
        }
        $project->delete();
        return back()->with('success', 'Project deleted!');
    }

    /**
     * Set a project as the hero image (toggle, max 3).
     */
    public function setHeroProject(Project $project)
    {
        if (!$project->is_hero) {
            // Trying to set as hero, check limit
            $currentHeroCount = Project::where('is_hero', true)->count();
            if ($currentHeroCount >= 3) {
                return back()->withErrors(['message' => 'You can only select up to 3 hero projects.']);
            }
            $project->is_hero = true;
            $msg = 'Added to hero projects!';
        } else {
            // Toggle off
            $project->is_hero = false;
            $msg = 'Removed from hero projects.';
        }
        
        $project->save();
        
        return back()->with('success', $msg);
    }
}
