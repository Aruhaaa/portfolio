import { cache } from 'react';
import { sql, ensureSchema } from './db';

export type Info = { name: string; title: string; bio: string; email: string; github: string; linkedin: string };
export type Skill = { id: number; category: string; items: string[] };
export type Experience = { id: number; role: string; company: string; duration: string; description: string };
export type Project = {
  id: number;
  title: string;
  description: string;
  tech_stack: string[];
  link: string | null;
  repo_link: string | null;
  featured: boolean;
  is_hero: boolean;
  image: string | null;
};
export type Portfolio = { info: Info; hasInfo: boolean; skills: Skill[]; experiences: Experience[]; projects: Project[] };

// Shown until the first details are saved in the admin, so a brand-new database still gives a working page
// (and a way to reach the sign-in link in the footer).
export const EMPTY_INFO: Info = {
  name: 'Your Name',
  title: 'Your title',
  bio: 'This site has no content yet. Use the admin link in the footer to sign in and add your details.',
  email: 'you@example.com',
  github: '',
  linkedin: '',
};

/** Everything the public pages show. Runs the five queries at the same time, once per request. */
export const getPortfolio = cache(async (): Promise<Portfolio> => {
  await ensureSchema();
  const [infoRows, skills, experiences, projectRows, imageRows] = await Promise.all([
    sql<Partial<Info>[]>`select name, title, bio, email, github, linkedin from personal_info where id = 1`,
    sql<Skill[]>`select id, category, items from skills order by sort_order, id`,
    sql<Experience[]>`select id, role, company, duration, description from experiences order by sort_order, id`,
    sql<Omit<Project, 'image'>[]>`
      select id, title, description, tech_stack, link, repo_link, featured, is_hero
      from projects order by sort_order, id`,
    sql<{ project_id: number; hash: string }[]>`select project_id, hash from project_images`,
  ]);

  const hashes = new Map(imageRows.map((r) => [r.project_id, r.hash]));
  const row = infoRows[0];
  const info: Info = row
    ? {
        name: row.name ?? EMPTY_INFO.name,
        title: row.title ?? EMPTY_INFO.title,
        bio: row.bio ?? EMPTY_INFO.bio,
        email: row.email ?? EMPTY_INFO.email,
        github: row.github ?? '',
        linkedin: row.linkedin ?? '',
      }
    : EMPTY_INFO;

  return {
    info,
    hasInfo: Boolean(row),
    skills,
    experiences,
    projects: projectRows.map((p) => ({
      ...p,
      // The short hash changes whenever the picture is replaced, so browsers never show an old copy
      image: hashes.has(p.id) ? `/media/projects/${p.id}?v=${hashes.get(p.id)!.slice(0, 12)}` : null,
    })),
  };
});
