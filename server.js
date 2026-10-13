// Taklifnoma server — no dependencies. Run: node server.js
// Serves the invitation, stores RSVP answers, and protects /admin with a password.
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.ADMIN_PASSWORD || "1729";
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "rsvp.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".jpg": "image/jpeg", ".webp": "image/webp", ".png": "image/png", ".mp4": "video/mp4",
  ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const PUBLIC_DIRS = ["shared", "styles", "music", "admin"];

const load = () => { try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch { return []; } };
const save = (list) => { const t = DATA_FILE + ".tmp"; fs.writeFileSync(t, JSON.stringify(list, null, 2)); fs.renameSync(t, DATA_FILE); };

const hits = new Map();
function limited(key, max, ms) {
  const now = Date.now(), a = (hits.get(key) || []).filter((t) => now - t < ms);
  a.push(now); hits.set(key, a); return a.length > max;
}
const tokens = new Map(); // token -> expiry
const ipOf = (req) => (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
const safeEq = (a, b) => { const x = crypto.createHash("sha256").update(String(a)).digest(), y = crypto.createHash("sha256").update(String(b)).digest(); return crypto.timingSafeEqual(x, y); };
const authed = (req) => { const t = (req.headers.authorization || "").replace(/^Bearer /, ""); const e = tokens.get(t); if (e && e > Date.now()) return true; tokens.delete(t); return false; };

function json(res, code, obj) { res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(obj)); }
function body(req) {
  return new Promise((ok, no) => {
    let n = 0, chunks = [];
    req.on("data", (c) => { n += c.length; if (n > 20000) { no(new Error("big")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { ok(JSON.parse(Buffer.concat(chunks).toString() || "{}")); } catch (e) { no(e); } });
    req.on("error", no);
  });
}
const clean = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, n);

function serveFile(req, res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("404"); }
    if (file === path.join(ROOT, "index.html")) { // link previews (Telegram etc.) need an absolute image URL
      const proto = (req.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
      const origin = (process.env.SITE_URL || proto + "://" + req.headers.host).replace(/\/+$/, "");
      return fs.readFile(file, "utf8", (e, html) => {
        if (e) { res.writeHead(500); return res.end(); }
        res.writeHead(200, { "Content-Type": MIME[".html"], "Cache-Control": "no-cache" });
        res.end(req.method === "HEAD" ? undefined : html.replace(/__ORIGIN__/g, origin));
      });
    }
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    const h = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": file.endsWith(".html") ? "no-cache" : "public, max-age=86400" };
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (m) { // video/audio need Range on iPhone
      let s = m[1] ? +m[1] : 0, e = m[2] ? +m[2] : st.size - 1;
      if (!m[1] && m[2]) { s = st.size - +m[2]; e = st.size - 1; }
      if (s > e || s >= st.size) { res.writeHead(416, { "Content-Range": "bytes */" + st.size }); return res.end(); }
      res.writeHead(206, { ...h, "Content-Range": `bytes ${s}-${e}/${st.size}`, "Content-Length": e - s + 1 });
      return fs.createReadStream(file, { start: s, end: e }).pipe(res);
    }
    res.writeHead(200, { ...h, "Content-Length": st.size });
    fs.createReadStream(file).pipe(res);
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x"), p = decodeURIComponent(url.pathname);
  try {
    // ---- guests send an answer ----
    if (req.method === "POST" && p === "/api/rsvp") {
      if (limited("rsvp:" + ipOf(req), 8, 60000)) return json(res, 429, { error: "slow down" });
      const d = await body(req);
      if (d.website) return json(res, 200, { ok: true }); // honeypot: pretend success
      const name = clean(d.name, 80);
      if (!name) return json(res, 400, { error: "name" });
      const attend = d.attend === "no" ? "no" : "yes";
      const guests = attend === "yes" ? Math.min(10, Math.max(1, parseInt(d.guests, 10) || 1)) : 0;
      const list = load();
      list.push({ id: crypto.randomBytes(6).toString("hex"), name, attend, guests, wish: clean(d.wish, 500), to: clean(d.to, 60), at: new Date().toISOString() });
      save(list);
      return json(res, 200, { ok: true });
    }
    // ---- admin ----
    if (req.method === "POST" && p === "/api/admin/login") {
      if (limited("login:" + ipOf(req), 8, 600000)) return json(res, 429, { error: "Juda koʻp urinish. 10 daqiqadan soʻng qayta urining." });
      const d = await body(req);
      if (!safeEq(d.password || "", PASSWORD)) return json(res, 401, { error: "Parol notoʻgʻri" });
      const t = crypto.randomBytes(24).toString("hex"); tokens.set(t, Date.now() + 12 * 3600e3);
      return json(res, 200, { token: t });
    }
    if (p === "/api/admin/rsvps") {
      if (!authed(req)) return json(res, 401, { error: "auth" });
      if (req.method === "GET") return json(res, 200, load().reverse());
    }
    const del = /^\/api\/admin\/rsvps\/([a-f0-9]+)$/.exec(p);
    if (del && req.method === "DELETE") {
      if (!authed(req)) return json(res, 401, { error: "auth" });
      save(load().filter((r) => r.id !== del[1])); return json(res, 200, { ok: true });
    }
    if (p.startsWith("/api/")) return json(res, 404, { error: "not found" });
    // ---- static files ----
    if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
    if (p === "/") return serveFile(req, res, path.join(ROOT, "index.html"));
    if (p === "/admin" || p === "/admin/") return serveFile(req, res, path.join(ROOT, "admin", "index.html"));
    const top = p.split("/")[1], file = path.join(ROOT, p);
    if (!PUBLIC_DIRS.includes(top) || !file.startsWith(ROOT + path.sep)) { res.writeHead(404); return res.end("404"); }
    serveFile(req, res, file);
  } catch (e) { json(res, 400, { error: "bad request" }); }
}).listen(PORT, () => console.log(`Taklifnoma:  http://localhost:${PORT}\nAdmin panel: http://localhost:${PORT}/admin  (parol: ${PASSWORD === "1729" ? "1729" : "env ADMIN_PASSWORD"})`));
