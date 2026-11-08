@php
    $info = $portfolio_data['personal_info'];
    $firstName = explode(' ', $info['name'])[0];
    $home = url('/');
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $info['name'] }}, {{ $info['title'] }}</title>
    <meta name="description" content="{{ \Illuminate\Support\Str::limit($info['bio'], 150) }}">
    <meta name="theme-color" content="#E3E5E1">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ $info['name'] }}, {{ $info['title'] }}">
    <meta property="og:description" content="{{ \Illuminate\Support\Str::limit($info['bio'], 150) }}">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2316181A'/%3E%3Crect x='5' y='7' width='22' height='5' fill='%23F5C400'/%3E%3Crect x='5' y='14' width='22' height='5' fill='%23F2F3EE'/%3E%3Crect x='5' y='21' width='22' height='5' fill='%23F2F3EE'/%3E%3C/svg%3E">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('assets/css/site.css') }}?v={{ filemtime(public_path('assets/css/site.css')) }}">
</head>
<body>
    <a class="skip-link" href="#main">Skip to content</a>

    <header class="site-header" id="site-header">
        <div class="wrap header-row">
            <a href="{{ $home }}" class="wordmark">{{ $info['name'] }}</a>
            <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
            <nav id="site-nav" class="site-nav" aria-label="Main">
                <a href="{{ $home }}#experience" data-spy="experience">Experience</a>
                <a href="{{ $home }}#skills" data-spy="skills">Skills</a>
                <a href="{{ route('projects') }}" @if(request()->routeIs('projects')) aria-current="page" @endif>All projects</a>
                <a href="{{ $home }}#contact" data-spy="contact" class="nav-contact">Contact</a>
            </nav>
        </div>
    </header>

    <main id="main">
        @yield('content')
    </main>

    <footer class="site-footer">
        <div class="wrap footer-row">
            <p>&copy; {{ date('Y') }} {{ $info['name'] }}</p>
            <ul class="footer-links">
                @if(!empty($info['github']))
                    <li><a href="{{ $info['github'] }}" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                @endif
                @if(!empty($info['linkedin']))
                    <li><a href="{{ $info['linkedin'] }}" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                @endif
                <li><button type="button" class="link-button" id="admin-open">@auth Admin menu @else Admin sign in @endauth</button></li>
            </ul>
        </div>
    </footer>

    <dialog id="login-modal" class="admin-dialog" aria-labelledby="admin-dialog-title" @if($errors->any()) data-open-on-load @endif>
        <div class="dialog-body">
            <button id="modal-close" class="dialog-close" type="button" aria-label="Close">&times;</button>
            @guest
                <h2 id="admin-dialog-title">Admin sign in</h2>
                <p class="dialog-note">Sign in to edit the portfolio content.</p>
                @if($errors->any())
                    <p class="dialog-error" role="alert">{{ $errors->first() }}</p>
                @endif
                <form action="{{ route('admin.login') }}" method="POST" class="dialog-form">
                    @csrf
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" autocomplete="username" required>
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" autocomplete="current-password" required>
                    <button type="submit" class="btn btn-solid">Sign in</button>
                </form>
            @else
                <h2 id="admin-dialog-title">Admin menu</h2>
                <p class="dialog-note">You're signed in.</p>
                <div class="dialog-form">
                    <a href="{{ route('admin.dashboard') }}" class="btn btn-solid">Open dashboard</a>
                    <form action="{{ route('admin.logout') }}" method="POST">
                        @csrf
                        <button type="submit" class="btn btn-line">Sign out</button>
                    </form>
                </div>
            @endguest
        </div>
    </dialog>

    <script src="{{ asset('assets/js/film3d.js') }}?v={{ filemtime(public_path('assets/js/film3d.js')) }}" defer></script>
    <script src="{{ asset('assets/js/site.js') }}?v={{ filemtime(public_path('assets/js/site.js')) }}" defer></script>
</body>
</html>
