import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getPortfolio } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function EditProject({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  if (!(await getSession())) redirect('/');
  const [{ id }, sp, { projects }] = await Promise.all([params, searchParams, getPortfolio()]);
  const project = projects.find((p) => String(p.id) === id);
  if (!project) notFound();

  return (
    <>
      <header className="admin-header">
        <div className="admin-header-inner">
          <h1>
            Edit <span className="highlight">Project</span>
          </h1>
          <div className="admin-header-actions">
            <a href="/admin" className="btn-secondary">
              Back to dashboard
            </a>
          </div>
        </div>
      </header>

      {sp.err && (
        <div className="alert-success alert-error" role="alert">
          {sp.err.slice(0, 200)}
        </div>
      )}

      <section className="admin-section">
        <form
          action="/admin/do/project-update"
          method="POST"
          encType="multipart/form-data"
          className="admin-form glass-panel"
        >
          <input type="hidden" name="id" value={project.id} />
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input type="text" id="title" name="title" defaultValue={project.title} required />
            </div>
            <div className="form-group">
              <label htmlFor="tech_stack">Tech stack (comma-separated)</label>
              <input type="text" id="tech_stack" name="tech_stack" defaultValue={project.tech_stack.join(', ')} required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={4} defaultValue={project.description} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="link">Live site link</label>
              <input
                type="url"
                id="link"
                name="link"
                defaultValue={project.link && project.link !== '#' ? project.link : ''}
                placeholder="https://my-project.example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="repo_link">GitHub link</label>
              <input
                type="url"
                id="repo_link"
                name="repo_link"
                defaultValue={project.repo_link ?? ''}
                placeholder="https://github.com/you/repo"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="screenshot">
              {project.image ? 'Replace screenshot' : 'Screenshot'} (JPG, PNG or WebP, up to 3 MB)
            </label>
            {project.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.image}
                alt="Current screenshot"
                style={{ display: 'block', maxWidth: 260, marginBottom: '0.75rem', borderRadius: '0.5rem' }}
              />
            )}
            <input type="file" id="screenshot" name="screenshot" accept="image/png,image/jpeg,image/webp" />
          </div>
          {project.image && (
            <label className="checkbox-label">
              <input type="checkbox" name="remove_screenshot" /> Remove current screenshot
            </label>
          )}
          <label className="checkbox-label">
            <input type="checkbox" name="featured" defaultChecked={project.featured} /> Featured project
          </label>
          <button type="submit" className="btn-primary">
            Save changes
          </button>
        </form>
      </section>
    </>
  );
}
