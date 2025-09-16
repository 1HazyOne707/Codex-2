import { DEFAULT_SEED } from "../_lib/defaultSeed";

interface Env { Codex_KV: KVNamespace }

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  let seed = await env.Codex_KV.get("seed", "json").catch(() => null);

  if (!seed) {
    // if missing, auto-restore default
    seed = DEFAULT_SEED;
    await env.Codex_KV.put("seed", JSON.stringify(seed));
  }

  return new Response(JSON.stringify(seed), {
    headers: { "content-type": "application/json" }
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json().catch(() => ({}));
  await env.Codex_KV.put("seed", JSON.stringify(body));
  return new Response(JSON.stringify({ ok:true, saved: body }), {
    headers: { "content-type": "application/json" }
  });
};
