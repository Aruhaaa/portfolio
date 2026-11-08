<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\PersonalInfo;
use App\Models\Skill;
use App\Models\Experience;
use App\Models\Project;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        User::updateOrCreate(
            ['email' => 'admin@portfolio.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password123'),
            ]
        );

        // Personal Info
        PersonalInfo::updateOrCreate(['id' => 1], [
            'name' => 'Alex Morgan',
            'title' => 'Senior IT Systems Engineer',
            'bio' => 'Passionate about building robust infrastructure, optimizing cloud deployments, and automating complex workflows. With over 8 years of experience in IT operations and software development, I bridge the gap between development and operations.',
            'email' => 'alex.morgan@example.com',
            'github' => 'https://github.com/',
            'linkedin' => 'https://linkedin.com/'
        ]);

        // Skills
        $skills = [
            ['category' => 'Cloud & Infrastructure', 'items' => ['AWS', 'Docker', 'Kubernetes', 'Terraform'], 'sort_order' => 1],
            ['category' => 'Backend Development', 'items' => ['PHP', 'Python', 'Node.js', 'PostgreSQL'], 'sort_order' => 2],
            ['category' => 'Frontend Development', 'items' => ['JavaScript', 'React', 'HTML5/CSS3'], 'sort_order' => 3],
            ['category' => 'DevOps & CI/CD', 'items' => ['GitHub Actions', 'Jenkins', 'Linux Administration', 'Bash Scripting'], 'sort_order' => 4],
        ];
        foreach ($skills as $skill) {
            Skill::updateOrCreate(['category' => $skill['category']], $skill);
        }

        // Experience
        $experiences = [
            [
                'role' => 'Freelancer Software/Website Developer',
                'company' => 'Self-employed',
                'duration' => '2026 - Present',
                'description' => 'Designing and building websites and software for clients, from first sketch to launch.',
                'sort_order' => 1,
            ],
        ];
        foreach ($experiences as $exp) {
            Experience::updateOrCreate(['role' => $exp['role'], 'company' => $exp['company']], $exp);
        }
        // Keep only the entries above
        Experience::whereNotIn('role', array_column($experiences, 'role'))->delete();

        // Projects
        $projects = [
            [
                'title' => 'Cloud Migration Initiative',
                'description' => 'Successfully migrated legacy on-premise servers to AWS EC2 and RDS, improving uptime to 99.99%.',
                'tech_stack' => ['AWS EC2', 'AWS RDS', 'Terraform', 'Linux'],
                'link' => '#', 'featured' => true, 'sort_order' => 1,
                'thumbnail' => 'https://image.thum.io/get/width/600/https://aws.amazon.com/',
            ],
            [
                'title' => 'Automated Deployment Pipeline',
                'description' => 'Built a robust CI/CD pipeline using GitHub Actions and Docker to streamline application deployments.',
                'tech_stack' => ['Docker', 'GitHub Actions', 'Bash'],
                'link' => '#', 'featured' => true, 'sort_order' => 2,
                'thumbnail' => 'https://image.thum.io/get/width/600/https://github.com/features/actions',
            ],
            [
                'title' => 'Internal Monitoring Dashboard',
                'description' => 'Developed a real-time monitoring dashboard for IT infrastructure using PHP and WebSockets.',
                'tech_stack' => ['PHP', 'JavaScript', 'MySQL'],
                'link' => '#', 'featured' => true, 'sort_order' => 3,
                'thumbnail' => 'https://image.thum.io/get/width/600/https://grafana.com/',
            ],
            [
                'title' => 'Network Security Audit Tool',
                'description' => 'Created an automated vulnerability scanning tool that checks network configurations and generates compliance reports.',
                'tech_stack' => ['Python', 'Nmap', 'PostgreSQL'],
                'link' => '#', 'featured' => false, 'sort_order' => 4,
                'thumbnail' => 'https://image.thum.io/get/width/600/https://nmap.org/',
            ],
            [
                'title' => 'Kubernetes Cluster Manager',
                'description' => 'Designed a web-based K8s cluster management interface for deploying, scaling, and monitoring containerized apps.',
                'tech_stack' => ['Kubernetes', 'React', 'Go', 'Helm'],
                'link' => '#', 'featured' => true, 'sort_order' => 5,
                'thumbnail' => 'https://image.thum.io/get/width/600/https://kubernetes.io/',
            ],
            [
                'title' => 'Log Aggregation Platform',
                'description' => 'Built a centralized logging system collecting data from 200+ servers with real-time search and alerting.',
                'tech_stack' => ['Elasticsearch', 'Logstash', 'Kibana', 'Docker'],
                'link' => '#', 'featured' => true, 'sort_order' => 6,
                'thumbnail' => 'https://image.thum.io/get/width/600/https://www.elastic.co/',
            ],
            [
                'title' => 'Inventory Management API',
                'description' => 'Developed a RESTful API for tracking hardware and software assets across multiple office locations.',
                'tech_stack' => ['Laravel', 'MySQL', 'Redis'],
                'link' => '#', 'featured' => true, 'sort_order' => 7,
                'thumbnail' => 'https://image.thum.io/get/width/600/https://laravel.com/',
            ],
            [
                'title' => 'Disaster Recovery Automation',
                'description' => 'Implemented automated backup and failover procedures reducing recovery time from hours to minutes.',
                'tech_stack' => ['AWS', 'Terraform', 'Bash', 'CloudWatch'],
                'link' => '#', 'featured' => true, 'sort_order' => 8,
                'thumbnail' => 'https://image.thum.io/get/width/600/https://www.terraform.io/',
            ],
        ];
        foreach ($projects as $project) {
            Project::updateOrCreate(['title' => $project['title']], $project);
        }
    }
}
