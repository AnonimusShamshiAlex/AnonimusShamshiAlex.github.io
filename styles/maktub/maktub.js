/*
 * Maktub — the opening is a filmed envelope (media/open.mp4) whose first
 * frame is the poster, so the tap brings a still photo to life with no jump.
 * Near the end of the film the envelope is all light; it dissolves into the
 * hero, which is a looping "living painting" (media/amb.mp4).
 *
 * The seal carries the couple's initials, so each order regenerates
 * open.mp4, open-poster.jpg and seal.webp into its own media/ folder.
 */
(() => {
  const esc = Page.esc;

  // A small wax-drop pin with the couple's initials (or the one person's)
  function mapPin() {
    const el = document.createElement("div");
    el.className = "pin";
    const mono = Invite.data.initials.map(esc).join("&amp;");
    el.innerHTML = `
      <svg viewBox="0 0 42 54" aria-hidden="true">
        <defs><radialGradient id="pinwax" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#b8343b"/><stop offset=".6" stop-color="#8e1b24"/><stop offset="1" stop-color="#5e0f16"/></radialGradient></defs>
        <path d="M21 53C21 53 3 33.5 3 21a18 18 0 0 1 36 0c0 12.5-18 32-18 32z" fill="url(#pinwax)"/>
        <circle cx="21" cy="21" r="12.5" fill="none" stroke="#e8c48c" stroke-width=".9" opacity=".85"/>
        <text x="21" y="25.5" text-anchor="middle" font-family="Great Vibes, cursive" font-size="13" fill="#f3dcae">${mono}</text>
      </svg>`;
    return el;
  }

  Page.start({
    icons: { stroke: 1.5 },
    timeline: { stroke: 1.3 },
    card: { owner: "gift__owner", copy: 16 },
    pin: mapPin,
    map: {
      palette: {
        land: "#f3ecdf",
        landuse: "#ece3d2",
        water: "#cfe0dc",
        park: "#e2e6d2",
        road: "#fffaf0",
        roadMajor: "#ecd9b8",
        roadCasing: "#e3d4bd",
        building: "#e8dcc8",
        label: "#7a6753",
        labelHalo: "#f3ecdf",
      },
    },
    // Where the seal sits in the film (fractions of the 720×1280 frame), and
    // the second when the envelope is mostly light
    film: { hotspot: { x: 0.51, y: 0.492, r: 0.205 }, dissolveAt: 5.3, dissolveMs: 1900 },
  });
})();
