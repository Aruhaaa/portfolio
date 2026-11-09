import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

// One admin: the email and password hash live in environment variables, not in the database.
// The login is a signed cookie, so no database lookup happens on each page.

export const COOKIE = 'admin_session';
const MAX_AGE = 60 * 60 * 24 * 7; // a week

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error('AUTH_SECRET is missing or shorter than 32 characters.');
  return new TextEncoder().encode(s);
}

function secure(): boolean {
  return process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production';
}

export async function sessionCookie(email: string): Promise<string> {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  return `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax${secure() ? '; Secure' : ''}`;
}

export function clearedCookie(): string {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure() ? '; Secure' : ''}`;
}

/** The signed-in admin, or null. Never throws, so the public pages work even before AUTH_SECRET is set. */
export async function getSession(): Promise<{ email: string } | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    return typeof payload.email === 'string' ? { email: payload.email } : null;
  } catch {
    return null;
  }
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH_B64);
}

/** Checks the email and password. The slow password check always runs, so timing does not reveal a right email. */
export async function verifyAdmin(email: string, password: string): Promise<boolean> {
  if (!adminConfigured()) return false;
  const hash = Buffer.from(process.env.ADMIN_PASSWORD_HASH_B64!, 'base64').toString('utf8');
  const passwordOk = await bcrypt.compare(password, hash);
  const emailOk = email.trim().toLowerCase() === process.env.ADMIN_EMAIL!.trim().toLowerCase();
  return passwordOk && emailOk;
}

/** Form posts from other websites are refused (the cookie is also SameSite=Lax). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return (forwarded?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown').trim();
}

/** A redirect after a form post, optionally setting a cookie. */
export function redirect(to: string, setCookie?: string): Response {
  const headers = new Headers({ Location: to });
  if (setCookie) headers.append('Set-Cookie', setCookie);
  return new Response(null, { status: 303, headers });
}
