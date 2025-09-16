export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const key = (env as any).ADMIN_KEY as string
  const hdr = (request.headers.get('x-admin-key')||'')
  const cookie = request.headers.get('cookie') || ''
  const ok = (hdr===key) || /codex_admin=1/.test(cookie)
  if (!ok) return new Response('Not found',{status:404})
  const list = JSON.parse((await (env as any).Codex_KV.get('q:built','text')) || '[]')
  return new Response(JSON.stringify({ok:true, size:list.length, items:list.slice(-50)}),{headers:{'content-type':'application/json','cache-control':'no-store'}})
}
