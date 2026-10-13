/*
 * Film openings, shared by the video styles.
 *
 * The pattern: a poster (exactly the film's first frame) shows while the page
 * loads. On tap, the opening film plays with music; near its end the intro
 * dissolves into the hero, whose looping "living painting" is already moving
 * underneath. Styles provide the markup and decide what happens on reveal.
 *
 *   Film.opening({
 *     intro: "#intro",          // fixed full-screen layer, removed when done
 *     frame: "#introFrame",     // box the film covers (gets --sx/--sy/--sr)
 *     film: "#openVid",         // <video muted playsinline preload="auto" poster=…>
 *     poster: "media/open-poster.jpg",
 *     hero: "#hero",            // gets .is-in on reveal (and on ?opened)
 *     ambient: "#ambVid",       // looping hero video (preload="none"); loaded on tap
 *     hotspot: { x: .5, y: .5, r: .2 },  // where to point the tap, in film-frame fractions
 *     dissolveAt: 5.3,          // second of the film where the dissolve starts
 *     dissolveMs: 2000,         // must match the CSS transition on body.is-revealing .intro
 *     filmSize: [720, 1280],
 *   });
 *   Film.watch("#closeVid", { lazy: true });   // play only while on screen
 *
 * Body classes: is-intro → is-opening (tapped) → is-revealing (dissolve) → is-open.
 * The intro gets .is-ready once the poster is on hand, .is-pressed on pointerdown.
 */
(() => {
  const $ = (s) => (typeof s === "string" ? document.querySelector(s) : s);
  const body = document.body;

  function play(v) {
    if (!v) return;
    if (v.preload === "none") v.preload = "auto";
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }

  function watch(sel, { lazy = false } = {}) {
    const v = $(sel);
    if (!v) return;
    const load = () => {
      if (lazy && !v.getAttribute("src") && v.dataset.src) v.src = v.dataset.src;
    };
    if (!("IntersectionObserver" in window)) {
      load();
      return play(v);
    }
    new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          load();
          if (!body.classList.contains("is-intro")) play(v);
        } else if (!v.paused) v.pause();
      },
      { rootMargin: lazy ? "600px 0px" : "0px" }
    ).observe(v);
  }

  function opening(o) {
    const intro = $(o.intro);
    const frame = $(o.frame);
    const film = $(o.film);
    const hero = $(o.hero);
    const ambient = $(o.ambient);
    const [FW, FH] = o.filmSize || [720, 1280];
    const hs = o.hotspot || { x: 0.5, y: 0.5, r: 0.2 };
    const dissolveAt = o.dissolveAt ?? 5;
    const dissolveMs = o.dissolveMs ?? 2000;
    let state = "idle";
    let safety = 0;

    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    // ?opened (or a returning link): straight to the painting
    if (Invite.skipIntro()) {
      state = "done";
      intro && intro.remove();
      body.classList.remove("is-intro");
      body.classList.add("is-open");
      hero && hero.classList.add("is-in");
      play(ambient);
      Invite.music.autoStart();
      // Low Power Mode blocks muted autoplay until the first touch
      addEventListener("pointerdown", () => play(ambient), { once: true });
      o.onReveal && o.onReveal();
      return;
    }

    scrollTo(0, 0);
    Invite.lockScroll(true);

    // Keep the hint glued to the hotspot for any screen shape (object-fit: cover math)
    const place = () => {
      const fw = frame.clientWidth;
      const fh = frame.clientHeight;
      const s = Math.max(fw / FW, fh / FH);
      frame.style.setProperty("--sx", fw / 2 + (hs.x * FW - FW / 2) * s + "px");
      frame.style.setProperty("--sy", fh / 2 + (hs.y * FH - FH / 2) * s + "px");
      frame.style.setProperty("--sr", hs.r * FW * s + "px");
    };
    place();
    let t;
    addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(place, 120);
    });

    film.load();
    const ready = () => intro.classList.add("is-ready");
    const img = new Image();
    img.onload = img.onerror = ready;
    img.src = o.poster || film.getAttribute("poster");
    setTimeout(ready, 1500);

    function finish() {
      state = "done";
      intro.remove();
      film.removeAttribute("src");
      film.load(); // free the decoder
      body.classList.remove("is-intro", "is-opening", "is-revealing");
      body.classList.add("is-open");
      Invite.lockScroll(false);
      o.onDone && o.onDone();
    }

    function reveal() {
      if (state === "revealing" || state === "done") return;
      state = "revealing";
      clearTimeout(safety);
      body.classList.add("is-revealing");
      hero && hero.classList.add("is-in");
      play(ambient);
      o.onReveal && o.onReveal();
      setTimeout(finish, dissolveMs + 100);
    }

    function open() {
      if (state !== "idle") return;
      state = "opening";
      Invite.music.start(); // must stay inside the tap for sound to be allowed
      body.classList.add("is-opening");
      if (navigator.vibrate) navigator.vibrate(8);
      const p = film.play();
      // The painting loads only now, so before the tap the film gets all the bandwidth
      play(ambient);
      if (p && p.catch) p.catch(() => reveal()); // film can't play → dissolve straight away
      const tick = () => {
        if (state !== "opening") return;
        if (film.currentTime >= dissolveAt || film.ended) reveal();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      film.addEventListener("ended", reveal, { once: true });
      safety = setTimeout(reveal, 15000); // slow network: never strand a guest
      o.onOpen && o.onOpen();
    }

    // Visual answer on touch; the film itself starts on click, which every
    // phone accepts as permission for sound
    intro.addEventListener("pointerdown", () => intro.classList.add("is-pressed"));
    intro.addEventListener("click", open);
    intro.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
    intro.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  window.Film = { opening, watch, play };
})();
