import { getSession, redirect, sameOrigin } from '@/lib/auth';
import { ensureSchema, handlers, UserError } from '@/lib/actions';

export const dynamic = 'force-dynamic';

// Every admin form posts here: /admin/do/<name>. Only a signed-in admin gets through.
export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  if (!sameOrigin(req)) return new Response('Forbidden', { status: 403 });
  if (!(await getSession())) return redirect('/');

  const { action } = await params;
  const handler = Object.prototype.hasOwnProperty.call(handlers, action) ? handlers[action] : undefined;
  if (!handler) return new Response('Not found', { status: 404 });

  const form = await req.formData();
  const projectId = Number(form.get('id'));
  const back = action === 'project-update' && Number.isInteger(projectId) ? `/admin/projects/${projectId}/edit` : '/admin';

  try {
    await ensureSchema();
    const message = await handler(form);
    return redirect(`/admin?ok=${encodeURIComponent(message)}`);
  } catch (err) {
    if (err instanceof UserError) return redirect(`${back}?err=${encodeURIComponent(err.message)}`);
    console.error(err);
    return redirect(`${back}?err=${encodeURIComponent('Something went wrong. Please try again.')}`);
  }
}
