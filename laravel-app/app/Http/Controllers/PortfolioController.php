<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PortfolioController extends Controller
{
    public function index()
    {
        $portfolio_data = [
            'personal_info' => [
                'name' => 'Alex Morgan',
                'title' => 'Senior IT Systems Engineer',
                'bio' => 'Passionate about building robust infrastructure, optimizing cloud deployments, and automating complex workflows. With over 8 years of experience in IT operations and software development, I bridge the gap between development and operations.',
                'email' => 'alex.morgan@example.com',
                'github' => 'https://github.com/',
                'linkedin' => 'https://linkedin.com/'
            ],
            'skills' => [
                ['category' => 'Cloud & Infrastructure', 'items' => ['AWS', 'Docker', 'Kubernetes', 'Terraform']],
                ['category' => 'Backend Development', 'items' => ['PHP', 'Python', 'Node.js', 'PostgreSQL']],
                ['category' => 'Frontend Development', 'items' => ['JavaScript', 'React', 'HTML5/CSS3']],
                ['category' => 'DevOps & CI/CD', 'items' => ['GitHub Actions', 'Jenkins', 'Linux Administration', 'Bash Scripting']]
            ],
            'experience' => [
                [
                    'role' => 'Senior Systems Engineer',
                    'company' => 'TechCorp Solutions',
                    'duration' => '2021 - Present',
                    'description' => 'Architected and maintained highly available AWS infrastructure. Implemented CI/CD pipelines reducing deployment time by 40%.'
                ],
                [
                    'role' => 'IT Operations Analyst',
                    'company' => 'Global Systems Inc.',
                    'duration' => '2017 - 2021',
                    'description' => 'Managed internal corporate networks, deployed virtualization solutions, and provided tier-3 technical support for enterprise applications.'
                ]
            ],
            'projects' => [
                [
                    'title' => 'Cloud Migration Initiative',
                    'description' => 'Successfully migrated legacy on-premise servers to AWS EC2 and RDS, improving uptime to 99.99%.',
                    'tech_stack' => ['AWS EC2', 'AWS RDS', 'Terraform', 'Linux'],
                    'link' => '#'
                ],
                [
                    'title' => 'Automated Deployment Pipeline',
                    'description' => 'Built a robust CI/CD pipeline using GitHub Actions and Docker to streamline application deployments.',
                    'tech_stack' => ['Docker', 'GitHub Actions', 'Bash'],
                    'link' => '#'
                ],
                [
                    'title' => 'Internal Monitoring Dashboard',
                    'description' => 'Developed a real-time monitoring dashboard for IT infrastructure using PHP and WebSockets.',
                    'tech_stack' => ['PHP', 'JavaScript', 'MySQL'],
                    'link' => '#'
                ]
            ]
        ];

        return view('portfolio.index', compact('portfolio_data'));
    }
}
