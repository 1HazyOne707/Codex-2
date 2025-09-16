export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const on = url.searchParams.has('on');
  const headers = new Headers({ 'content-type': 'text/plain' });
  headers.append('set-cookie', `codex_admin=${on?1:''}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${on?60*60*24*30:0}`);
  return new Response(on?'admin on':'admin off', { headers });
};
