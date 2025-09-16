export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify({ ok: true, where: "pages-functions" }), {
    headers: { "content-type": "application/json" },
  });
};
