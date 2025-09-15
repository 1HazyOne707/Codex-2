export interface Env { CODEX_KV: KVNamespace }
const JSONH = { "content-type":"application/json; charset=utf-8" }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const cookie = request.headers.get('cookie') || ''
  const isAdmin = /(?:^|;\s*)codex_admin=1\b/.test(cookie)
  if (!isAdmin) return new Response(JSON.stringify({ ok:false, reason:'admin-only' }), { status:403, headers: JSONH })

  let seed:any = {}
  try { seed = JSON.parse(await env.CODEX_KV.get('seed','text') || '{}') } catch {}
  seed.nodes ||= []; seed.links ||= []; seed.meta ||= {}

  const base = seed.nodes.slice().sort((a:any,b:any)=> (b.weight||1)-(a.weight||1))[0]
  if (!base) return new Response(JSON.stringify({ ok:false, reason:'no-base-node' }), { headers: JSONH })

  const uid = Math.random().toString(36).slice(2,8)
  const bud = { id:'n'+uid, name:'bud-'+uid, glyph:'•', kind:'bud', weight:1, x:(base.x||0)+20, y:(base.y||0)+10 }
  seed.nodes.push(bud)
  seed.links.push({ id:'e'+uid, source:base.id, target:bud.id, kind:'bud-thread' })
  seed.meta.updated = new Date().toISOString()
  await env.CODEX_KV.put('seed', JSON.stringify(seed))
  return new Response(JSON.stringify({ ok:true, grew:bud.id }), { headers: JSONH })
}
