import { adminConfigured, clientIp, redirect, sameOrigin, sessionCookie, verifyAdmin } from '@/lib/auth';
import { clear, hit, tooManyAttempts } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return redirect('/?login=forbidden');
  if (!adminConfigured()) return redirect('/?login=setup');

  const form = await req.formData();
  const email = String(form.get('email') ?? '').trim().slice(0, 255);
  const password = String(form.get('password') ?? '').slice(0, 200);
  const ip = clientIp(req);

  // Wrong passwords are limited: a few tries per email and address, and a wider limit per address,
  // so a bot cannot just keep changing the email.
  const byEmail = `admin-login:${email.toLowerCase()}|${ip}`;
  const byIp = `admin-login-ip:${ip}`;
  for (const [key, max] of [
    [byEmail, 5],
    [byIp, 20],
  ] as const) {
    const wait = await tooManyAttempts(key, max);
    if (wait) return redirect(`/?login=limited&wait=${wait}`);
  }

  if (await verifyAdmin(email, password)) {
    await clear(byEmail);
    return redirect('/admin', await sessionCookie(email));
  }

  await Promise.all([hit(byEmail), hit(byIp)]);
  return redirect('/?login=invalid');
}
