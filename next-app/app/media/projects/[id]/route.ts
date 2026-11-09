import { ensureSchema, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// A project's screenshot, read from the database. The address contains a short hash that changes when the
// picture is replaced, so it can be cached for a year by browsers and by Vercel's CDN.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId < 1) return new Response('Not found', { status: 404 });

  await ensureSchema();
  const rows = await sql<{ mime: string; hash: string; data: Buffer }[]>`
    select mime, hash, data from project_images where project_id = ${projectId}`;
  const image = rows[0];
  if (!image) return new Response('Not found', { status: 404 });

  const etag = `"${image.hash}"`;
  const headers = {
    ETag: etag,
    'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  };

  if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  return new Response(new Uint8Array(image.data), { status: 200, headers: { ...headers, 'Content-Type': image.mime } });
}
