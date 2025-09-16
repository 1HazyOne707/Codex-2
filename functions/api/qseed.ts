function ulid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,10) }
export const onRequest: PagesFunction = async ({ request, env }) => {
  const kv = (env as any).Codex_KV as KVNamespace
  if (request.method === 'POST'){
    const body = await request.json().catch(()=> ({} as any))
    if (!body.type && !body.title && !body.description)
      return new Response(JSON.stringify({ok:false,reason:'minimal-fields-missing'}),{status:400,headers:{'content-type':'application/json'}})
    const seed = {
      id: body.id || 'qseed-'+ulid(),
      type: body.type || 'software-job',
      title: body.title || '',
      description: body.description || '',
      payload: body.payload || { inputs:{}, sources:[], artifacts:[] },
      status: 'sprout',
      growth: body.growth || { stage:'skeleton', path:['skeleton','sandbox','pressure-test','debug','present'], complexity:1, potential:'' },
      beacon: !!body.beacon,
      routing: body.routing || { team:['dev'], notify:['owner'] },
      meta: body.meta || { priority:'normal', created:new Date().toISOString(), tags:[] }
    }
    const list = JSON.parse((await kv.get('q:queue','text')) || '[]')
    list.push(seed)
    await kv.put('q:queue', JSON.stringify(list))
    return new Response(JSON.stringify({ok:true, enqueued:seed.id, size:list.length}),{headers:{'content-type':'application/json'}})
  }
  // GET: list (admin only)
  const key = (env as any).ADMIN_KEY as string
  const hdr = (request.headers.get('x-admin-key')||'')
  const cookie = request.headers.get('cookie') || ''
  const ok = (hdr===key) || /codex_admin=1/.test(cookie)
  if (!ok) return new Response('Not found',{status:404})
  const list = JSON.parse((await kv.get('q:queue','text')) || '[]')
  return new Response(JSON.stringify({ok:true, size:list.length, items:list.slice(-50)}),{headers:{'content-type':'application/json','cache-control':'no-store'}})
}
