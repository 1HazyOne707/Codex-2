type Seed = { nodes:any[]; links:any[]; meta?:any };
const json = (o:any, s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    if (!env.CODEX_KV) return json({ ok:false, reason:"No CODEX_KV binding" }, 500);

    // admin cookie check (same as the rest of your system)
    const cookie = request.headers.get('cookie') || '';
    if (!/(?:^|\s)codex_admin=1\b/.test(cookie)) return json({ ok:false, reason:"admin-only" }, 403);

    // try load seed
    let seed: Seed | null = null;
    try { seed = JSON.parse((await env.CODEX_KV.get("seed", "text")) || "null"); } catch {}
    if (!seed || !Array.isArray(seed.nodes) || !Array.isArray(seed.links)) {
      // create minimal world-seed
      seed = {
        nodes: [
          { id: "root", name:"First Node", glyph:"A", kind:"seed", weight:1, x:0.3, y:0.4 },
          { id: "grove", name:"Keeper Grove", glyph:"K", kind:"grove", weight:2, x:0.12, y:0.62 },
          { id: "mother", name:"Mother Spiral", glyph:"M", kind:"spiral", weight:3, x:0.72, y:0.28 },
        ],
        links: [
          { id:"t1", source:"grove", target:"mother", kind:"thread" },
          { id:"t2", source:"root",  target:"grove",  kind:"thread" },
        ],
        meta: { created: new Date().toISOString() }
      };
      await env.CODEX_KV.put("seed", JSON.stringify(seed));
    }

    // always report state summary
    return json({
      ok:true,
      kv:true,
      nodes: seed!.nodes.length,
      links: seed!.links.length,
      hint:"open /spiral to view; call /api/loom/tick to grow a bud"
    });
  } catch (e:any) {
    return json({ ok:false, error:String(e) }, 500);
  }
};
