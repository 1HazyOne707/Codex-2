export interface Env { CODEX_KV: KVNamespace }

const JSONH = { "content-type":"application/json; charset=utf-8" }

function uid(prefix='n'){ return prefix + Math.random().toString(36).slice(2,8) }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const cookie = request.headers.get('cookie') || ''
  const isAdmin = /(?:^|;\s*)codex_admin=1\b/.test(cookie)
  if (!isAdmin) return new Response(JSON.stringify({ ok:false, reason:'admin-only' }), { status:403, headers: JSONH })

  let seed = { meta:{}, nodes:[], links:[], jobs:[] } as any
  try { seed = JSON.parse(await env.CODEX_KV.get('seed','text') || '{}') } catch {}
  seed.nodes ||= []; seed.links ||= []; seed.jobs ||= []; seed.meta ||= {}

  let body:any = {}
  try { body = await request.json() } catch {}

  const added:any = { nodes:[], links:[] }

  if (Array.isArray(body.nodes)) {
    for (const n of body.nodes) {
      const node = { id: n.id || uid(), name: n.name || 'node', glyph: n.glyph || '', kind: n.kind || 'seed', weight: n.weight || 1, x: n.x||0, y:n.y||0 }
      seed.nodes.push(node); added.nodes.push(node)
    }
  }
  if (Array.isArray(body.links)) {
    for (const e of body.links) {
      const link = { id: e.id || uid('e'), source: e.source, target: e.target, kind: e.kind || 'thread' }
      seed.links.push(link); added.links.push(link)
    }
  }

  seed.meta.updated = new Date().toISOString()
  await env.CODEX_KV.put('seed', JSON.stringify(seed))
  return new Response(JSON.stringify({ ok:true, added }), { headers: JSONH })
}
