<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PortfolioPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_brand_new_empty_database_still_gives_working_pages(): void
    {
        // First deploy on a fresh database: no details saved yet. The page must still load,
        // because the admin sign-in is reached from it.
        $this->get('/')->assertOk()->assertSee('Your Name')->assertSee('Admin sign in');
        $this->get('/projects')->assertOk();
    }

    public function test_links_use_https_when_the_request_came_through_a_proxy(): void
    {
        $this->withHeaders([
            'X-Forwarded-Proto' => 'https',
            'X-Forwarded-Host' => 'portfolio.example.test',
        ])->get('/')
            ->assertOk()
            ->assertSee('https://portfolio.example.test/assets/css/site.css', false);
    }
}
