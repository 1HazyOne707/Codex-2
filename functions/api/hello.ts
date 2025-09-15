export const onRequest: PagesFunction = async () => {
  return new Response(JSON.stringify({ ok: true, msg: "Hello from Codex Functions ✨" }), {
    headers: { "content-type": "application/json" },
  });
};
