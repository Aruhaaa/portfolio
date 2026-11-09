import type { ReactNode } from 'react';
import type { Info } from '@/lib/data';
import { safeUrl } from '@/lib/html';

/** The wording for the ?login=... code the sign-in form sends back. Fixed texts, never copied from the address. */
export function loginMessage(code?: string, wait?: string): string | undefined {
  if (code === 'invalid') return 'Invalid credentials.';
  if (code === 'limited') {
    const seconds = /^\d{1,4}$/.test(wait ?? '') ? wait : '60';
    return `Too many attempts. Try again in ${seconds} seconds.`;
  }
  if (code === 'setup') return 'Sign-in is not set up on this site yet (ADMIN_EMAIL and ADMIN_PASSWORD_HASH_B64).';
  if (code === 'forbidden') return 'That request was refused. Open the site and try again.';
  return undefined;
}

export default function SiteShell({
  info,
  signedIn,
  loginError,
  current,
  children,
}: {
  info: Info;
  signedIn: boolean;
  loginError?: string;
  current?: 'projects';
  children: ReactNode;
}) {
  const github = safeUrl(info.github);
  const linkedin = safeUrl(info.linkedin);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header" id="site-header">
        <div className="wrap header-row">
          <a href="/" className="wordmark">
            {info.name}
          </a>
          <button className="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
            Menu
          </button>
          <nav id="site-nav" className="site-nav" aria-label="Main">
            <a href="/#experience" data-spy="experience">
              Experience
            </a>
            <a href="/#skills" data-spy="skills">
              Skills
            </a>
            <a href="/projects" {...(current === 'projects' ? { 'aria-current': 'page' } : {})}>
              All projects
            </a>
            <a href="/#contact" data-spy="contact" className="nav-contact">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main id="main">{children}</main>

      <footer className="site-footer">
        <div className="wrap footer-row">
          <p>
            &copy; {new Date().getFullYear()} {info.name}
          </p>
          <ul className="footer-links">
            {github && (
              <li>
                <a href={github} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
            )}
            {linkedin && (
              <li>
                <a href={linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </li>
            )}
            <li>
              <button type="button" className="link-button" id="admin-open">
                {signedIn ? 'Admin menu' : 'Admin sign in'}
              </button>
            </li>
          </ul>
        </div>
      </footer>

      <dialog
        id="login-modal"
        className="admin-dialog"
        aria-labelledby="admin-dialog-title"
        {...(loginError ? { 'data-open-on-load': '' } : {})}
      >
        <div className="dialog-body">
          <button id="modal-close" className="dialog-close" type="button" aria-label="Close">
            &times;
          </button>
          {signedIn ? (
            <>
              <h2 id="admin-dialog-title">Admin menu</h2>
              <p className="dialog-note">You&apos;re signed in.</p>
              <div className="dialog-form">
                <a href="/admin" className="btn btn-solid">
                  Open dashboard
                </a>
                <form action="/admin/logout" method="POST">
                  <button type="submit" className="btn btn-line">
                    Sign out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <h2 id="admin-dialog-title">Admin sign in</h2>
              <p className="dialog-note">Sign in to edit the portfolio content.</p>
              {loginError && (
                <p className="dialog-error" role="alert">
                  {loginError}
                </p>
              )}
              <form action="/admin/login" method="POST" className="dialog-form">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" autoComplete="username" required />
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" autoComplete="current-password" required />
                <button type="submit" className="btn btn-solid">
                  Sign in
                </button>
              </form>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
