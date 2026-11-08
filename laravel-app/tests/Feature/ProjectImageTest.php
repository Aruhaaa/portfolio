<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ProjectImageTest extends TestCase
{
    use RefreshDatabase;

    private function fields(array $extra = []): array
    {
        return array_merge([
            'title' => 'Barber booking',
            'description' => 'Bookings for a barbershop.',
            'tech_stack' => 'Laravel, MySQL',
            'featured' => 'on',
        ], $extra);
    }

    private function project(): Project
    {
        return Project::create([
            'title' => 'Barber booking',
            'description' => 'Bookings for a barbershop.',
            'tech_stack' => ['Laravel'],
            'featured' => true,
        ]);
    }

    public function test_an_uploaded_screenshot_is_stored_in_the_database_and_scaled_down(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('admin.projects.store'), $this->fields([
                'screenshot' => UploadedFile::fake()->image('shot.png', 2400, 1500),
            ]))
            ->assertRedirect();

        $project = Project::firstOrFail();
        $image = ProjectImage::where('project_id', $project->id)->firstOrFail();

        // Wide pictures are scaled down, and re-encoded as WebP when this PHP can write WebP
        $this->assertSame(function_exists('imagewebp') ? 'image/webp' : 'image/png', $image->mime);
        $this->assertLessThanOrEqual(ProjectImage::MAX_WIDTH, getimagesizefromstring($image->bytes())[0]);
        $this->assertNull($project->thumbnail, 'nothing is written to a folder any more');
    }

    public function test_the_media_route_serves_the_picture_cacheable_and_without_cookies(): void
    {
        $project = $this->project();
        ProjectImage::storeFor($project, UploadedFile::fake()->image('a.png', 800, 500));

        $response = $this->get(route('projects.image', $project))
            ->assertOk()
            ->assertHeader('Content-Type', ProjectImage::firstOrFail()->mime);

        $this->assertStringContainsString('immutable', $response->headers->get('Cache-Control'));
        $this->assertFalse($response->headers->has('Set-Cookie'), 'a cookie would stop CDNs from caching the picture');

        $this->withHeaders(['If-None-Match' => $response->headers->get('ETag')])
            ->get(route('projects.image', $project))
            ->assertStatus(304);
    }

    public function test_a_project_without_a_picture_gives_404(): void
    {
        $this->get('/media/projects/999')->assertNotFound();
    }

    public function test_the_home_page_points_at_the_media_route(): void
    {
        $project = $this->project();
        ProjectImage::storeFor($project, UploadedFile::fake()->image('a.png', 800, 500));

        $this->get('/')->assertOk()->assertSee('/media/projects/' . $project->id . '?v=', false);
    }

    public function test_replacing_removing_and_deleting_keep_the_table_tidy(): void
    {
        $admin = User::factory()->create();
        $project = $this->project();
        ProjectImage::storeFor($project, UploadedFile::fake()->image('a.png', 800, 500));
        $firstHash = ProjectImage::firstOrFail()->hash;

        $this->actingAs($admin)->put(route('admin.projects.update', $project), $this->fields([
            'screenshot' => UploadedFile::fake()->image('b.png', 640, 400),
        ]))->assertRedirect();
        $this->assertSame(1, ProjectImage::count());
        $this->assertNotSame($firstHash, ProjectImage::firstOrFail()->hash);

        $this->actingAs($admin)->put(route('admin.projects.update', $project), $this->fields([
            'remove_screenshot' => 'on',
        ]))->assertRedirect();
        $this->assertSame(0, ProjectImage::count());

        ProjectImage::storeFor($project, UploadedFile::fake()->image('c.png', 700, 400));
        $this->actingAs($admin)->delete(route('admin.projects.delete', $project))->assertRedirect();
        $this->assertSame(0, ProjectImage::count());
        $this->assertSame(0, Project::count());
    }

    public function test_only_pictures_are_accepted(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('admin.projects.store'), $this->fields([
                'screenshot' => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf'),
            ]))
            ->assertSessionHasErrors('screenshot');

        $this->assertSame(0, ProjectImage::count());
    }
}
