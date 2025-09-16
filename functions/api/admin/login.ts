export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const key = (await request.text()).trim() || request.headers.get('x-admin-key') || '';
  if (!key || key !== (env as any).ADMIN_KEY) {
    return new Response(JSON.stringify({ ok:false }), {
      status: 401,
      headers: { 'content-type':'application/json' }
    });
  }
  const headers = new Headers({ 'content-type':'application/json' });
  headers.append('set-cookie', 'codex_admin=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure');
  return new Response(JSON.stringify({ ok:true }), { headers });
};
