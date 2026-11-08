<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit project</title>
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
                <h1>Edit <span class="highlight">Project</span></h1>
                <div class="admin-header-actions">
                    <a href="{{ route('admin.dashboard') }}" class="btn-secondary">Back to dashboard</a>
                </div>
            </div>
        </header>

        @if($errors->any())
            <div class="alert-success" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #fca5a5;">
                {{ $errors->first() }}
            </div>
        @endif

        @php
            $hasUpload = $project->thumbnail && !preg_match('#^https?://#i', $project->thumbnail);
        @endphp

        <section class="admin-section">
            <form action="{{ route('admin.projects.update', $project) }}" method="POST" enctype="multipart/form-data" class="admin-form glass-panel">
                @csrf
                @method('PUT')
                <div class="form-row">
                    <div class="form-group">
                        <label for="title">Title</label>
                        <input type="text" id="title" name="title" value="{{ old('title', $project->title) }}" required>
                    </div>
                    <div class="form-group">
                        <label for="tech_stack">Tech stack (comma-separated)</label>
                        <input type="text" id="tech_stack" name="tech_stack" value="{{ old('tech_stack', implode(', ', $project->tech_stack ?? [])) }}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description" rows="4" required>{{ old('description', $project->description) }}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="link">Live site link</label>
                        <input type="url" id="link" name="link" value="{{ old('link', $project->link === '#' ? '' : $project->link) }}" placeholder="https://my-project.example.com">
                    </div>
                    <div class="form-group">
                        <label for="repo_link">GitHub link</label>
                        <input type="url" id="repo_link" name="repo_link" value="{{ old('repo_link', $project->repo_link) }}" placeholder="https://github.com/you/repo">
                    </div>
                </div>
                <div class="form-group">
                    <label for="screenshot">{{ $hasUpload ? 'Replace screenshot' : 'Screenshot' }} (JPG, PNG or WebP, up to 4 MB)</label>
                    @if($hasUpload)
                        <img src="{{ asset($project->thumbnail) }}" alt="Current screenshot" style="display:block; max-width: 260px; margin-bottom: 0.75rem; border-radius: 0.5rem;">
                    @endif
                    <input type="file" id="screenshot" name="screenshot" accept="image/png,image/jpeg,image/webp">
                </div>
                @if($hasUpload)
                    <label class="checkbox-label">
                        <input type="checkbox" name="remove_screenshot"> Remove current screenshot
                    </label>
                @endif
                <label class="checkbox-label">
                    <input type="checkbox" name="featured" @checked(old('featured', $project->featured))> Featured project
                </label>
                <button type="submit" class="btn-primary">Save changes</button>
            </form>
        </section>
    </div>
</body>
</html>
