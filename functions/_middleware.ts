export const onRequest: PagesFunction = async ({ request, env, next }) => {
  const url = new URL(request.url);
  const isProtected = url.pathname.startsWith('/garden') || url.pathname.startsWith('/api');

  if (!isProtected) return next();

  const adminKey = (env as any).ADMIN_KEY as string;
  const cookie = request.headers.get('cookie') || '';
  const hasCookie = /(?:^|;\s*)codex_admin=1(?:;|$)/.test(cookie);
  const headerKey = request.headers.get('x-admin-key') || '';

  const ok = !!adminKey && (hasCookie || headerKey === adminKey);

  // Allow GET /api/seed for builders only; others get 403
  if (!ok) {
    return new Response('forbidden', { status: 403, headers: { 'content-type': 'text/plain' } });
  }
  return next();
};
