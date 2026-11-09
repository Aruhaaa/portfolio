import { clearedCookie, redirect, sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return redirect('/?login=forbidden');
  return redirect('/', clearedCookie());
}
