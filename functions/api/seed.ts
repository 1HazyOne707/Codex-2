export interface Env { Codex_KV: KVNamespace, ADMIN_KEY?: string }

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const text = await env.Codex_KV.get('seed','text');
  return new Response(text ?? JSON.stringify({ nodes:[], links:[], meta:{} }), { headers:{'content-type':'application/json'} });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const isAdmin = (request.headers.get('cookie')||'').includes('codex_admin=1') ||
                  request.headers.get('x-admin-key') === (env.ADMIN_KEY || '');
  if (!isAdmin) return new Response(JSON.stringify({ok:false,reason:'admin-only'}),{status:403,headers:{'content-type':'application/json'}});
  const body = await request.text();
  await env.Codex_KV.put('seed', body);
  return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json'}});
};
