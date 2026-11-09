import { sql, ensureSchema } from './db';
import { ImageError, prepareImage } from './images';

/** A mistake the admin can fix (empty field, bad link). Shown on the page instead of an error screen. */
export class UserError extends Error {}

const text = (f: FormData, key: string, max = 5000) => String(f.get(key) ?? '').trim().slice(0, max);

function required(f: FormData, key: string, label: string, max = 255): string {
  const v = text(f, key, max);
  if (!v) throw new UserError(`${label} is required.`);
  return v;
}

const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 40);

function link(f: FormData, key: string): string | null {
  const v = text(f, key, 255);
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol === 'http:' || u.protocol === 'https:') return v;
  } catch {
    // falls through to the error below
  }
  throw new UserError('Links must start with http:// or https://');
}

function idOf(f: FormData): number {
  const n = Number(f.get('id'));
  if (!Number.isInteger(n) || n < 1) throw new UserError('That item no longer exists.');
  return n;
}

function uploaded(f: FormData): File | null {
  const file = f.get('screenshot');
  return file instanceof File && file.size > 0 ? file : null;
}

async function image(file: File) {
  try {
    return await prepareImage(file);
  } catch (err) {
    if (err instanceof ImageError) throw new UserError(err.message);
    throw err;
  }
}

type Handler = (f: FormData) => Promise<string>;

/** Every admin form posts to /admin/do/<name>. Each handler returns the message to show. */
export const handlers: Record<string, Handler> = {
  'personal-info': async (f) => {
    const email = required(f, 'email', 'Email');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new UserError('Enter a valid email address.');
    const name = required(f, 'name', 'Name');
    const title = required(f, 'title', 'Title');
    const bio = required(f, 'bio', 'Bio', 3000);
    const github = text(f, 'github', 255) || null;
    const linkedin = text(f, 'linkedin', 255) || null;
    await sql`
      insert into personal_info (id, name, title, bio, email, github, linkedin)
      values (1, ${name}, ${title}, ${bio}, ${email}, ${github}, ${linkedin})
      on conflict (id) do update set name = excluded.name, title = excluded.title, bio = excluded.bio,
        email = excluded.email, github = excluded.github, linkedin = excluded.linkedin, updated_at = now()`;
    return 'Personal info updated!';
  },

  'skill-add': async (f) => {
    const category = required(f, 'category', 'Category');
    const items = list(text(f, 'items'));
    if (!items.length) throw new UserError('Add at least one skill.');
    await sql`
      insert into skills (category, items, sort_order)
      select ${category}, ${sql.json(items)}, coalesce(max(sort_order), 0) + 1 from skills`;
    return 'Skill added!';
  },

  'skill-delete': async (f) => {
    await sql`delete from skills where id = ${idOf(f)}`;
    return 'Skill deleted!';
  },

  'experience-add': async (f) => {
    const role = required(f, 'role', 'Role');
    const company = required(f, 'company', 'Company');
    const duration = required(f, 'duration', 'Duration');
    const description = required(f, 'description', 'Description');
    await sql`
      insert into experiences (role, company, duration, description, sort_order)
      select ${role}, ${company}, ${duration}, ${description}, coalesce(max(sort_order), 0) + 1 from experiences`;
    return 'Experience added!';
  },

  'experience-delete': async (f) => {
    await sql`delete from experiences where id = ${idOf(f)}`;
    return 'Experience deleted!';
  },

  'project-add': async (f) => {
    const title = required(f, 'title', 'Title');
    const description = required(f, 'description', 'Description');
    const stack = list(text(f, 'tech_stack'));
    if (!stack.length) throw new UserError('Add at least one technology.');
    const live = link(f, 'link');
    const repo = link(f, 'repo_link');
    const featured = f.get('featured') !== null;
    const file = uploaded(f);
    const img = file ? await image(file) : null;

    await sql.begin(async (tx) => {
      const [row] = await tx<{ id: number }[]>`
        insert into projects (title, description, tech_stack, link, repo_link, featured, sort_order)
        select ${title}, ${description}, ${sql.json(stack)}, ${live}, ${repo}, ${featured}, coalesce(max(sort_order), 0) + 1
        from projects returning id`;
      if (img) {
        await tx`insert into project_images (project_id, mime, hash, data) values (${row.id}, ${img.mime}, ${img.hash}, ${img.data})`;
      }
    });
    return 'Project added!';
  },

  'project-update': async (f) => {
    const id = idOf(f);
    const title = required(f, 'title', 'Title');
    const description = required(f, 'description', 'Description');
    const stack = list(text(f, 'tech_stack'));
    if (!stack.length) throw new UserError('Add at least one technology.');
    const live = link(f, 'link');
    const repo = link(f, 'repo_link');
    const featured = f.get('featured') !== null;
    const file = uploaded(f);
    const img = file ? await image(file) : null;
    const remove = f.get('remove_screenshot') !== null;

    await sql.begin(async (tx) => {
      await tx`
        update projects set title = ${title}, description = ${description}, tech_stack = ${sql.json(stack)},
          link = ${live}, repo_link = ${repo}, featured = ${featured} where id = ${id}`;
      if (img) {
        await tx`
          insert into project_images (project_id, mime, hash, data) values (${id}, ${img.mime}, ${img.hash}, ${img.data})
          on conflict (project_id) do update set mime = excluded.mime, hash = excluded.hash, data = excluded.data, updated_at = now()`;
      } else if (remove) {
        await tx`delete from project_images where project_id = ${id}`;
      }
    });
    return 'Project updated!';
  },

  'project-delete': async (f) => {
    await sql`delete from projects where id = ${idOf(f)}`; // the screenshot goes with it
    return 'Project deleted!';
  },

  // The hero projects (up to 3) are the ones the film opens on and marks in yellow
  'project-hero': async (f) => {
    const id = idOf(f);
    const [row] = await sql<{ is_hero: boolean }[]>`select is_hero from projects where id = ${id}`;
    if (!row) throw new UserError('That project no longer exists.');
    if (!row.is_hero) {
      const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from projects where is_hero`;
      if (n >= 3) throw new UserError('You can only select up to 3 hero projects.');
      await sql`update projects set is_hero = true where id = ${id}`;
      return 'Added to hero projects!';
    }
    await sql`update projects set is_hero = false where id = ${id}`;
    return 'Removed from hero projects.';
  },
};

export { ensureSchema };
