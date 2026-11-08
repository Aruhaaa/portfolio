@extends('layouts.app')

@section('content')
@php
    $info = $portfolio_data['personal_info'];
    $nameParts =explode(' ', $info['name']);
    $firstName = array_shift($nameParts);
    $surname = implode(' ', $nameParts);

    $pinned = array_values(array_filter($portfolio_data['projects'], fn ($p) => !empty($p['is_hero'])));
    $featured = array_values(array_filter($portfolio_data['projects'], fn ($p) => !empty($p['featured']) || !empty($p['is_hero'])));
    $filmProjects = array_slice($featured ?: $portfolio_data["projects"], 0, 12);
    $filmStart = 0;
    foreach ($filmProjects as $i => $p) { if (!empty($p["is_hero"])) { $filmStart = $i; break; } }
@endphp

<section class="hero" id="about">
    <div class="wrap hero-grid">
        <div class="hero-copy">
            <h1 class="hero-name">
                <span>{{ $firstName }}</span>
                @if($surname)<span>{{ $surname }}</span>@endif
            </h1>
            <p class="hero-title">{{ $info['title'] }}</p>
            <p class="hero-bio">{{ $info['bio'] }}</p>
            <p class="availability"><span class="led" aria-hidden="true"></span>Open to new roles and contract work</p>
            <div class="hero-actions">
                <a href="mailto:{{ $info['email'] }}" class="btn btn-solid">Email {{ $firstName }}</a>
                <a href="#experience" class="text-link">Read the work history</a>
            </div>
        </div>

        <div class="film-field" id="film-stage" role="group" aria-roledescription="carousel" aria-label="Selected projects. Focus a frame and use the arrow keys to move between them." data-start="{{ $filmStart }}">
            <h2 class="visually-hidden">Selected projects</h2>
            <ul class="film-track">
                @foreach ($filmProjects as $i => $project)
                    @php
                        $isPinned = !empty($project['is_hero']);
                        $hasLink = !empty($project['link']) && $project['link'] !== '#';
                    @endphp
                    <li class="frame {{ $isPinned ? 'is-pinned' : '' }}">
                        <button type="button" class="frame-btn" aria-label="Show {{ $project['title'] }}{{ $isPinned ? ' (pinned)' : '' }}">
                            <span class="frame-edge frame-edge-top" aria-hidden="true"><span class="frame-print">{{ $project['title'] }}</span></span>
                            <span class="frame-pic">
                                @if(!empty($project['image']))
                                    <img src="{{ $project['image'] }}" alt="" loading="{{ $i < 3 ? 'eager' : 'lazy' }}" draggable="false">
                                @else
                                    <span class="frame-card">{{ $project['title'] }}</span>
                                @endif
                            </span>
                            <span class="frame-edge frame-edge-bottom" aria-hidden="true"><span class="frame-print">{{ implode('  ', $project['tech_stack'] ?? []) }}</span></span>
                        </button>
                        <div class="frame-detail">
                            <h3><span class="{{ $isPinned ? 'mark' : '' }}">{{ $project['title'] }}</span>@if($isPinned)<span class="visually-hidden"> (pinned)</span>@endif</h3>
                            <p>{{ $project['description'] }}</p>
                            @if(!empty($project['tech_stack']))
                                <ul class="stack stack-ink">
                                    @foreach ($project['tech_stack'] as $tech)
                                        <li>{{ $tech }}</li>
                                    @endforeach
                                </ul>
                            @endif
                            @if($hasLink || !empty($project['repo_link']))
                                <div class="frame-links">
                                    @if($hasLink)
                                        <a href="{{ $project['link'] }}" class="text-link" target="_blank" rel="noopener noreferrer">Open live site</a>
                                    @endif
                                    @if(!empty($project['repo_link']))
                                        <a href="{{ $project['repo_link'] }}" class="text-link" target="_blank" rel="noopener noreferrer">View code on GitHub</a>
                                    @endif
                                </div>
                            @endif
                        </div>
                    </li>
                @endforeach
            </ul>
        </div>

        <div class="film-panel">
            <div class="film-caption" id="film-caption" aria-live="polite" aria-atomic="true"></div>
            <div class="film-controls">
                <button type="button" class="film-step" id="film-prev" aria-label="Previous project">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M11.5 3 5.5 9l6 6"/></svg>
                </button>
                <button type="button" class="film-step" id="film-next" aria-label="Next project">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m6.5 3 6 6-6 6"/></svg>
                </button>
                <p class="film-count" id="film-count" aria-hidden="true"></p>
                <a href="{{ route('projects') }}" class="text-link film-all">All projects</a>
            </div>
        </div>
    </div>
</section>

<section class="block" id="experience">
    <div class="wrap">
        <h2 class="block-title">Work history</h2>
        <ol class="ledger">
            @foreach ($portfolio_data['experience'] as $job)
                <li class="ledger-row">
                    <p class="ledger-when">{{ $job['duration'] }}</p>
                    <div class="ledger-what">
                        <h3>{{ $job['role'] }}</h3>
                        <p class="ledger-org">{{ $job['company'] }}</p>
                        <p>{{ $job['description'] }}</p>
                    </div>
                </li>
            @endforeach
        </ol>
    </div>
</section>

<section class="block block-tight" id="skills">
    <div class="wrap">
        <h2 class="block-title">Skills</h2>
        <div class="toolkit">
            @foreach ($portfolio_data['skills'] as $group)
                <section class="toolkit-group">
                    <h3>{{ $group['category'] }}</h3>
                    <ul>
                        @foreach ($group['items'] as $item)
                            <li>{{ $item }}</li>
                        @endforeach
                    </ul>
                </section>
            @endforeach
        </div>
    </div>
</section>

<section class="contact" id="contact">
    <div class="wrap contact-grid">
        <div>
            <h2>Let's talk about your infrastructure.</h2>
            <p>I'm open to new roles and contract work. Email is the quickest way to reach me.</p>
        </div>
        <div class="contact-actions">
            <a href="mailto:{{ $info['email'] }}" class="contact-mail" id="contact-mail">{{ $info['email'] }}</a>
            <button type="button" class="btn btn-tape" id="copy-email" data-email="{{ $info['email'] }}">Copy email</button>
            <span class="visually-hidden" role="status" id="copy-status"></span>
        </div>
    </div>
</section>
@endsection
