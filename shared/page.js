/*
 * The parts every style's page shares: hosts, program, calendar, toʻyona
 * cards, RSVP, countdown, map, scroll reveals and the film opening. A style
 * passes only what makes it look like itself:
 *
 *   Page.start({
 *     icons: { stroke: 1.5 },               // [data-icon] buttons
 *     timeline: { stroke: 1.3, item },      // item(a, i, iconSvg) → custom <li>
 *     card: { owner: "gift__owner", copy: 16, extra: "" },
 *     hosts: { sep: "" },                   // html between two host columns
 *     pin: () => element,                   // map marker
 *     map: { zoom: 14.8, palette: {…} },
 *     film: { hotspot, dissolveAt, dissolveMs },
 *     fit: ".name",                         // shrink these to one line when too long
 *     before() {},                          // runs before Invite.boot()
 *     onLang(lang) {},
 *   });
 *
 * Markup it looks for (any of it may be missing; data-if removes empty parts):
 *   [data-hosts] #timeline #details #cards #cardDots #cal #countdown #rsvpForm #reply
 *   #map #intro #introFrame #openVid #hero #ambVid #closeVid
 *
 * An order can move the tap target and the dissolve with "film" in its data,
 * for when its opening film was regenerated (Maktub's seal with initials).
 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // "Kuyovning ota-onasi": a non-breaking hyphen keeps "ota-onasi" on one line
  function renderHosts(o = {}) {
    const el = $("[data-hosts]");
    const hosts = Invite.data.hosts || [];
    if (!el || !hosts.length) return;
    el.classList.toggle("parents--one", hosts.length === 1);
    el.innerHTML = hosts
      .map(
        (h) => `
        <div class="parents__col">
          ${h.label ? `<span class="label">${esc(h.label).replace(/-/g, "\u2011")}</span>` : ""}
          <span class="parents__names">${esc(h.names)}</span>
        </div>`
      )
      .join(o.sep || "");
  }

  function renderTimeline(o = {}) {
    const el = $("#timeline");
    if (!el) return;
    const icon = (a) => InviteIcons.svg(a.icon || "heart", { stroke: o.stroke || 1.3 });
    el.innerHTML = Invite.data.agenda
      .map((a, i) =>
        o.item
          ? o.item(a, i, icon(a), esc)
          : `
        <li class="tl" data-reveal>
          <div class="tl__time" data-no-tr>${esc(a.time)}</div>
          <span class="tl__ico">${icon(a)}</span>
          <div class="tl__body">
            <div class="tl__title">${esc(a.title)}</div>
            ${a.note ? `<div class="tl__note">${esc(a.note)}</div>` : ""}
          </div>
        </li>`
      )
      .join("");
  }

  // Practical notes: dress code, parking, "children welcome"…
  function renderDetails() {
    const el = $("#details");
    if (!el) return;
    el.innerHTML = (Invite.data.details || [])
      .map(
        (d) => `
        <div class="detail" data-reveal>
          <span class="detail__ico">${InviteIcons.svg(d.icon || "star", { stroke: 1.4 })}</span>
          <div>
            <div class="detail__title">${esc(d.title)}</div>
            ${d.text ? `<div class="detail__text">${esc(d.text)}</div>` : ""}
          </div>
        </div>`
      )
      .join("");
  }

  function renderCards(o = {}) {
    const wrap = $("#cards");
    const dots = $("#cardDots");
    if (!wrap) return;
    const cards = Invite.data.gifts.cards;
    wrap.innerHTML = cards
      .map(
        (c) => `
        <div class="gift">
          ${c.owner ? `<span class="${o.owner || "gift__owner"}">${esc(c.owner)}</span>` : ""}
          <div class="ccard ccard--${esc(c.system.toLowerCase())}">
            ${o.extra || ""}
            <div class="ccard__top"><span class="ccard__chip"></span><span class="ccard__sys" data-no-tr>${esc(c.system)}</span></div>
            <div class="ccard__num" data-no-tr>${esc(c.number)}</div>
            <div class="ccard__bottom">
              <span class="ccard__holder" data-no-tr>${esc(c.holder)}</span>
              <span class="ccard__bank">${esc(c.bank || "")}</span>
            </div>
          </div>
          <button class="copy" type="button" data-number="${esc(c.number)}">
            ${InviteIcons.svg("copy", { size: o.copy || 16 })}<span data-copy-label>Raqamni nusxalash</span>
          </button>
        </div>`
      )
      .join("");

    wrap.addEventListener("click", (e) => {
      const b = e.target.closest(".copy");
      if (b) Invite.copy(b.dataset.number, b);
    });

    if (!dots) return;
    // One card needs no dots
    dots.innerHTML = cards.length > 1 ? cards.map(() => "<span></span>").join("") : "";
    const items = [...wrap.children];
    const sync = () => {
      const mid = wrap.scrollLeft + wrap.clientWidth / 2;
      let best = 0;
      items.forEach((it, i) => {
        const d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - mid);
        if (d < Math.abs(items[best].offsetLeft + items[best].offsetWidth / 2 - mid)) best = i;
      });
      [...dots.children].forEach((d, i) => d.classList.toggle("is-on", i === best));
    };
    wrap.addEventListener("scroll", () => requestAnimationFrame(sync), { passive: true });
    sync();
  }

  function renderCalendar() {
    const el = $("#cal");
    if (!el) return;
    const day = Number(Invite.date.day);
    let html = Invite.weekdaysShort.map((w, i) => `<span class="cal__wd" data-cyr="${Invite.weekdaysShortCyr[i]}">${w}</span>`).join("");
    for (const week of Invite.monthGrid()) {
      for (const d of week) {
        html += d === day ? `<span class="cal__d is-day" data-no-tr><span>${d}</span></span>` : `<span class="cal__d" data-no-tr>${d ?? ""}</span>`;
      }
    }
    el.innerHTML = html;
  }

  function setupRsvp() {
    const form = $("#rsvpForm");
    if (!form) {
      // Without the form, Telegram is how guests answer: make it the main button
      const tg = $(".tg");
      if (tg) {
        tg.className = "btn btn--solid tg--solo";
        // the Telegram icon says where; the full phrase wraps on a button
        tg.lastElementChild.textContent = "Javob berish";
      }
      return;
    }
    const input = $(".stepper input", form);
    $(".stepper", form)?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-step]");
      if (b) input.value = Math.min(10, Math.max(1, Number(input.value || 1) + Number(b.dataset.step)));
    });
    Invite.rsvp(form);
    form.addEventListener("rsvp:sent", () => $("#reply")?.classList.add("is-sent"));
  }

  function renderIcons(o = {}) {
    $$("[data-icon]").forEach((el) => {
      if (!el.firstChild) el.innerHTML = InviteIcons.svg(el.dataset.icon, { stroke: o.stroke || 1.5 });
    });
  }

  // Big names stay on one line: a long one (Muhammadali) shrinks to fit
  function fit(sel, min = 0.5) {
    const els = $$(sel);
    if (!els.length) return;
    const run = () =>
      els.forEach((el) => {
        el.style.fontSize = "";
        const box = el.parentElement;
        const cs = getComputedStyle(box);
        const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        // the text's own width: a centred block never reports its overflow
        const range = document.createRange();
        range.selectNodeContents(el);
        const w = range.getBoundingClientRect().width;
        if (w > avail) el.style.fontSize = parseFloat(getComputedStyle(el).fontSize) * Math.max(min, (avail / w) * 0.96) + "px";
      });
    run();
    if (document.fonts) document.fonts.ready.then(run);
    let t;
    addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(run, 150);
    });
    Invite.onLang(() => requestAnimationFrame(run));
  }

  function start(o = {}) {
    Invite.prune();
    renderHosts(o.hosts);
    renderTimeline(o.timeline);
    renderDetails();
    renderCards(o.card);
    renderCalendar();
    setupRsvp();
    o.before && o.before();
    Invite.boot();
    renderIcons(o.icons);
    if (o.onLang) Invite.onLang(o.onLang);
    if (o.fit) fit(o.fit);

    Invite.countdown($("#countdown"));
    if ($("#map")) Invite.mountMap($("#map"), { marker: o.pin, zoom: 14.8, ...o.map });
    Invite.reveal();

    Film.watch("#ambVid");
    Film.watch("#closeVid", { lazy: true });
    Film.opening({
      intro: "#intro",
      frame: "#introFrame",
      film: "#openVid",
      hero: "#hero",
      ambient: "#ambVid",
      ...o.film,
      ...Invite.data.film,
    });
  }

  window.Page = { start, fit, esc };
})();
