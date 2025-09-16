export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const adminKey = (env as any).ADMIN_KEY as string | undefined;
  const headerKey = request.headers.get("x-admin-key") || "";
  const raw = (await request.text()).trim();

  const key = headerKey || raw;
  if (!adminKey || !key || key !== adminKey) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const headers = new Headers({ "content-type": "application/json" });
  // secure cookie so you don't have to keep sending header
  headers.append(
    "set-cookie",
    "codex_admin=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400"
  );
  return new Response(JSON.stringify({ ok: true }), { headers });
};
