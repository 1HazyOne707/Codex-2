export interface Env { USERS: KVNamespace }

const GLYPHS = ["A","E","I","O","U","N","R","S","T","L","M","K","V","H","D","G","P","B","Y","Z"];

function randomName(): string {
  // e.g., "AE-NR-07"
  const pick = () => GLYPHS[(Math.random()*GLYPHS.length) | 0];
  const n = (Math.random()*100) | 0;
  return `${pick()}${pick()}-${pick()}${pick()}-${n.toString().padStart(2,'0')}`;
}

function uid(): string {
  // tiny uid
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2,'0')).join('');
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const now = new Date().toISOString();
  const id = uid();
  const name = randomName();

  // optional payload (invite/email), ignore if absent
  let payload: any = {};
  try { payload = await request.json().catch(()=>({})); } catch {}

  const record = {
    id, name, createdAt: now,
    ua: request.headers.get('user-agent') || "",
    invite: payload?.invite || null,
    email: payload?.email || null
  };

  await env.USERS.put(`user:${id}`, JSON.stringify(record), { metadata: { name }, expirationTtl: 60*60*24*365*2 }); // 2y

  const headers = new Headers({ "content-type": "application/json" });
  const cookie = [
    `codex_id=${id}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=63072000" // 2 years
  ].join("; ");
  headers.append("set-cookie", cookie);

  return new Response(JSON.stringify({ ok:true, id, name }), { headers });
};
