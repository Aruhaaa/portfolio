<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/css/admin.css') }}">
</head>
<body>
    <div class="animated-background">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
    </div>

    <div class="admin-wrapper">
        <header class="admin-header">
            <div class="admin-header-inner">
                <h1>Admin <span class="highlight">Dashboard</span></h1>
                <div class="admin-header-actions">
                    <a href="/" class="btn-secondary">Back to Site</a>
                    <form action="{{ route('admin.logout') }}" method="POST" style="display:inline;">
                        @csrf
                        <button type="submit" class="btn-primary-outline">Logout</button>
                    </form>
                </div>
            </div>
        </header>

        @if(session('success'))
            <div class="alert-success">{{ session('success') }}</div>
        @endif

        <!-- Personal Info Section -->
        <section class="admin-section">
            <h2>Personal Info</h2>
            <form action="{{ route('admin.personal-info.update') }}" method="POST" class="admin-form glass-panel">
                @csrf
                @method('PUT')
                <div class="form-row">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" name="name" value="{{ $info->name ?? '' }}" required>
                    </div>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" name="title" value="{{ $info->title ?? '' }}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Bio</label>
                    <textarea name="bio" rows="3" required>{{ $info->bio ?? '' }}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value="{{ $info->email ?? '' }}" required>
                    </div>
                    <div class="form-group">
                        <label>GitHub URL</label>
                        <input type="text" name="github" value="{{ $info->github ?? '' }}">
                    </div>
                    <div class="form-group">
                        <label>LinkedIn URL</label>
                        <input type="text" name="linkedin" value="{{ $info->linkedin ?? '' }}">
                    </div>
                </div>
                <button type="submit" class="btn-primary">Save Changes</button>
            </form>
        </section>

        <!-- Skills Section -->
        <section class="admin-section">
            <h2>Skills</h2>
            <div class="admin-items">
                @foreach($skills as $skill)
                    <div class="admin-item glass-panel">
                        <div>
                            <strong>{{ $skill->category }}</strong>
                            <p class="item-meta">{{ implode(', ', $skill->items) }}</p>
                        </div>
                        <form action="{{ route('admin.skills.delete', $skill) }}" method="POST">
                            @csrf @method('DELETE')
                            <button type="submit" class="btn-delete" onclick="return confirm('Delete this skill?')">×</button>
                        </form>
                    </div>
                @endforeach
            </div>
            <form action="{{ route('admin.skills.store') }}" method="POST" class="admin-form glass-panel add-form">
                @csrf
                <h3>Add Skill</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>Category</label>
                        <input type="text" name="category" placeholder="e.g., Cloud & Infrastructure" required>
                    </div>
                    <div class="form-group">
                        <label>Skills (comma-separated)</label>
                        <input type="text" name="items" placeholder="e.g., AWS, Docker, Kubernetes" required>
                    </div>
                </div>
                <button type="submit" class="btn-primary">Add Skill</button>
            </form>
        </section>

        <!-- Experience Section -->
        <section class="admin-section">
            <h2>Experience</h2>
            <div class="admin-items">
                @foreach($experiences as $exp)
                    <div class="admin-item glass-panel">
                        <div>
                            <strong>{{ $exp->role }}</strong> at {{ $exp->company }}
                            <p class="item-meta">{{ $exp->duration }}</p>
                        </div>
                        <form action="{{ route('admin.experiences.delete', $exp) }}" method="POST">
                            @csrf @method('DELETE')
                            <button type="submit" class="btn-delete" onclick="return confirm('Delete this experience?')">×</button>
                        </form>
                    </div>
                @endforeach
            </div>
            <form action="{{ route('admin.experiences.store') }}" method="POST" class="admin-form glass-panel add-form">
                @csrf
                <h3>Add Experience</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>Role</label>
                        <input type="text" name="role" placeholder="e.g., Senior Engineer" required>
                    </div>
                    <div class="form-group">
                        <label>Company</label>
                        <input type="text" name="company" placeholder="e.g., TechCorp" required>
                    </div>
                    <div class="form-group">
                        <label>Duration</label>
                        <input type="text" name="duration" placeholder="e.g., 2021 - Present" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" rows="2" placeholder="What did you accomplish?" required></textarea>
                </div>
                <button type="submit" class="btn-primary">Add Experience</button>
            </form>
        </section>

        <!-- Projects Section -->
        <section class="admin-section">
            <h2>Projects</h2>
            <div class="admin-items">
                @foreach($projects as $project)
                    <div class="admin-item glass-panel">
                        <div>
                            <strong>{{ $project->title }}</strong>
                            @if($project->featured) <span class="featured-badge">Featured</span> @endif
                            <p class="item-meta">{{ implode(', ', $project->tech_stack) }}</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <a href="{{ route('admin.projects.edit', $project) }}" class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Edit</a>
                            @if(!$project->is_hero)
                                <form action="{{ route('admin.projects.hero', $project) }}" method="POST">
                                    @csrf
                                    <button type="submit" class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Set as Hero</button>
                                </form>
                            @else
                                <form action="{{ route('admin.projects.hero', $project) }}" method="POST">
                                    @csrf
                                    <button type="submit" class="btn-primary-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; border-color: var(--accent); color: var(--accent);">Remove Hero</button>
                                </form>
                            @endif
                            <form action="{{ route('admin.projects.delete', $project) }}" method="POST">
                                @csrf @method('DELETE')
                                <button type="submit" class="btn-delete" onclick="return confirm('Delete this project?')">×</button>
                            </form>
                        </div>
                    </div>
                @endforeach
            </div>
            <form action="{{ route('admin.projects.store') }}" method="POST" enctype="multipart/form-data" class="admin-form glass-panel add-form">
                @csrf
                <h3>Add Project</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" name="title" placeholder="e.g., Cloud Migration" required>
                    </div>
                    <div class="form-group">
                        <label>Tech Stack (comma-separated)</label>
                        <input type="text" name="tech_stack" placeholder="e.g., AWS, Docker, Terraform" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" rows="2" placeholder="Describe the project" required></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Live site link</label>
                        <input type="url" name="link" placeholder="e.g., https://my-project.example.com">
                    </div>
                    <div class="form-group">
                        <label>GitHub link</label>
                        <input type="url" name="repo_link" placeholder="e.g., https://github.com/you/repo">
                    </div>
                </div>
                <div class="form-group">
                    <label>Screenshot (JPG, PNG or WebP, up to 3 MB)</label>
                    <input type="file" name="screenshot" accept="image/png,image/jpeg,image/webp">
                </div>
                <label class="checkbox-label">
                    <input type="checkbox" name="featured"> Featured Project
                </label>
                <button type="submit" class="btn-primary">Add Project</button>
            </form>
        </section>
    </div>

    <script src="{{ asset('assets/js/script.js') }}"></script>
</body>
</html>
