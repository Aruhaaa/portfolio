@extends('layouts.app')

@section('content')

<!-- Hero Section -->
<section id="about" class="hero section">
    <div class="hero-content fade-in-up">
        @php
            $info = $portfolio_data['personal_info'];
        @endphp
        <h1>Hi, I'm <span class="highlight">{{ explode(' ', $info['name'])[0] }}</span></h1>
        <h2 class="subtitle">{{ $info['title'] }}</h2>
        <p class="bio glass-panel">{{ $info['bio'] }}</p>
        <div class="cta-buttons">
            <a href="#projects" class="btn-primary">View Projects</a>
            <a href="#contact" class="btn-secondary">Contact Me</a>
        </div>
    </div>
</section>

<!-- Skills Section -->
<section id="skills" class="section">
    <h2 class="section-title fade-in-up">Technical Expertise</h2>
    <div class="skills-grid">
        @foreach ($portfolio_data['skills'] as $skill_group)
            <div class="skill-card glass-panel fade-in-up">
                <h3>{{ $skill_group['category'] }}</h3>
                <ul class="skill-list">
                    @foreach ($skill_group['items'] as $item)
                        <li><span class="pill">{{ $item }}</span></li>
                    @endforeach
                </ul>
            </div>
        @endforeach
    </div>
</section>

<!-- Experience Section -->
<section id="experience" class="section">
    <h2 class="section-title fade-in-up">Professional Experience</h2>
    <div class="timeline">
        @foreach ($portfolio_data['experience'] as $job)
            <div class="timeline-item glass-panel fade-in-up">
                <div class="timeline-header">
                    <h3>{{ $job['role'] }}</h3>
                    <span class="duration highlight">{{ $job['duration'] }}</span>
                </div>
                <h4 class="company">{{ $job['company'] }}</h4>
                <p>{{ $job['description'] }}</p>
            </div>
        @endforeach
    </div>
</section>

<!-- Projects Section -->
<section id="projects" class="section">
    <h2 class="section-title fade-in-up">Featured Projects</h2>
    <div class="projects-grid">
        @foreach ($portfolio_data['projects'] as $project)
            <div class="project-card glass-panel fade-in-up">
                <h3>{{ $project['title'] }}</h3>
                <p>{{ $project['description'] }}</p>
                <div class="tech-stack">
                    @foreach ($project['tech_stack'] as $tech)
                        <span class="pill-outline">{{ $tech }}</span>
                    @endforeach
                </div>
            </div>
        @endforeach
    </div>
</section>

<!-- Contact Section -->
<section id="contact" class="section">
    <div class="contact-box glass-panel fade-in-up">
        <h2 class="section-title">Let's Connect</h2>
        <p>Interested in collaborating or have an open role? I'm always open to discussing new opportunities.</p>
        <a href="mailto:{{ $info['email'] }}" class="btn-primary">Say Hello</a>
    </div>
</section>

@endsection
