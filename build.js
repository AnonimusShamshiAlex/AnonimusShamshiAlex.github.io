// Netlify build: copies only the public files into dist/ (so server.js, data/ etc. are never exposed)
// and puts the real site address into the link-preview (og:image) tags.
const fs = require("fs"), path = require("path");
const out = path.join(__dirname, "dist");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const d of ["shared", "styles", "music", "admin"]) fs.cpSync(path.join(__dirname, d), path.join(out, d), { recursive: true });
const origin = (process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || "").replace(/\/+$/, "");
fs.writeFileSync(path.join(out, "index.html"), fs.readFileSync(path.join(__dirname, "index.html"), "utf8").replace(/__ORIGIN__/g, origin));
if (!origin) console.warn("WARNING: site address unknown, link preview image will not work. Set SITE_URL.");
console.log("dist ready, origin =", origin || "(none)");
