export interface Env { Codex_KV: KVNamespace }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try{
    const job = await request.json(); // any shape
    const raw = await env.Codex_KV.get('queue','json') as any[] | null;
    const q = Array.isArray(raw) ? raw : [];
    q.push({ job, at: Date.now() });
    await env.Codex_KV.put('queue', JSON.stringify(q));
    return new Response(JSON.stringify({ok:true, size:q.length}), { headers:{'content-type':'application/json'} });
  }catch(e){
    return new Response(JSON.stringify({ok:false, reason:String(e)}),{status:400,headers:{'content-type':'application/json'}});
  }
};
