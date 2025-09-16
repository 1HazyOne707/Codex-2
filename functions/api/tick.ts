export interface Env { Codex_KV: KVNamespace, ADMIN_KEY?: string }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const isAdmin = (request.headers.get('cookie')||'').includes('codex_admin=1') ||
                  request.headers.get('x-admin-key') === (env.ADMIN_KEY || '');
  if (!isAdmin) return new Response(JSON.stringify({ok:false,reason:'admin-only'}),{status:403,headers:{'content-type':'application/json'}});

  const seed = (await env.Codex_KV.get('seed','json')) as any || { nodes:[], links:[], meta:{} };
  const rawQ = (await env.Codex_KV.get('queue','json')) as any[] | null;
  const q = Array.isArray(rawQ) ? rawQ : [];

  let changed = false;

  // If there is a queued job, apply one simple rule:
  if (q.length){
    const { job } = q.shift()!;
    // support job {node:{x,y,h}} or just {x,y}
    const x = typeof job?.x === 'number' ? job.x : Math.random();
    const y = typeof job?.y === 'number' ? job.y : 0.6 + Math.random()*0.35;
    const h = typeof job?.h === 'number' ? job.h : 0.6 + Math.random()*0.4;
    seed.nodes.push({ x, y, h });
    changed = true;
    await env.Codex_KV.put('queue', JSON.stringify(q));
  } else {
    // no jobs: gentle background growth (one bud)
    seed.nodes.push({ x: Math.random(), y: 0.6 + Math.random()*0.35, h: 0.6 + Math.random()*0.4 });
    changed = true;
  }

  if (changed){
    seed.meta = {...seed.meta, updated:new Date().toISOString()};
    await env.Codex_KV.put('seed', JSON.stringify(seed));
  }
  return new Response(JSON.stringify({ok:true, remaining:q.length, count:seed.nodes?.length||0}),
    { headers:{'content-type':'application/json'}});
};
