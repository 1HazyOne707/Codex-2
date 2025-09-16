export const onRequestPost: PagesFunction = async ({ request, env }) => {
  // prefer header; only read body if header missing
  let key = request.headers.get('x-admin-key') || '';
  if (!key) {
    try { key = (await request.text()).trim(); } catch { key = ''; }
  }
  if (!key || key !== (env as any).ADMIN_KEY) {
    return new Response(JSON.stringify({ ok:false }), {
      status: 401,
      headers: { 'content-type':'application/json' }
    });
  }
  const headers = new Headers({ 'content-type':'application/json' });
  headers.append('set-cookie','codex_admin=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure');
  return new Response(JSON.stringify({ ok:true }), { headers });
};
