export const onRequestGet: PagesFunction = async ({ env }) => {
  try {
    // binding present?
    if (!env.CODEX_KV) {
      return new Response(JSON.stringify({ ok:false, kv:false, reason:"No CODEX_KV binding" }), { status:500 });
    }
    // write & read back a sentinel
    await env.CODEX_KV.put("__kvcheck__", "ok", { expirationTtl: 120 });
    const v = await env.CODEX_KV.get("__kvcheck__");
    return new Response(JSON.stringify({ ok: !!v, kv: !!v }), { headers: { "content-type":"application/json" }});
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status:500 });
  }
};
