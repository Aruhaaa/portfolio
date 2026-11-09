import type { Metadata } from 'next';
import SiteShell, { loginMessage } from '@/components/SiteShell';
import { getSession } from '@/lib/auth';
import { getPortfolio } from '@/lib/data';
import { safeUrl } from '@/lib/html';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { info } = await getPortfolio();
  return { title: `All projects | ${info.name}` };
}

export default async function Projects({ searchParams }: { searchParams: Promise<{ login?: string; wait?: string }> }) {
  const [{ info, projects }, session, sp] = await Promise.all([getPortfolio(), getSession(), searchParams]);
  const anyPinned = projects.some((p) => p.is_hero);

  return (
    <SiteShell info={info} signedIn={Boolean(session)} loginError={loginMessage(sp.login, sp.wait)} current="projects">
      <section className="page-head">
        <div className="wrap">
          <a href="/" className="text-link">
            Back to home
          </a>
          <h1>All projects</h1>
          <p>
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}.
            {anyPinned && " Yellow marks the ones I'd start with."}
          </p>
        </div>
      </section>

      <section className="block block-flush">
        <div className="wrap">
          <ul className="register">
            {projects.length === 0 && (
              <li className="register-empty">No projects yet. Add one from the admin dashboard.</li>
            )}
            {projects.map((p) => {
              const live = safeUrl(p.link);
              const repo = safeUrl(p.repo_link);
              return (
                <li className={`register-row${p.is_hero ? ' is-pinned' : ''}`} key={p.id}>
                  <h2>
                    <span className="mark">{p.title}</span>
                    {p.is_hero && <span className="visually-hidden"> (pinned)</span>}
                  </h2>
                  <div className="register-desc">
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="register-shot" src={p.image} alt={`Screenshot of ${p.title}`} loading="lazy" />
                    )}
                    <p>{p.description}</p>
                  </div>
                  <div className="register-meta">
                    {p.tech_stack.length > 0 && (
                      <ul className="stack stack-ink">
                        {p.tech_stack.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    )}
                    {live && (
                      <a href={live} className="text-link" target="_blank" rel="noopener noreferrer">
                        Open live site
                      </a>
                    )}
                    {repo && (
                      <a href={repo} className="text-link" target="_blank" rel="noopener noreferrer">
                        View code on GitHub
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
