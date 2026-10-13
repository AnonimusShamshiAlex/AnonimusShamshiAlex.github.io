/*
 * Shared runtime for every invitation style.
 *
 * Templates write all text in Uzbek Latin. When the guest switches to
 * Cyrillic, every text node (and placeholder/aria-label/title) under <body>
 * is transliterated automatically — including content added later by JS.
 *   - data-no-tr       on an element: leave its text as-is (card numbers, brands)
 *   - data-cyr="…"     on a leaf element: explicit Cyrillic text instead of auto
 *   - data-d="path"    fill from the invitation data (e.g. "names.0", "date.long")
 *   - data-if="path"   remove the element when that data is missing or empty
 *   - data-ph="path"   that data as the field's placeholder (the template's is the fallback)
 *                      (optional sections: gifts, hashtag, quote…)
 *
 * The data is window.INVITE, written into each page by tools/build.mjs from
 * the order file (invites/<slug>/invite.js) or a style's demo.js.
 */
(function () {
  const D = window.INVITE;
  const TZ = "Asia/Tashkent";
  const LANG_KEY = "invite-lang";

  /* ---------- Transliteration (Uzbek Latin → Cyrillic) ---------- */

  // Customers type o' g' with any apostrophe; normalize to the proper letters.
  function normalizeLatin(s) {
    return s
      .replace(/([oOgG])['’‘`ʻʼ]/g, "$1ʻ")
      .replace(/(\p{L})['’ʼ](?=\p{L})/gu, "$1ʼ");
  }

  // What the guest sees: ‘ and ’ instead of ʻ and ʼ. Same letters, but every
  // font has the quote marks, while many display fonts lack U+02BB and fall
  // back to another font mid-word ("Tug ilgan").
  const latinDisplay = (s) => normalizeLatin(s).replace(/ʻ/g, "\u2018").replace(/ʼ/g, "\u2019");

  const PAIRS = { "oʻ": "ў", "gʻ": "ғ", sh: "ш", ch: "ч", yo: "ё", yu: "ю", ya: "я", ye: "е" };
  const SINGLE = {
    a: "а", b: "б", c: "с", d: "д", e: "е", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж",
    k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "қ", r: "р", s: "с", t: "т",
    u: "у", v: "в", w: "в", x: "х", y: "й", z: "з", "ʼ": "ъ",
  };
  const CYR_VOWELS = "аеёиоуўэюя";
  const isUpper = (ch) => ch !== ch.toLowerCase();

  function toCyrillic(input) {
    const s = normalizeLatin(input);
    let out = "";
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      const lower = ch.toLowerCase();
      const pair = (ch + (s[i + 1] || "")).toLowerCase();

      // "yoʻl" is y + oʻ, not yo + ʻ
      const pairOk = PAIRS[pair] && !(pair === "yo" && s[i + 2] === "ʻ");
      if (pairOk) {
        const c = PAIRS[pair];
        out += isUpper(ch) ? c.toUpperCase() : c;
        i++;
        continue;
      }

      // Isʼhoq → Исҳоқ (tutuq only separates s/c from h)
      if (ch === "ʼ" && /[sScC]/.test(s[i - 1] || "") && /[hH]/.test(s[i + 1] || "")) continue;

      if (lower === "e") {
        const prev = out[out.length - 1] || "";
        const wordStart = !/\p{L}/u.test(prev);
        const c = wordStart || CYR_VOWELS.includes(prev.toLowerCase()) ? "э" : "е";
        out += isUpper(ch) ? c.toUpperCase() : c;
        continue;
      }

      const c = SINGLE[lower];
      out += c ? (isUpper(ch) ? c.toUpperCase() : c) : ch;
    }
    return out;
  }

  /* ---------- Language state ---------- */

  const listeners = [];
  let lang = "lat";

  try {
    lang = localStorage.getItem(LANG_KEY) || "lat";
  } catch {}
  const urlLang = new URLSearchParams(location.search).get("lang");
  if (urlLang === "cyr" || urlLang === "lat") lang = urlLang;

  const tr = (s) => (lang === "cyr" ? toCyrillic(String(s)) : latinDisplay(String(s)));

  /* ---------- Auto-transliteration of the DOM ---------- */

  const original = new WeakMap(); // text node → Latin source
  const written = new WeakMap(); // text node → what we last wrote
  const ATTRS = ["placeholder", "aria-label", "title", "alt"];

  function skip(node) {
    const el = node.nodeType === 1 ? node : node.parentElement;
    return !el || !!el.closest("[data-no-tr], script, style, noscript, svg text[data-no-tr]");
  }

  function applyText(node) {
    if (skip(node)) return;
    // If someone changed the text since we wrote it, the new value is the source.
    if (!original.has(node) || written.get(node) !== node.data) original.set(node, node.data);
    const parent = node.parentElement;
    const override = lang === "cyr" && parent && parent.childNodes.length === 1 && parent.dataset.cyr;
    const next = override || tr(original.get(node));
    if (node.data !== next) node.data = next;
    written.set(node, next);
  }

  function applyAttrs(el) {
    if (el.nodeType !== 1 || skip(el)) return;
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const key = "lat" + a.replace(/-./g, (m) => m[1].toUpperCase());
      const cur = el.getAttribute(a);
      if (el.dataset[key + "Out"] !== cur) el.dataset[key] = cur;
      const next = tr(el.dataset[key]);
      el.setAttribute(a, next);
      el.dataset[key + "Out"] = next;
    }
  }

  function apply(root) {
    if (!root) return;
    if (root.nodeType === 3) return applyText(root);
    applyAttrs(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeType === 3) {
        if (n.data.trim()) applyText(n);
      } else applyAttrs(n);
    }
  }

  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "characterData") {
        if (written.get(r.target) !== r.target.data) applyText(r.target);
      } else {
        r.addedNodes.forEach(apply);
      }
    }
  });

  function setLang(next) {
    if (next !== "lat" && next !== "cyr") return;
    lang = next;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {}
    document.documentElement.lang = lang === "cyr" ? "uz-Cyrl" : "uz-Latn";
    document.documentElement.dataset.script = lang;
    apply(document.body);
    listeners.forEach((fn) => fn(lang));
  }

  /* ---------- Dates ---------- */

  const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  const WEEKDAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
  const eventDate = new Date(D.date);

  function dateParts() {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23",
      }).formatToParts(eventDate).map((x) => [x.type, x.value])
    );
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
    const m = Number(p.month) - 1;
    const day = String(Number(p.day));
    return {
      day,
      dd: p.day,
      mm: p.month,
      month: MONTHS[m],
      Month: MONTHS[m][0].toUpperCase() + MONTHS[m].slice(1),
      year: p.year,
      weekday: WEEKDAYS[wd],
      Weekday: WEEKDAYS[wd][0].toUpperCase() + WEEKDAYS[wd].slice(1),
      time: `${p.hour}:${p.minute}`,
      short: `${p.day}.${p.month}.${p.year}`,
      long: `${day}-${MONTHS[m]}, ${p.year}-yil`,
    };
  }

  const DATE = dateParts();

  // Monday-first grid for the wedding month: [[null, null, 1, 2, …], …]
  function monthGrid() {
    const y = Number(DATE.year);
    const m = Number(DATE.mm) - 1;
    const first = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const cells = Array(first).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));
    while (cells.length % 7) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }

  const WEEKDAYS_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  // Auto-transliteration would give single letters for Ch/Sh/Ya
  const WEEKDAYS_SHORT_CYR = ["Ду", "Се", "Чо", "Па", "Жу", "Ша", "Як"];

  /* ---------- Personal guest name: ?to=Aziz%20aka ---------- */

  const guestName = (new URLSearchParams(location.search).get("to") || "").trim().slice(0, 60);
  const GUEST = {
    name: guestName,
    greeting: guestName ? `Hurmatli ${guestName}!` : D.invitation.greeting,
  };

  function get(path) {
    if (path.startsWith("date.")) return DATE[path.slice(5)];
    if (path.startsWith("guest.")) return GUEST[path.slice(6)];
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), D);
  }

  const isEmpty = (v) => v == null || v === "" || v === false || (Array.isArray(v) && !v.length);

  // Optional parts of a page go away when the order has no data for them
  function prune(root = document) {
    root.querySelectorAll("[data-if]").forEach((el) => {
      if (isEmpty(get(el.dataset.if))) el.remove();
    });
  }

  function bindData(root = document) {
    prune(root);
    root.querySelectorAll("[data-d]").forEach((el) => {
      const v = get(el.dataset.d);
      if (v != null) el.textContent = latinDisplay(String(v));
    });
    root.querySelectorAll("[data-ph]").forEach((el) => {
      const v = get(el.dataset.ph);
      if (v != null) el.setAttribute("placeholder", latinDisplay(String(v)));
    });
  }

  /* ---------- Countdown ---------- */

  function countdown(root) {
    if (!root) return;
    const els = {};
    root.querySelectorAll("[data-cd]").forEach((el) => (els[el.dataset.cd] = el));
    const pad = (n) => String(n).padStart(2, "0");

    function tick() {
      let s = Math.max(0, Math.floor((eventDate - Date.now()) / 1000));
      root.classList.toggle("is-past", s === 0);
      const days = Math.floor(s / 86400);
      s %= 86400;
      const vals = { days: String(days), hours: pad(Math.floor(s / 3600)), minutes: pad(Math.floor((s % 3600) / 60)), seconds: pad(s % 60) };
      for (const k in els) if (els[k].textContent !== vals[k]) els[k].textContent = vals[k];
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Copy to clipboard ---------- */

  async function copy(text, button) {
    const value = String(text).replace(/\s+/g, "");
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = Object.assign(document.createElement("textarea"), { value });
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.append(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    if (button) {
      const label = button.querySelector("[data-copy-label]") || button;
      // Restore the Latin source so the auto-transliteration keeps working
      const node = label.firstChild;
      const prev = label.dataset.latLabel || (node && original.get(node)) || label.textContent;
      label.dataset.latLabel = prev;
      label.textContent = "Nusxalandi";
      button.classList.add("is-copied");
      clearTimeout(button._t);
      button._t = setTimeout(() => {
        label.textContent = prev;
        button.classList.remove("is-copied");
      }, 1800);
    }
  }

  /* ---------- Calendar ---------- */

  function icsDate(d) {
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function esc(s) {
    return String(s).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  }

  function downloadIcs() {
    const end = new Date(eventDate.getTime() + 6 * 3600 * 1000);
    const title = tr(D.words.ics);
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Taklifchi//UZ", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${icsDate(eventDate)}-${D.slug}@taklifchi.online`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(eventDate)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${esc(title)}`,
      `LOCATION:${esc(tr([D.venue.name, D.venue.address].filter(Boolean).join(", ")))}`,
      `DESCRIPTION:${esc(tr(D.invitation.text))}`,
      D.venue.lat != null && `GEO:${D.venue.lat};${D.venue.lng}`,
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${esc(title)}`, "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "taklifnoma.ics" });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------- Map (MapLibre + OpenFreeMap, Mapbox-like look, no token) ---------- */

  const MAPLIBRE = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl";
  let maplibreLoading;

  function loadMaplibre() {
    if (window.maplibregl) return Promise.resolve(window.maplibregl);
    if (!maplibreLoading) {
      maplibreLoading = new Promise((resolve, reject) => {
        const css = Object.assign(document.createElement("link"), { rel: "stylesheet", href: MAPLIBRE + ".css" });
        const js = Object.assign(document.createElement("script"), { src: MAPLIBRE + ".js" });
        js.onload = () => resolve(window.maplibregl);
        js.onerror = reject;
        document.head.append(css, js);
      });
    }
    return maplibreLoading;
  }

  function hasWebGL() {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      return false;
    }
  }

  // Recolor any OpenMapTiles-based style to the template's palette.
  function paint(map, p) {
    const set = (id, prop, val) => {
      if (val == null) return;
      try {
        map.setPaintProperty(id, prop, val);
      } catch {}
    };
    const hide = (id) => {
      try {
        map.setLayoutProperty(id, "visibility", "none");
      } catch {}
    };

    for (const l of map.getStyle().layers) {
      const sl = l["source-layer"] || "";
      const id = l.id;
      if (l.type === "background") set(id, "background-color", p.land);
      else if (l.type === "fill" && sl === "water") set(id, "fill-color", p.water);
      else if (l.type === "line" && sl === "waterway") set(id, "line-color", p.water);
      else if (l.type === "fill" && (sl === "park" || sl === "landcover")) set(id, "fill-color", p.park);
      else if (l.type === "fill" && sl === "landuse") set(id, "fill-color", p.landuse || p.land);
      else if (l.type === "fill" && sl === "building") {
        set(id, "fill-color", p.building);
        set(id, "fill-outline-color", p.building);
      } else if (l.type === "line" && sl === "transportation") {
        if (/rail/.test(id)) hide(id);
        else if (/casing/.test(id)) set(id, "line-color", p.roadCasing || p.land);
        else if (/major|motorway|trunk|primary/.test(id)) set(id, "line-color", p.roadMajor || p.road);
        else set(id, "line-color", p.road);
      } else if (l.type === "line" && sl === "boundary") hide(id);
      else if (l.type === "line" || l.type === "fill") {
        if (sl === "aeroway") set(id, l.type + "-color", p.landuse || p.land);
      } else if (l.type === "symbol") {
        if (/shield|airport|aerodrome/.test(id) || sl === "aerodrome_label") hide(id);
        set(id, "text-color", p.label);
        set(id, "text-halo-color", p.labelHalo || p.land);
      }
    }
  }

  // Prefer Uzbek, then Latin-script names over English ones
  function localizeLabels(map) {
    const field = ["coalesce", ["get", "name:uz"], ["get", "name:latin"], ["get", "name"]];
    for (const l of map.getStyle().layers) {
      if (l.type !== "symbol" || !l.layout || !l.layout["text-field"]) continue;
      try {
        map.setLayoutProperty(l.id, "text-field", field);
      } catch {}
    }
  }

  function defaultPin(color) {
    const el = document.createElement("div");
    el.innerHTML = `<svg width="38" height="48" viewBox="0 0 38 48" aria-hidden="true"><path d="M19 47s17-15.6 17-28A17 17 0 0 0 2 19c0 12.4 17 28 17 28Z" fill="${color}"/><circle cx="19" cy="19" r="6.5" fill="#fff"/></svg>`;
    return el;
  }

  /**
   * mountMap(el, { palette, marker, zoom, style, interactive })
   * Lazily loads when near the viewport. Falls back to a static card
   * (class "map--fallback") when WebGL or the network is unavailable.
   */
  function mountMap(el, opts = {}) {
    if (!el) return;
    const v = D.venue;
    const fail = () => el.classList.add("map--fallback");
    if (!hasWebGL()) return fail();

    const start = () =>
      loadMaplibre()
        .then((ml) => {
          const map = new ml.Map({
            container: el,
            style: `https://tiles.openfreemap.org/styles/${opts.style || "positron"}`,
            center: [v.lng, v.lat],
            zoom: opts.zoom || 14.6,
            pitch: opts.pitch || 0,
            bearing: opts.bearing || 0,
            attributionControl: { compact: true },
            cooperativeGestures: true,
            dragRotate: false,
            pitchWithRotate: false,
          });
          map.on("load", () => {
            if (opts.palette) paint(map, opts.palette);
            localizeLabels(map);
            // Keep the (required) attribution behind its "i" button
            el.querySelector(".maplibregl-compact-show")?.classList.remove("maplibregl-compact-show");
            el.classList.add("map--ready");
          });
          map.on("error", (e) => console.warn("map:", e && e.error && e.error.message));
          const marker = opts.marker ? opts.marker() : defaultPin((opts.palette && opts.palette.pin) || "#c0392b");
          new ml.Marker({ element: marker, anchor: "bottom" }).setLngLat([v.lng, v.lat]).addTo(map);
          map.addControl(new ml.NavigationControl({ showCompass: false }), "bottom-right");
          el._map = map;
        })
        .catch(fail);

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
  }

  const links = {
    yandex: `https://yandex.uz/maps/?pt=${D.venue.lng},${D.venue.lat}&z=16&l=map`,
    google: `https://www.google.com/maps/search/?api=1&query=${D.venue.lat},${D.venue.lng}`,
    telegram: D.rsvp && D.rsvp.telegram,
  };

  /* ---------- Reveal on scroll ---------- */

  function reveal(root = document, opts = {}) {
    const items = root.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) return items.forEach((el) => el.classList.add("is-in"));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: opts.threshold ?? 0.18, rootMargin: opts.rootMargin || "0px 0px -6% 0px", root: opts.root || null }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Language toggle ---------- */

  function mountLangToggle(el) {
    if (!el) return;
    el.setAttribute("data-no-tr", "");
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", "Yozuv / Ёзув");
    el.innerHTML = `<button type="button" data-lang="lat">Lotin</button><button type="button" data-lang="cyr">Кирилл</button>`;
    const sync = () => el.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-lang]");
      if (b) setLang(b.dataset.lang);
    });
    listeners.push(sync);
    sync();
  }

  /* ---------- RSVP ----------
   * Posts the answer to /api/rsvp (server.js), which stores it so the hosts
   * can read every answer in /admin.
   */

  function rsvp(form) {
    if (!form) return;
    // Bots fill every field; people never see this one
    form.insertAdjacentHTML("beforeend", '<input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" />');
    const btn = form.querySelector('[type="submit"]');
    const err = Object.assign(document.createElement("p"), { className: "form__err", role: "alert" });
    err.style.cssText = "margin:.6em 0 0;font-size:.85em;text-align:center;color:#b3261e";
    let busy = false;
    const sent = (data) => {
      form.classList.add("is-sent");
      form.dispatchEvent(new CustomEvent("rsvp:sent", { detail: data, bubbles: true }));
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      const data = Object.fromEntries(new FormData(form));
      const _tg = D.rsvp && D.rsvp.telegram;
      if (_tg) {
        const txt = "Javob: " + (data.name || "") + "\n" + (data.attend === "yes" ? "Keladi: " + data.guests + " kishi" : "Kela olmaydi") + (data.wish ? "\n" + data.wish : "");
        window.open(_tg + (_tg.indexOf("?") > -1 ? "&" : "?") + "text=" + encodeURIComponent(txt), "_blank");
      }
      busy = true;
      err.remove();
      if (btn) btn.disabled = true;
      try {
        const res = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, slug: D.slug, to: guestName }),
        });
        if (!res.ok) throw new Error("rsvp " + res.status);
        sent(data);
      } catch (x) {
        console.warn(x);
        err.textContent = "Javob yuborilmadi. Internetni tekshirib, qaytadan urinib koʻring.";
        (btn || form).after(err);
      } finally {
        busy = false;
        if (btn) btn.disabled = false;
      }
    });
  }

  /* ---------- Background music (on by default) ----------
   * Phones only allow sound after a tap, so templates call Invite.music.start()
   * inside their "open" tap handler. Without an intro (?opened) the music tries
   * to play right away and otherwise starts on the guest's first tap.
   * Turning it off is remembered for the next visit.
   */
  const MUSIC_KEY = "invite-music";

  const music = (() => {
    const cfg = D.music || {};
    const noop = { start() {}, autoStart() {}, toggle() {}, get playing() { return false; } };
    if (!cfg.src) return noop;

    const audio = new Audio();
    audio.src = cfg.src;
    audio.loop = true;
    audio.preload = "auto";
    const volume = cfg.volume ?? 0.7;
    let wanted = cfg.autoplay !== false;
    try {
      if (localStorage.getItem(MUSIC_KEY) === "off") wanted = false;
    } catch {}
    let resumeOnShow = false;
    let fadeTimer;
    const buttons = [];

    function fade(to, ms, done) {
      clearInterval(fadeTimer);
      const from = audio.volume;
      const t0 = performance.now();
      fadeTimer = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        try {
          audio.volume = from + (to - from) * k; // ignored on iOS, which is fine
        } catch {}
        if (k === 1) {
          clearInterval(fadeTimer);
          done && done();
        }
      }, 40);
    }

    function sync() {
      const on = !audio.paused;
      buttons.forEach((b) => {
        b.classList.toggle("is-playing", on);
        b.setAttribute("aria-pressed", String(on));
      });
    }

    function play() {
      try {
        audio.volume = 0;
      } catch {}
      const p = audio.play();
      fade(volume, 1800);
      return (p || Promise.resolve()).catch(() => armFirstTap());
    }

    function stop() {
      fade(0, 350, () => audio.pause());
    }

    // click/touchend reliably count as a user gesture for audio on iOS Safari
    const GESTURES = ["pointerdown", "touchend", "click", "keydown"];
    let armed = false;
    function armFirstTap() {
      if (armed) return;
      armed = true;
      const go = (e) => {
        if (e.target.closest && e.target.closest(".music")) return; // the button handles itself
        off();
        if (wanted && audio.paused) play();
      };
      const off = () => {
        armed = false;
        GESTURES.forEach((t) => removeEventListener(t, go, true));
      };
      GESTURES.forEach((t) => addEventListener(t, go, true));
    }

    function save() {
      try {
        localStorage.setItem(MUSIC_KEY, wanted ? "on" : "off");
      } catch {}
    }

    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);

    // Pause when the guest switches apps or tabs, resume when they come back
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        resumeOnShow = !audio.paused;
        audio.pause();
      } else if (resumeOnShow && wanted) {
        play();
      }
    });

    if ("mediaSession" in navigator && cfg.title) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: cfg.title, artist: cfg.artist || "" });
      } catch {}
    }

    function mount() {
      const host = document.querySelector("[data-music]");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "music" + (host ? "" : " music--float");
      b.setAttribute("aria-label", "Musiqa");
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = '<span class="music__bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
      b.addEventListener("click", () => {
        if (audio.paused) {
          wanted = true;
          play();
        } else {
          wanted = false;
          stop();
        }
        save();
      });
      (host || document.body).append(b);
      buttons.push(b);
      sync();
    }

    return {
      audio,
      mount,
      // Call synchronously inside the intro's tap handler
      start() {
        if (wanted && audio.paused) play();
      },
      autoStart() {
        if (wanted && audio.paused) play();
      },
      get playing() {
        return !audio.paused;
      },
    };
  })();

  const MUSIC_CSS = `
.music{--mfg:var(--music-fg,#33231a);--mbg:var(--music-bg,rgba(255,255,255,.72));--mline:var(--music-line,rgba(0,0,0,.14));
  width:42px;height:42px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;
  color:var(--mfg);background:var(--mbg);border:1px solid var(--mline);-webkit-tap-highlight-color:transparent;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:transform .3s cubic-bezier(.22,1,.36,1)}
.music:active{transform:scale(.92)}
.music--float{position:fixed;z-index:60;top:max(14px,env(safe-area-inset-top));left:14px}
.music__bars{position:relative;display:flex;align-items:center;gap:2.5px;height:16px}
.music__bars i{display:block;width:2.5px;height:4px;border-radius:2px;background:currentColor;transition:height .3s}
.music.is-playing .music__bars i{animation:music-eq 1s ease-in-out infinite}
.music.is-playing .music__bars i:nth-child(2){animation-delay:-.4s}
.music.is-playing .music__bars i:nth-child(3){animation-delay:-.7s}
.music.is-playing .music__bars i:nth-child(4){animation-delay:-.2s}
.music:not(.is-playing) .music__bars::after{content:"";position:absolute;left:-3px;right:-3px;top:50%;height:1.5px;background:currentColor;transform:rotate(-40deg);border-radius:2px}
@keyframes music-eq{0%,100%{height:4px}50%{height:15px}}
@media (prefers-reduced-motion:reduce){.music.is-playing .music__bars i{animation:none;height:10px}}`;

  /* ---------- Intro helpers ---------- */

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function skipIntro() {
    const q = new URLSearchParams(location.search);
    return q.has("opened") || location.hash === "#opened";
  }

  function lockScroll(on) {
    document.documentElement.classList.toggle("is-locked", on);
  }

  /* ---------- Boot ---------- */

  /* ---------- Demo pages (/namuna/<style>) ----------
     Show a back arrow to the portfolio. Only the demos built from a style's
     demo.js carry "demo: true", so guests of a real invitation never see it. */

  const DEMO_CSS = `
.demo-back{position:fixed;z-index:61;top:max(14px,env(safe-area-inset-top));left:14px;width:42px;height:42px;border-radius:50%;
  display:grid;place-items:center;color:var(--music-fg,#33231a);background:var(--music-bg,rgba(255,255,255,.72));
  border:1px solid var(--music-line,rgba(0,0,0,.14));-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  -webkit-tap-highlight-color:transparent;transition:opacity .6s ease,transform .3s cubic-bezier(.22,1,.36,1)}
.demo-back:active{transform:scale(.92)}
.demo-back svg{width:18px;height:18px}
.demo-back::after{content:"";position:absolute;inset:-6px}
html.is-demo .music--float{left:64px}
body.is-opening .demo-back,body.is-revealing .demo-back{opacity:0;pointer-events:none}`;

  function mountDemoBack() {
    if (!D.demo) return;
    document.documentElement.classList.add("is-demo");
    document.head.append(Object.assign(document.createElement("style"), { textContent: DEMO_CSS }));
    const a = document.createElement("a");
    a.className = "demo-back";
    a.href = "/ishlar";
    a.setAttribute("aria-label", "Orqaga");
    a.title = "Orqaga";
    a.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 8H3m4.5-4.5L3 8l4.5 4.5"/></svg>';
    // Came straight from the portfolio: go back in history so its scroll position is kept
    a.addEventListener("click", (e) => {
      try {
        const r = document.referrer && new URL(document.referrer);
        if (r && r.origin === location.origin && /\/ishlar(\.html)?$/.test(r.pathname) && history.length > 1) {
          e.preventDefault();
          history.back();
        }
      } catch {}
    });
    document.body.append(a);
  }

  function boot() {
    bindData();
    mountDemoBack();
    document.documentElement.lang = lang === "cyr" ? "uz-Cyrl" : "uz-Latn";
    document.documentElement.dataset.script = lang;
    apply(document.body);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    document.querySelectorAll("[data-lang-toggle]").forEach(mountLangToggle);
    document.querySelectorAll("[data-ics]").forEach((b) => b.addEventListener("click", downloadIcs));
    document.querySelectorAll("[data-href]").forEach((a) => (a.href = links[a.dataset.href] || a.href));
    document.querySelectorAll("[data-tel]").forEach((a) => (a.href = "tel:" + a.dataset.tel.replace(/\s+/g, "")));
    if (D.music && D.music.src) {
      document.head.append(Object.assign(document.createElement("style"), { textContent: MUSIC_CSS }));
      music.mount();
    }
  }

  window.Invite = {
    data: D,
    date: DATE,
    guest: GUEST,
    monthGrid,
    weekdaysShort: WEEKDAYS_SHORT,
    weekdaysShortCyr: WEEKDAYS_SHORT_CYR,
    links,
    get lang() {
      return lang;
    },
    setLang,
    onLang: (fn) => listeners.push(fn),
    tr,
    toCyrillic,
    normalizeLatin,
    apply,
    get,
    prune,
    bindData,
    countdown,
    copy,
    downloadIcs,
    mountMap,
    reveal,
    rsvp,
    reducedMotion,
    music,
    skipIntro,
    lockScroll,
    boot,
  };
})();
