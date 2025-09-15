export interface Env { CODEX_KV: KVNamespace }

async function readBody<T=unknown>(req: Request): Promise<T|null> {
  try { return await req.json() as T } catch { return null }
}

const JSONH = { "content-type":"application/json; charset=utf-8" }

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const method = request.method.toUpperCase()

  if (method === 'GET') {
    const raw = await env.CODEX_KV.get('seed', 'text')
    if (!raw) {
      // empty starter seed
      const seed = {
        meta: { name: "codex.world-seed", updated: new Date().toISOString() },
        nodes: [],
        links: [],
        jobs: []
      }
      return new Response(JSON.stringify(seed), { headers: JSONH })
    }
    return new Response(raw, { headers: JSONH })
  }

  if (method === 'POST') {
    // admin only
    const cookie = request.headers.get('cookie') || ''
    const isAdmin = /(?:^|;\s*)codex_admin=1\b/.test(cookie)
    if (!isAdmin) return new Response(JSON.stringify({ ok:false, reason:'admin-only' }), { status:403, headers: JSONH })

    const body = await readBody<any>(request)
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ ok:false, reason:'invalid-json' }), { status:400, headers: JSONH })
    }
    body.meta ||= {}
    body.meta.updated = new Date().toISOString()
    await env.CODEX_KV.put('seed', JSON.stringify(body))
    return new Response(JSON.stringify({ ok:true }), { headers: JSONH })
  }

  return new Response(JSON.stringify({ ok:false, reason:'method' }), { status:405, headers: JSONH })
}
