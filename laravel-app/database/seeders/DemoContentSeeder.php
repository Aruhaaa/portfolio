<?php

namespace Database\Seeders;

use App\Models\Experience;
use App\Models\PersonalInfo;
use App\Models\Project;
use App\Models\Skill;
use Illuminate\Database\Seeder;

/**
 * Placeholder content for a brand-new LOCAL database, so the site has something to show.
 * Run it on purpose:  php artisan db:seed --class=DemoContentSeeder
 *
 * It refuses to run when any content exists, so it can never overwrite real details.
 */
class DemoContentSeeder extends Seeder
{
    public function run(): void
    {
        if (PersonalInfo::query()->exists() || Project::query()->exists() || Skill::query()->exists() || Experience::query()->exists()) {
            $this->command?->warn('This database already has content, so the demo content was NOT added.');
            return;
        }

        PersonalInfo::create([
            'id' => 1,
            'name' => 'Alex Morgan',
            'title' => 'Senior IT Systems Engineer',
            'bio' => 'Passionate about building robust infrastructure, optimizing cloud deployments, and automating complex workflows. With over 8 years of experience in IT operations and software development, I bridge the gap between development and operations.',
            'email' => 'alex.morgan@example.com',
            'github' => 'https://github.com/',
            'linkedin' => 'https://linkedin.com/',
        ]);

        $skills = [
            ['category' => 'Cloud & Infrastructure', 'items' => ['AWS', 'Docker', 'Kubernetes', 'Terraform'], 'sort_order' => 1],
            ['category' => 'Backend Development', 'items' => ['PHP', 'Python', 'Node.js', 'PostgreSQL'], 'sort_order' => 2],
            ['category' => 'Frontend Development', 'items' => ['JavaScript', 'React', 'HTML5/CSS3'], 'sort_order' => 3],
            ['category' => 'DevOps & CI/CD', 'items' => ['GitHub Actions', 'Jenkins', 'Linux Administration', 'Bash Scripting'], 'sort_order' => 4],
        ];
        foreach ($skills as $skill) {
            Skill::create($skill);
        }

        Experience::create([
            'role' => 'Freelancer Software/Website Developer',
            'company' => 'Self-employed',
            'duration' => '2026 - Present',
            'description' => 'Designing and building websites and software for clients, from first sketch to launch.',
            'sort_order' => 1,
        ]);

        $projects = [
            ['title' => 'Cloud Migration Initiative', 'description' => 'Successfully migrated legacy on-premise servers to AWS EC2 and RDS, improving uptime to 99.99%.', 'tech_stack' => ['AWS EC2', 'AWS RDS', 'Terraform', 'Linux'], 'featured' => true],
            ['title' => 'Automated Deployment Pipeline', 'description' => 'Built a robust CI/CD pipeline using GitHub Actions and Docker to streamline application deployments.', 'tech_stack' => ['Docker', 'GitHub Actions', 'Bash'], 'featured' => true],
            ['title' => 'Internal Monitoring Dashboard', 'description' => 'Developed a real-time monitoring dashboard for IT infrastructure using PHP and WebSockets.', 'tech_stack' => ['PHP', 'JavaScript', 'MySQL'], 'featured' => true],
            ['title' => 'Network Security Audit Tool', 'description' => 'Created an automated vulnerability scanning tool that checks network configurations and generates compliance reports.', 'tech_stack' => ['Python', 'Nmap', 'PostgreSQL'], 'featured' => false],
            ['title' => 'Kubernetes Cluster Manager', 'description' => 'Designed a web-based K8s cluster management interface for deploying, scaling, and monitoring containerized apps.', 'tech_stack' => ['Kubernetes', 'React', 'Go', 'Helm'], 'featured' => true],
            ['title' => 'Log Aggregation Platform', 'description' => 'Built a centralized logging system collecting data from 200+ servers with real-time search and alerting.', 'tech_stack' => ['Elasticsearch', 'Logstash', 'Kibana', 'Docker'], 'featured' => true],
            ['title' => 'Inventory Management API', 'description' => 'Developed a RESTful API for tracking hardware and software assets across multiple office locations.', 'tech_stack' => ['Laravel', 'MySQL', 'Redis'], 'featured' => true],
            ['title' => 'Disaster Recovery Automation', 'description' => 'Implemented automated backup and failover procedures reducing recovery time from hours to minutes.', 'tech_stack' => ['AWS', 'Terraform', 'Bash', 'CloudWatch'], 'featured' => true],
        ];
        foreach ($projects as $i => $project) {
            Project::create($project + ['link' => '#', 'sort_order' => $i + 1]);
        }
    }
}
