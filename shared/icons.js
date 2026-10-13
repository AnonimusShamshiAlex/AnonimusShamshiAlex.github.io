/*
 * Line icons shared by all styles (24×24, stroke = currentColor).
 * InviteIcons.svg("plov", { size: 28, stroke: 1.4 })
 */
(function () {
  const P = {
    // Lagan dish with a mound of osh and steam
    plov:
      '<path d="M3 15.5h18"/><path d="M4.2 15.5c.6 2.4 3.8 3.8 7.8 3.8s7.2-1.4 7.8-3.8"/><path d="M6.2 15.5c.6-3.4 3-5.6 5.8-5.6s5.2 2.2 5.8 5.6"/><path d="M10 7.6c-.7-.7-.7-1.5 0-2.3s.7-1.6 0-2.3M14 7.6c-.7-.7-.7-1.5 0-2.3s.7-1.6 0-2.3"/>',
    rings:
      '<circle cx="9" cy="14.5" r="5"/><circle cx="15" cy="14.5" r="5"/><path d="M15 9.5 13.2 7.4l.9-1.4h1.8l.9 1.4Z"/>',
    // Karnay — long brass horn
    karnay:
      '<path d="M3.5 20.5 15.2 8.8"/><path d="M13.6 7.2l3.2 3.2"/><path d="M15.2 8.8c1-2.6 2.9-4.6 5.6-5.6-.9 2.7-3 4.6-5.6 5.6Z"/><path d="M5.6 18.4l-1.4-1.4"/>',
    couple:
      '<circle cx="8" cy="7.8" r="2.6"/><circle cx="16" cy="7.8" r="2.6"/><path d="M3.6 19.5c0-3.1 2-5.4 4.4-5.4 2.2 0 3.7 1.6 4 3.6"/><path d="M12 17.7c.3-2 1.8-3.6 4-3.6 2.4 0 4.4 2.3 4.4 5.4"/><path d="M13.4 6.2c.8-2 3.6-2.6 5.2-1"/>',
    // Choynak — teapot for the dasturxon
    feast:
      '<path d="M5.5 10.5h11v3.2a5.5 5.5 0 0 1-11 0Z"/><path d="M16.5 11.6h1.3a2 2 0 0 1 0 4h-1.8"/><path d="M5.5 12.2 3 9.6"/><path d="M8.8 10.5V9a2.2 2.2 0 0 1 4.4 0v1.5"/><path d="M11 6.8V5.6"/><path d="M4 21h14"/>',
    // Doira — frame drum with jingle rings
    music:
      '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="5.6" stroke-dasharray="0.6 2.6"/><circle cx="12" cy="3.8" r=".9"/><circle cx="20.2" cy="12" r=".9"/><circle cx="12" cy="20.2" r=".9"/><circle cx="3.8" cy="12" r=".9"/>',
    cake:
      '<path d="M4.5 20.5h15"/><path d="M6 20.5v-5.2h12v5.2"/><path d="M8 15.3v-3.6h8v3.6"/><path d="M12 11.7V9.4"/><path d="M12 9.4c-.9-.6-.9-1.7 0-2.8.9 1.1.9 2.2 0 2.8Z"/><path d="M6 17.6c1 .8 2 .8 3 0s2-.8 3 0 2 .8 3 0 2-.8 3 0"/>',
    pin: '<path d="M12 21s7-6.3 7-11.5a7 7 0 0 0-14 0C5 14.7 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    phone:
      '<path d="M5 4h3.2l1.6 4-2 1.3a10.5 10.5 0 0 0 4.9 4.9l1.3-2 4 1.6V17a2 2 0 0 1-2.2 2A15 15 0 0 1 3 6.2 2 2 0 0 1 5 4Z"/>',
    telegram: '<path d="M21 4 3 11.2l6.2 2.2L18 7l-6.6 7.6.1 5.4 3.3-3.6 4.3 3.2Z"/>',
    calendar:
      '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M10.2 14.2l1.4 1.4 2.8-2.8"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    check: '<path d="m5 12.5 4.2 4.2L19 7"/>',
    arrow: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/>',
    balloon:
      '<path d="M12 15.6c-3.3 0-5.6-3-5.6-6.4a5.6 5.6 0 0 1 11.2 0c0 3.4-2.3 6.4-5.6 6.4Z"/><path d="m10.9 17.3 1.1-1.7 1.1 1.7Z"/><path d="M12 17.3c-1.1 1.2.9 2-.1 3.4"/><path d="M9.2 7.6a3.2 3.2 0 0 1 2-2"/>',
    gift:
      '<rect x="3" y="7.2" width="18" height="3.6" rx="1"/><rect x="4.5" y="10.8" width="15" height="9.7" rx="1.2"/><path d="M12 7.2v13.3"/><path d="M12 7.2c-1.5-3.6-5.6-3.6-5.3-1.2.2 1.4 2.9 1.2 5.3 1.2Zm0 0c1.5-3.6 5.6-3.6 5.3-1.2-.2 1.4-2.9 1.2-5.3 1.2Z"/>',
    candle:
      '<rect x="9" y="10.4" width="6" height="10.1" rx="1"/><path d="M12 10.4V8.6"/><path d="M12 8.6c-1.2-.8-1.2-2.4 0-4.1 1.2 1.7 1.2 3.3 0 4.1Z"/><path d="M5.5 20.5h13"/>',
    camera:
      '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="m8.5 7 1.4-2.5h4.2L15.5 7"/><circle cx="12" cy="13.4" r="3.6"/><path d="M17.6 10h.01"/>',
    // Bezatilgan ot — the sunnat horse (a chess-knight silhouette)
    horse:
      '<path d="M6.5 20.5h12"/><path d="M8.6 20.5c0-3.6 1.7-5.3 3.4-6.7-1.9.2-3.6 1-4.9 2.4l-1.8-2.1 4.6-6.4c.7-1.6 2.3-3 4.4-3.2L15 3l1 2c2 1.4 3.1 3.8 3.1 7.2v8.3"/><circle cx="12.9" cy="8.4" r=".6"/>',
    glass:
      '<path d="M8.5 3h7l-.6 6.4a2.9 2.9 0 0 1-5.8 0Z"/><path d="M12 12.3v7.4M8.8 20.5h6.4"/><path d="M9 6.6h6"/>',
    star:
      '<path d="M11 3.5l1.9 5.6 5.6 1.9-5.6 1.9L11 18.5l-1.9-5.6L3.5 11l5.6-1.9Z"/><path d="m18.5 15.5.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6Z"/>',
    // Non — round bread with a chekich-stamped centre
    non:
      '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><path d="M12 9.6v.01M12 14.4v.01M9.6 12h.01M14.4 12h.01M12 12h.01"/>',
    // Beshik — wooden cradle with the arched handle
    cradle:
      '<path d="M4 12.5h16"/><path d="M5.2 12.5c.6 3.4 3.3 5.4 6.8 5.4s6.2-2 6.8-5.4"/><path d="M7 12.5V7.8a5 5 0 0 1 10 0v4.7"/><path d="M4.5 20.5c2.2-1.6 4.7-2.4 7.5-2.4s5.3.8 7.5 2.4"/>',
    // Varrak — a paper kite with its tail
    kite:
      '<path d="M14 3 20 9l-6 6-6-6Z"/><path d="M8 9h12M14 3v12"/><path d="M11 15c-1.2 1-1 2.4-2.3 3.1S6.4 19 5.4 21"/><path d="m8 17.6 1.2.9M6.4 19.8l1.2.5"/>',
    // Xina — a hand with a henna dot pattern
    henna:
      '<path d="M7.5 13V6.5a1.3 1.3 0 0 1 2.6 0V11V4.8a1.3 1.3 0 0 1 2.6 0V11V5.6a1.3 1.3 0 0 1 2.6 0V11.5V8a1.3 1.3 0 0 1 2.6 0v6.2c0 4-2.6 6.8-6.3 6.8-2.6 0-4.1-1.1-5.4-3.2L4.6 14c-.7-1.1.8-2.4 1.8-1.4Z"/><circle cx="12.4" cy="15.2" r="1.3"/><path d="M12.4 12.6v.01M10 15.2h.01M14.8 15.2h.01"/>',
  };

  function svg(name, { size = 24, stroke = 1.5, cls = "" } = {}) {
    return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;
  }

  window.InviteIcons = { svg, names: Object.keys(P) };
})();
