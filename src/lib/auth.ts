import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_COOKIE_NAME = 'onlyweb_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type AdminSessionPayload = {
  email: string;
  exp: number;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET ?? 'dev-onlyweb-session-secret';
}

function shouldUseSecureCookie() {
  const appUrl = process.env.APP_URL;
  if (appUrl) return appUrl.startsWith('https://');
  return process.env.NODE_ENV === 'production';
}

export async function verifyAdminLogin(email: string, password: string) {
  const { verifyAdminPassword } = await import('@/lib/data');
  return verifyAdminPassword(email, password);
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createAdminSessionToken(email: string) {
  const payload: AdminSessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAdminSessionToken(token: string | undefined) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;
  if (!safeEqual(signature, sign(encodedPayload))) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as AdminSessionPayload;
    if (!payload.email || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}

export async function setAdminSession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createAdminSessionToken(email), {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(),
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
