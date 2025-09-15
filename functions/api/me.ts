export interface Env { USERS: KVNamespace }

function parseCookie(h?: string|null): Record<string,string> {
  const out: Record<string,string> = {};
  if (!h) return out;
  h.split(";").forEach(p => {
    const i = p.indexOf("="); if (i>0) out[p.slice(0,i).trim()] = decodeURIComponent(p.slice(i+1));
  });
  return out;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const cookies = parseCookie(request.headers.get("cookie"));
  const id = cookies["codex_id"];
  if (!id) return new Response(JSON.stringify({ ok:false, anon:true }), { headers: { "content-type": "application/json" }});
  const json = await env.USERS.get(`user:${id}`);
  if (!json) return new Response(JSON.stringify({ ok:false, missing:true }), { headers: { "content-type": "application/json" }});
  return new Response(json, { headers: { "content-type": "application/json" }});
};
