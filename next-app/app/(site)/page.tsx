import type { Metadata } from 'next';
import SiteShell, { loginMessage } from '@/components/SiteShell';
import { getSession } from '@/lib/auth';
import { getPortfolio } from '@/lib/data';
import { filmHtml } from '@/lib/film';

export const dynamic = 'force-dynamic';

const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2316181A'/%3E%3Crect x='5' y='7' width='22' height='5' fill='%23F5C400'/%3E%3Crect x='5' y='14' width='22' height='5' fill='%23F2F3EE'/%3E%3Crect x='5' y='21' width='22' height='5' fill='%23F2F3EE'/%3E%3C/svg%3E";

export async function generateMetadata(): Promise<Metadata> {
  const { info } = await getPortfolio();
  const title = `${info.name}, ${info.title}`;
  const description = info.bio.length > 150 ? `${info.bio.slice(0, 147)}...` : info.bio;
  return { title, description, openGraph: { type: 'website', title, description }, icons: { icon: ICON } };
}

export default async function Home({ searchParams }: { searchParams: Promise<{ login?: string; wait?: string }> }) {
  const [{ info, skills, experiences, projects }, session, sp] = await Promise.all([
    getPortfolio(),
    getSession(),
    searchParams,
  ]);

  const parts = info.name.split(' ');
  const firstName = parts.shift() ?? '';
  const surname = parts.join(' ');

  const featured = projects.filter((p) => p.featured || p.is_hero);
  const film = (featured.length ? featured : projects).slice(0, 12);
  const start = Math.max(0, film.findIndex((p) => p.is_hero));

  return (
    <SiteShell info={info} signedIn={Boolean(session)} loginError={loginMessage(sp.login, sp.wait)}>
      <section className="hero" id="about">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1 className="hero-name">
              <span>{firstName}</span>
              {surname && <span>{surname}</span>}
            </h1>
            <p className="hero-title">{info.title}</p>
            <p className="hero-bio">{info.bio}</p>
            <p className="availability">
              <span className="led" aria-hidden="true"></span>Open to new roles and contract work
            </p>
            <div className="hero-actions">
              <a href={`mailto:${info.email}`} className="btn btn-solid">
                Email {firstName}
              </a>
              <a href="#experience" className="text-link">
                Read the work history
              </a>
            </div>
          </div>

          {/* The film strip: site.js builds the 3D ribbon from this markup (see lib/film.ts) */}
          <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: filmHtml(film, start) }} />
        </div>
      </section>

      <section className="block" id="experience">
        <div className="wrap">
          <h2 className="block-title">Work history</h2>
          <ol className="ledger">
            {experiences.map((job) => (
              <li className="ledger-row" key={job.id}>
                <p className="ledger-when">{job.duration}</p>
                <div className="ledger-what">
                  <h3>{job.role}</h3>
                  <p className="ledger-org">{job.company}</p>
                  <p>{job.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="block block-tight" id="skills">
        <div className="wrap">
          <h2 className="block-title">Skills</h2>
          <div className="toolkit">
            {skills.map((group) => (
              <section className="toolkit-group" key={group.id}>
                <h3>{group.category}</h3>
                <ul>
                  {group.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="wrap contact-grid">
          <div>
            <h2>Let&apos;s talk about your project.</h2>
            <p>I&apos;m open to new roles and contract work. Email is the quickest way to reach me.</p>
          </div>
          <div className="contact-actions">
            <a href={`mailto:${info.email}`} className="contact-mail" id="contact-mail">
              {info.email}
            </a>
            <button type="button" className="btn btn-tape" id="copy-email" data-email={info.email}>
              Copy email
            </button>
            <span className="visually-hidden" role="status" id="copy-status"></span>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
