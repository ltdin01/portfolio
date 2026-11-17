/* Jay Chandak — portfolio. Progressive enhancement only: the page reads fine without this. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------------------------------------------------------------
     Mumbai clock — tells a visitor what time it is where I am,
     and so roughly when to expect a reply.
     --------------------------------------------------------------- */
  const clock = $('[data-clock]');
  const status = $('[data-status]');
  const timeFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const hourFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false,
  });

  function statusFor(h) {
    if (h >= 1 && h < 7) return 'Asleep, most likely. I’ll reply in the morning.';
    if (h >= 7 && h < 10) return 'Commuting, coffee, or both.';
    if (h >= 10 && h < 18) return 'In class or in an editor.';
    if (h >= 18 && h < 22) return 'Probably building something.';
    return 'Still up, probably debugging.';
  }

  function tick() {
    const now = new Date();
    if (clock) {
      clock.textContent = timeFmt.format(now);
      clock.dateTime = now.toISOString();
    }
    if (status) status.textContent = statusFor(Number(hourFmt.format(now)) % 24);
  }
  tick();
  // Re-align to the top of each minute.
  setTimeout(() => { tick(); setInterval(tick, 60_000); }, (60 - new Date().getSeconds()) * 1000);

  /* ---------------------------------------------------------------
     Route bar — section stations double as the progress indicator.
     --------------------------------------------------------------- */
  const route = $('.route');
  const stops = $$('.route__stop');
  const sections = stops.map((a) => document.getElementById(a.hash.slice(1)));
  const dots = stops.map((a) => $('.route__dot', a));

  let centres = [];
  function measure() {
    if (!route) return;
    const r = route.getBoundingClientRect();
    centres = dots.map((d) => {
      const b = d.getBoundingClientRect();
      return b.left + b.width / 2 - r.left;
    });
    route.style.setProperty('--track-left', `${centres[0]}px`);
    route.style.setProperty('--track-width', `${centres[centres.length - 1] - centres[0]}px`);
  }

  let ticking = false;
  function update() {
    ticking = false;
    const probe = window.scrollY + window.innerHeight * 0.35;
    const tops = sections.map((s) => s.getBoundingClientRect().top + window.scrollY);
    const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

    let i = 0;
    while (i < tops.length - 1 && probe >= tops[i + 1]) i++;
    let frac = 0;
    if (atEnd) { i = tops.length - 1; }
    else if (i < tops.length - 1) {
      frac = Math.min(1, Math.max(0, (probe - tops[i]) / (tops[i + 1] - tops[i])));
    }

    // Convert "station i + fraction" into a position along the real track.
    const span = centres[centres.length - 1] - centres[0] || 1;
    const x = i < centres.length - 1
      ? centres[i] + (centres[i + 1] - centres[i]) * frac
      : centres[centres.length - 1];
    route.style.setProperty('--progress', ((x - centres[0]) / span).toFixed(4));

    stops.forEach((a, n) => {
      a.classList.toggle('is-passed', n < i);
      if (n === i) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  const requestUpdate = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };

  if (route && sections.every(Boolean)) {
    measure();
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', () => { measure(); requestUpdate(); });
    document.fonts && document.fonts.ready.then(() => { measure(); requestUpdate(); });
    // Opening a service changes the page height.
    document.addEventListener('toggle', requestUpdate, true);
  }

  /* ---------------------------------------------------------------
     Departures — filter by line. Rows dim rather than disappear,
     so the board keeps its shape and nothing jumps.
     --------------------------------------------------------------- */
  const lineBar = $('.lines');
  const services = $$('.svc');
  const count = $('.lines__count');
  const lineNames = { all: 'all lines', ai: 'the AI / ML line', be: 'the Backend line', ui: 'the Interface line', da: 'the Data line' };

  if (lineBar && services.length) {
    lineBar.hidden = false;
    const buttons = $$('.lines__btn', lineBar);

    function setLine(line) {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.line === line)));
      let shown = 0;
      services.forEach((svc) => {
        const on = line === 'all' || svc.dataset.lines.split(' ').includes(line);
        svc.classList.toggle('is-dim', !on);
        if (on) shown++;
      });
      count.textContent = line === 'all'
        ? `${services.length} services`
        : `${shown} of ${services.length} services call at ${lineNames[line]}`;
    }

    lineBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.lines__btn');
      if (btn) setLine(btn.dataset.line);
    });
    setLine('all');
  }

  /* ---------------------------------------------------------------
     Deep links — /#stockpulse opens that service; opening one
     updates the address so it can be shared.
     --------------------------------------------------------------- */
  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (target && target.matches('details.svc')) {
      target.open = true;
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  services.forEach((svc) => {
    svc.addEventListener('toggle', () => {
      if (svc.open) history.replaceState(null, '', `#${svc.id}`);
      else if (location.hash === `#${svc.id}`) history.replaceState(null, '', '#departures');
    });
  });

  /* ---------------------------------------------------------------
     Ticket — copy the address; the conductor punches the stub.
     --------------------------------------------------------------- */
  const copyBtn = $('.ticket__copy');
  const feedback = $('.ticket__feedback');
  const ticket = $('.ticket');
  if (copyBtn && navigator.clipboard) {
    copyBtn.hidden = false;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.copy);
        feedback.textContent = 'Copied. See you on the platform.';
        copyBtn.textContent = 'Copied';
        ticket.classList.add('is-punched');
        setTimeout(() => { copyBtn.textContent = 'Copy address'; }, 2400);
      } catch {
        feedback.textContent = 'Couldn’t reach the clipboard — the address above is selectable.';
      }
    });
  }

  /* Print: unfold every service so the paper copy is complete. */
  window.addEventListener('beforeprint', () => services.forEach((s) => { s.dataset.wasOpen = s.open; s.open = true; }));
  window.addEventListener('afterprint', () => services.forEach((s) => { s.open = s.dataset.wasOpen === 'true'; }));
})();
