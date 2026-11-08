<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLoginTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'a-long-test-password';

    public function test_the_right_password_signs_in_and_a_wrong_one_does_not(): void
    {
        User::factory()->create(['email' => 'me@example.com', 'password' => self::PASSWORD]);

        $this->post(route('admin.login'), ['email' => 'me@example.com', 'password' => 'wrong'])
            ->assertSessionHasErrors('email');
        $this->assertGuest();

        $this->post(route('admin.login'), ['email' => 'me@example.com', 'password' => self::PASSWORD])
            ->assertRedirect(route('admin.dashboard'));
        $this->assertAuthenticated();
    }

    public function test_after_five_wrong_passwords_even_the_right_one_is_refused_for_a_while(): void
    {
        User::factory()->create(['email' => 'me@example.com', 'password' => self::PASSWORD]);

        for ($i = 0; $i < 5; $i++) {
            $this->post(route('admin.login'), ['email' => 'me@example.com', 'password' => 'wrong']);
        }

        $this->post(route('admin.login'), ['email' => 'me@example.com', 'password' => self::PASSWORD])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
        $this->assertStringContainsString('Too many attempts', session('errors')->first('email'));
    }

    public function test_the_admin_area_needs_a_login(): void
    {
        $this->get(route('admin.dashboard'))->assertRedirect('/');
    }
}
