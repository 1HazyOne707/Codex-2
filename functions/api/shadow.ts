interface Env { Codex_KV: KVNamespace }
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const body = (await request.json().catch(()=>({}))) as any;
  const entry = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    kind: body?.kind || url.searchParams.get("kind") || "unknown",
    note: body?.note || url.searchParams.get("note") || "",
    data: body?.data ?? null,
  };

  await env.Codex_KV.put(`shadows:${entry.id}`, JSON.stringify(entry), { expirationTtl: 60*60*24*7 });
  await env.Codex_KV.put(`shadows:last`, JSON.stringify(entry));
  return new Response(JSON.stringify({ ok:true, entry }), { headers:{ "content-type":"application/json" }});
};
