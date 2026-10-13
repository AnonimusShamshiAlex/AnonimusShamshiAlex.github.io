// RSVP + admin API for Netlify Functions. `store` is a Netlify Blobs store.
import crypto from "node:crypto";

const password = () => process.env.ADMIN_PASSWORD || "1729";
const sign = (exp) => crypto.createHmac("sha256", "taklif|" + password()).update(String(exp)).digest("hex");
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const makeToken = () => { const exp = Date.now() + 12 * 3600e3; return exp + "." + sign(exp); };
const okToken = (t) => { const [exp, sig] = String(t || "").split("."); return !!exp && Number(exp) > Date.now() && eq(sig || "", sign(exp)); };
const clean = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, n);
const json = (code, obj) => new Response(JSON.stringify(obj), { status: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const fails = new Map(); // best-effort brute-force guard (per warm instance)
function tooMany(ip) { const now = Date.now(), a = (fails.get(ip) || []).filter((t) => now - t < 600000); fails.set(ip, a); return a.length >= 8; }

export async function handle(req, store) {
  const p = new URL(req.url).pathname.replace(/\/+$/, "");
  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "";
  const authed = () => okToken((req.headers.get("authorization") || "").replace(/^Bearer /, ""));
  const read = async () => { const t = await req.text(); if (t.length > 20000) throw new Error("big"); return JSON.parse(t || "{}"); };
  try {
    if (req.method === "POST" && p === "/api/rsvp") {
      const d = await read();
      if (d.website) return json(200, { ok: true }); // honeypot
      const name = clean(d.name, 80);
      if (!name) return json(400, { error: "name" });
      const attend = d.attend === "no" ? "no" : "yes";
      const guests = attend === "yes" ? Math.min(10, Math.max(1, parseInt(d.guests, 10) || 1)) : 0;
      const id = Date.now().toString(36) + crypto.randomBytes(3).toString("hex");
      await store.setJSON(id, { id, name, attend, guests, wish: clean(d.wish, 500), to: clean(d.to, 60), at: new Date().toISOString() });
      return json(200, { ok: true });
    }
    if (req.method === "POST" && p === "/api/admin/login") {
      if (tooMany(ip)) return json(429, { error: "Juda koʻp urinish. 10 daqiqadan soʻng qayta urining." });
      const d = await read();
      if (!eq(d.password || "", password())) { fails.get(ip).push(Date.now()); return json(401, { error: "Parol notoʻgʻri" }); }
      return json(200, { token: makeToken() });
    }
    if (req.method === "GET" && p === "/api/admin/rsvps") {
      if (!authed()) return json(401, { error: "auth" });
      const { blobs } = await store.list();
      const rows = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" }).catch(() => null)))).filter(Boolean);
      rows.sort((a, b) => (a.at < b.at ? 1 : -1));
      return json(200, rows);
    }
    const del = /^\/api\/admin\/rsvps\/([\w-]+)$/.exec(p);
    if (req.method === "DELETE" && del) {
      if (!authed()) return json(401, { error: "auth" });
      await store.delete(del[1]);
      return json(200, { ok: true });
    }
    return json(404, { error: "not found" });
  } catch (e) { return json(400, { error: "bad request" }); }
}
