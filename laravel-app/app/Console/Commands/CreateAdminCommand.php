<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

class CreateAdminCommand extends Command
{
    protected $signature = 'portfolio:admin {email? : The email to sign in with} {--name=Admin : Display name}';

    protected $description = 'Create or update the admin login. It asks for the password, so the password never ends up in a file or in shell history.';

    private const OLD_DEFAULT = 'admin@portfolio.com';

    public function handle(): int
    {
        $email = $this->argument('email') ?: text(
            label: 'Admin email',
            required: true,
            validate: fn (string $v) => filter_var($v, FILTER_VALIDATE_EMAIL) ? null : 'Enter a valid email address.'
        );

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('That is not a valid email address.');
            return self::FAILURE;
        }

        $password = password(
            label: 'Password (at least 12 characters)',
            required: true,
            validate: fn (string $v) => strlen($v) >= 12 ? null : 'Use at least 12 characters.'
        );
        $repeat = password(label: 'Repeat the password', required: true);

        if ($password !== $repeat) {
            $this->error('The passwords do not match. Nothing was changed.');
            return self::FAILURE;
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => (string) $this->option('name'), 'password' => Hash::make($password)]
        );
        $this->info("Admin login saved for {$user->email}.");

        // The old seeder created a login with a well-known password. Offer to remove it.
        if ($email !== self::OLD_DEFAULT && User::where('email', self::OLD_DEFAULT)->exists()) {
            if (confirm('The old built-in login ' . self::OLD_DEFAULT . ' still exists (its password is public). Delete it?', default: true)) {
                User::where('email', self::OLD_DEFAULT)->delete();
                $this->info('Deleted ' . self::OLD_DEFAULT . '.');
            }
        }

        return self::SUCCESS;
    }
}
