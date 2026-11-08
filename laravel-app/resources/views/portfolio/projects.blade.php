@extends('layouts.app')

@section('content')
<section class="page-head">
    <div class="wrap">
        <a href="{{ url('/') }}" class="text-link">Back to home</a>
        <h1>All projects</h1>
        <p>{{ count($portfolio_data['projects']) }} projects across infrastructure, automation and internal tooling.@if(collect($portfolio_data['projects'])->contains(fn ($p) => !empty($p['is_hero']))) Yellow marks the ones I'd start with.@endif</p>
    </div>
</section>

<section class="block block-flush">
    <div class="wrap">
        <ul class="register">
            @forelse ($portfolio_data['projects'] as $project)
                @php $hasLink = !empty($project['link']) && $project['link'] !== '#'; @endphp
                <li class="register-row {{ !empty($project['is_hero']) ? 'is-pinned' : '' }}">
                    <h2>
                        <span class="mark">{{ $project['title'] }}</span>
                        @if(!empty($project['is_hero']))<span class="visually-hidden"> (pinned)</span>@endif
                    </h2>
                    <div class="register-desc">
                        @if(!empty($project['image']))
                            <img class="register-shot" src="{{ $project['image'] }}" alt="Screenshot of {{ $project['title'] }}" loading="lazy">
                        @endif
                        <p>{{ $project['description'] }}</p>
                    </div>
                    <div class="register-meta">
                        @if(!empty($project['tech_stack']))
                            <ul class="stack stack-ink">
                                @foreach ($project['tech_stack'] as $tech)
                                    <li>{{ $tech }}</li>
                                @endforeach
                            </ul>
                        @endif
                        @if($hasLink)
                            <a href="{{ $project['link'] }}" class="text-link" target="_blank" rel="noopener noreferrer">Open live site</a>
                        @endif
                        @if(!empty($project['repo_link']))
                            <a href="{{ $project['repo_link'] }}" class="text-link" target="_blank" rel="noopener noreferrer">View code on GitHub</a>
                        @endif
                    </div>
                </li>
            @empty
                <li class="register-empty">No projects yet. Add one from the admin dashboard.</li>
            @endforelse
        </ul>
    </div>
</section>
@endsection
