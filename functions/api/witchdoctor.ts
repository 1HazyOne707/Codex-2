import { DEFAULT_SEED } from "../_lib/defaultSeed";
interface Env { Codex_KV: KVNamespace }

function isAdminCookie(h: Headers) {
  const c = h.get("cookie") || "";
  return /(?:^|;\s*)codex_admin=1(?:;|$)/.test(c);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isAdminCookie(request.headers)) {
    return new Response(JSON.stringify({ ok:false, reason:"admin-only" }), { status:403 });
  }

  const body = (await request.json().catch(()=>({ action:"heal" }))) as any;
  const action = body.action || "heal";
  const out:any = { ok:true, action, steps:[] };

  // 1) ensure seed exists
  const seedRaw = await env.Codex_KV.get("seed","json").catch(()=>null) as any;
  if (!seedRaw || !Array.isArray(seedRaw?.nodes)) {
    await env.Codex_KV.put("seed", JSON.stringify(DEFAULT_SEED));
    out.steps.push("seed-restored");
  } else {
    out.steps.push("seed-ok");
  }

  // 2) verify last shadow (so we can see the mirror is alive)
  const lastShadow = await env.Codex_KV.get("shadows:last","json").catch(()=>null);
  if (lastShadow) out.lastShadow = lastShadow;

  // 3) simple growth nudge: remember a heartbeat
  await env.Codex_KV.put("witchdoctor:last", new Date().toISOString());

  return new Response(JSON.stringify(out), { headers:{ "content-type":"application/json" }});
};
