// Loads portfolio content from a JSON file into an EMPTY database (it refuses if there is already content).
//   npm run import -- path/to/export.json
// Reads DATABASE_URL from .env.local, or from the environment.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ensureSchema, sql } from '../lib/db';

type Img = { mime: string; base64: string };
type Dump = {
  personal_info: { name: string; title: string; bio: string; email: string; github?: string | null; linkedin?: string | null } | null;
  skills: { category: string; items: string[]; sort_order: number }[];
  experiences: { role: string; company: string; duration: string; description: string; sort_order: number }[];
  projects: {
    title: string;
    description: string;
    tech_stack: string[];
    link: string | null;
    repo_link: string | null;
    featured: boolean;
    is_hero: boolean;
    sort_order: number;
    image: Img | null;
  }[];
};

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: npm run import -- path/to/export.json');
  const dump: Dump = JSON.parse(readFileSync(file, 'utf8'));

  await ensureSchema();
  const [{ n }] = await sql<{ n: number }[]>`
    select ((select count(*) from personal_info) + (select count(*) from skills) +
            (select count(*) from experiences) + (select count(*) from projects))::int as n`;
  if (n > 0) throw new Error('The database already has content. Import only works on an empty database.');

  await sql.begin(async (tx) => {
    const p = dump.personal_info;
    if (p) {
      await tx`insert into personal_info (id, name, title, bio, email, github, linkedin)
               values (1, ${p.name}, ${p.title}, ${p.bio}, ${p.email}, ${p.github || null}, ${p.linkedin || null})`;
    }
    for (const s of dump.skills) {
      await tx`insert into skills (category, items, sort_order) values (${s.category}, ${sql.json(s.items)}, ${s.sort_order})`;
    }
    for (const e of dump.experiences) {
      await tx`insert into experiences (role, company, duration, description, sort_order)
               values (${e.role}, ${e.company}, ${e.duration}, ${e.description}, ${e.sort_order})`;
    }
    for (const pr of dump.projects) {
      const [row] = await tx<{ id: number }[]>`
        insert into projects (title, description, tech_stack, link, repo_link, featured, is_hero, sort_order)
        values (${pr.title}, ${pr.description}, ${sql.json(pr.tech_stack)}, ${pr.link}, ${pr.repo_link},
                ${pr.featured}, ${pr.is_hero}, ${pr.sort_order})
        returning id`;
      if (pr.image) {
        const data = Buffer.from(pr.image.base64, 'base64');
        const hash = createHash('sha1').update(data).digest('hex');
        await tx`insert into project_images (project_id, mime, hash, data) values (${row.id}, ${pr.image.mime}, ${hash}, ${data})`;
      }
    }
  });

  console.log(
    `Imported ${dump.personal_info ? 'personal info, ' : ''}${dump.skills.length} skills, ` +
      `${dump.experiences.length} experiences, ${dump.projects.length} projects.`,
  );
  await sql.end();
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  await sql.end({ timeout: 1 }).catch(() => {});
  process.exit(1);
});
