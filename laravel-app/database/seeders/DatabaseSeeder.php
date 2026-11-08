<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Deliberately does nothing. The old version of this seeder overwrote real details with
     * placeholder text and created an admin login with a public password.
     *
     *   Create your admin login:      php artisan portfolio:admin
     *   Demo content (fresh local DB): php artisan db:seed --class=DemoContentSeeder
     */
    public function run(): void
    {
        $this->command?->info('Nothing was changed. Create your admin login with: php artisan portfolio:admin');
    }
}
