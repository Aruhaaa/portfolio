import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getPortfolio } from '@/lib/data';

export const dynamic = 'force-dynamic';

const small = { padding: '0.3rem 0.6rem', fontSize: '0.8rem' } as const;

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  if (!(await getSession())) redirect('/');
  const [{ info, skills, experiences, projects }, sp] = await Promise.all([getPortfolio(), searchParams]);

  return (
    <>
      <header className="admin-header">
        <div className="admin-header-inner">
          <h1>
            Admin <span className="highlight">Dashboard</span>
          </h1>
          <div className="admin-header-actions">
            <a href="/" className="btn-secondary">
              Back to Site
            </a>
            <form action="/admin/logout" method="POST" style={{ display: 'inline' }}>
              <button type="submit" className="btn-primary-outline">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {sp.ok && <div className="alert-success">{sp.ok.slice(0, 200)}</div>}
      {sp.err && (
        <div className="alert-success alert-error" role="alert">
          {sp.err.slice(0, 200)}
        </div>
      )}

      <section className="admin-section">
        <h2>Personal Info</h2>
        <form action="/admin/do/personal-info" method="POST" className="admin-form glass-panel">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pi-name">Name</label>
              <input type="text" id="pi-name" name="name" defaultValue={info.name} required />
            </div>
            <div className="form-group">
              <label htmlFor="pi-title">Title</label>
              <input type="text" id="pi-title" name="title" defaultValue={info.title} required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="pi-bio">Bio</label>
            <textarea id="pi-bio" name="bio" rows={3} defaultValue={info.bio} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pi-email">Email</label>
              <input type="email" id="pi-email" name="email" defaultValue={info.email} required />
            </div>
            <div className="form-group">
              <label htmlFor="pi-github">GitHub URL</label>
              <input type="text" id="pi-github" name="github" defaultValue={info.github} />
            </div>
            <div className="form-group">
              <label htmlFor="pi-linkedin">LinkedIn URL</label>
              <input type="text" id="pi-linkedin" name="linkedin" defaultValue={info.linkedin} />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Save Changes
          </button>
        </form>
      </section>

      <section className="admin-section">
        <h2>Skills</h2>
        <div className="admin-items">
          {skills.map((skill) => (
            <div className="admin-item glass-panel" key={skill.id}>
              <div>
                <strong>{skill.category}</strong>
                <p className="item-meta">{skill.items.join(', ')}</p>
              </div>
              <form action="/admin/do/skill-delete" method="POST" data-confirm="Delete this skill?">
                <input type="hidden" name="id" value={skill.id} />
                <button type="submit" className="btn-delete" aria-label={`Delete ${skill.category}`}>
                  ×
                </button>
              </form>
            </div>
          ))}
        </div>
        <form action="/admin/do/skill-add" method="POST" className="admin-form glass-panel add-form">
          <h3>Add Skill</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sk-category">Category</label>
              <input type="text" id="sk-category" name="category" placeholder="e.g., Cloud & Infrastructure" required />
            </div>
            <div className="form-group">
              <label htmlFor="sk-items">Skills (comma-separated)</label>
              <input type="text" id="sk-items" name="items" placeholder="e.g., AWS, Docker, Kubernetes" required />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Add Skill
          </button>
        </form>
      </section>

      <section className="admin-section">
        <h2>Experience</h2>
        <div className="admin-items">
          {experiences.map((exp) => (
            <div className="admin-item glass-panel" key={exp.id}>
              <div>
                <strong>{exp.role}</strong> at {exp.company}
                <p className="item-meta">{exp.duration}</p>
              </div>
              <form action="/admin/do/experience-delete" method="POST" data-confirm="Delete this experience?">
                <input type="hidden" name="id" value={exp.id} />
                <button type="submit" className="btn-delete" aria-label={`Delete ${exp.role}`}>
                  ×
                </button>
              </form>
            </div>
          ))}
        </div>
        <form action="/admin/do/experience-add" method="POST" className="admin-form glass-panel add-form">
          <h3>Add Experience</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ex-role">Role</label>
              <input type="text" id="ex-role" name="role" placeholder="e.g., Senior Engineer" required />
            </div>
            <div className="form-group">
              <label htmlFor="ex-company">Company</label>
              <input type="text" id="ex-company" name="company" placeholder="e.g., TechCorp" required />
            </div>
            <div className="form-group">
              <label htmlFor="ex-duration">Duration</label>
              <input type="text" id="ex-duration" name="duration" placeholder="e.g., 2021 - Present" required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="ex-description">Description</label>
            <textarea id="ex-description" name="description" rows={2} placeholder="What did you accomplish?" required />
          </div>
          <button type="submit" className="btn-primary">
            Add Experience
          </button>
        </form>
      </section>

      <section className="admin-section">
        <h2>Projects</h2>
        <div className="admin-items">
          {projects.map((project) => (
            <div className="admin-item glass-panel" key={project.id}>
              <div>
                <strong>{project.title}</strong>
                {project.featured && <span className="featured-badge">Featured</span>}
                <p className="item-meta">{project.tech_stack.join(', ')}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <a href={`/admin/projects/${project.id}/edit`} className="btn-secondary" style={small}>
                  Edit
                </a>
                <form action="/admin/do/project-hero" method="POST">
                  <input type="hidden" name="id" value={project.id} />
                  {project.is_hero ? (
                    <button
                      type="submit"
                      className="btn-primary-outline"
                      style={{ ...small, borderColor: 'var(--accent)', color: 'var(--accent)' }}
                    >
                      Remove Hero
                    </button>
                  ) : (
                    <button type="submit" className="btn-secondary" style={small}>
                      Set as Hero
                    </button>
                  )}
                </form>
                <form action="/admin/do/project-delete" method="POST" data-confirm="Delete this project?">
                  <input type="hidden" name="id" value={project.id} />
                  <button type="submit" className="btn-delete" aria-label={`Delete ${project.title}`}>
                    ×
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
        <form
          action="/admin/do/project-add"
          method="POST"
          encType="multipart/form-data"
          className="admin-form glass-panel add-form"
        >
          <h3>Add Project</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pr-title">Title</label>
              <input type="text" id="pr-title" name="title" placeholder="e.g., Cloud Migration" required />
            </div>
            <div className="form-group">
              <label htmlFor="pr-stack">Tech Stack (comma-separated)</label>
              <input type="text" id="pr-stack" name="tech_stack" placeholder="e.g., AWS, Docker, Terraform" required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="pr-description">Description</label>
            <textarea id="pr-description" name="description" rows={2} placeholder="Describe the project" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pr-link">Live site link</label>
              <input type="url" id="pr-link" name="link" placeholder="e.g., https://my-project.example.com" />
            </div>
            <div className="form-group">
              <label htmlFor="pr-repo">GitHub link</label>
              <input type="url" id="pr-repo" name="repo_link" placeholder="e.g., https://github.com/you/repo" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="pr-shot">Screenshot (JPG, PNG or WebP, up to 3 MB)</label>
            <input type="file" id="pr-shot" name="screenshot" accept="image/png,image/jpeg,image/webp" />
          </div>
          <label className="checkbox-label">
            <input type="checkbox" name="featured" /> Featured Project
          </label>
          <button type="submit" className="btn-primary">
            Add Project
          </button>
        </form>
      </section>
    </>
  );
}
