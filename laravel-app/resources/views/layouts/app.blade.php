<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $portfolio_data['personal_info']['name'] }} - {{ $portfolio_data['personal_info']['title'] }}</title>
    <meta name="description" content="Portfolio of {{ $portfolio_data['personal_info']['name'] }}, {{ $portfolio_data['personal_info']['title'] }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">
</head>
<body>
    <div class="animated-background">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
    </div>
    
    <header id="navbar">
        <div class="container nav-container">
            <a href="#" class="logo">{{ explode(' ', $portfolio_data['personal_info']['name'])[0] }}<span>.</span></a>
            <nav>
                <ul class="nav-links">
                    <li><a href="#about">About</a></li>
                    <li><a href="#skills">Skills</a></li>
                    <li><a href="#experience">Experience</a></li>
                    <li><a href="#projects">Projects</a></li>
                    <li><a href="#contact" class="btn-primary-outline">Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>
    
    <main class="container">
        @yield('content')
    </main>

    <footer>
        <div class="container footer-content glass-panel">
            <div class="social-links">
                @if(!empty($portfolio_data['personal_info']['github']))
                    <a href="{{ $portfolio_data['personal_info']['github'] }}" target="_blank" rel="noopener noreferrer">GitHub</a>
                @endif
                @if(!empty($portfolio_data['personal_info']['linkedin']))
                    <a href="{{ $portfolio_data['personal_info']['linkedin'] }}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                @endif
            </div>
            <p>&copy; {{ date('Y') }} {{ $portfolio_data['personal_info']['name'] }}. Built with Laravel.</p>
        </div>
    </footer>

    <script src="{{ asset('assets/js/script.js') }}"></script>
</body>
</html>
