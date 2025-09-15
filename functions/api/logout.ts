export const onRequestPost: PagesFunction = async () => {
  const headers = new Headers({ "content-type": "application/json" });
  headers.append("set-cookie", "codex_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return new Response(JSON.stringify({ ok:true }), { headers });
};
