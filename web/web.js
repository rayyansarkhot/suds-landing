// web-place-pages: renders explore-elsewhere.com place pages, city hubs and
// temporary share links from /public/web/... JSON over the server-rendered
// fallback in #app, and runs the Request-an-invite dialog on every page.
(function () {
  'use strict';
  var VERDICT = ['Not for me', 'Fine', 'Felt alive'];
  var body = document.body;
  var app = document.getElementById('app');
  var kind = body.getAttribute('data-kind');
  var src = body.getAttribute('data-src');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var STAR = '<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z" fill="currentColor"/>';
  function stars(v, size) {
    var h = '<span class="stars" style="--s:' + size + 'px" aria-hidden="true">';
    for (var i = 0; i < 5; i++) {
      var f = Math.max(0, Math.min(1, v - i));
      h += '<span class="star"><svg class="o" viewBox="0 0 24 24">' + STAR + '</svg><span class="clip" style="width:' + (f * 100) + '%"><svg class="f" viewBox="0 0 24 24">' + STAR + '</svg></span></span>';
    }
    return h + '</span>';
  }
  function tl(v) { return '<span class="tl" data-v="' + v + '" aria-label="' + esc(VERDICT[v] || '') + '"><i></i><i></i><i></i></span>'; }
  function bg(url) { return url ? ' style="background-image:url(&quot;' + esc(url) + '&quot;)"' : ''; }
  function phCls(url) { return url ? 'ph' : 'ph ph-none'; }
  function reviews(n) { return n + ' review' + (n === 1 ? '' : 's'); }
  function fmtDate(iso) {
    var d = new Date(iso);
    var opts = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('en-US', opts);
  }
  var CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  function inviteCard(photo, title, text) {
    return '<div class="invite ' + phCls(photo) + '"' + bg(photo) + '><div class="glass"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><button type="button" class="btn btn-y" data-invite>Request an invite</button></div></div>';
  }

  function noteCard(n) {
    return '<div class="note"><div class="top"><span class="who">' + esc(n.firstName) + '</span>' + tl(n.verdict) +
      '<span class="vlbl">' + esc(VERDICT[n.verdict] || '') + '</span><span class="when">' + esc(fmtDate(n.date)) + '</span></div><p>' + esc(n.note) + '</p></div>';
  }

  // ── Place page (also the share page) ────────────────────────────────────
  function renderPlace(d) {
    var p = d.place;
    var hero = d.photos[0] ? d.photos[0].full : null;
    var crumbs = p.cityKey
      ? '<nav class="crumbs"><a href="/cities/' + esc(p.cityKey) + '">' + esc(p.city) + '</a>' +
        (p.category ? '<span class="sep">/</span><a href="/cities/' + esc(p.cityKey) + '/' + esc(p.category) + '">' + esc(p.categoryLabel) + '</a>' : '') +
        '<span class="sep">/</span><span>' + esc(p.name) + '</span></nav>'
      : '';
    var where = p.city ? p.typeLabel + ' in ' + p.city + (p.state ? ', ' + p.state : '') : p.typeLabel;

    var shared = '';
    if (d.shared) {
      var s = d.shared;
      var left = Math.max(1, Math.round((new Date(s.expiresAt) - Date.now()) / 3600000));
      var sp = s.photos[0] ? s.photos[0].full : hero;
      shared = '<section class="shared ' + phCls(sp) + '"' + bg(sp) + '><div class="glass">' +
        '<div class="top"><span>Shared by <b>' + esc(s.firstName) + '</b></span>' + (s.verdict >= 0 ? tl(s.verdict) : '') +
        '<span class="exp">' + CLOCK + left + 'h left</span></div>' +
        (s.photos.length ? '<div class="pics">' + s.photos.map(function (ph) { return '<div class="ph"' + bg(ph.full) + '></div>'; }).join('') + '</div>' : '') +
        (s.note ? '<p>' + esc(s.note) + '</p>' : '') +
        '</div></section>';
    }

    var score = d.score
      ? '<div><h2 class="sec-h">Score</h2><div class="score"><div class="num">' + d.score.stars.toFixed(1) + '</div><div>' + stars(d.score.stars, 20) +
        '<div class="sub">From ' + reviews(d.score.count).replace('review', 'public review') + ' on Elsewhere</div></div></div></div>'
      : '';
    var gal = '';
    if (d.photos.length) {
      var shown = d.photos.slice(0, 10);
      gal = '<div><h2 class="sec-h">Photos</h2><div class="gal">' + shown.map(function (ph) {
        return '<a class="ph" href="' + esc(ph.full) + '" target="_blank" rel="noopener"' + bg(ph.thumb) + ' aria-label="Open photo"></a>';
      }).join('') + '</div></div>';
    }
    var notes = '';
    if (d.notes.length) {
      notes = '<div><h2 class="sec-h">What people say</h2><div class="notes" id="notes">' + d.notes.slice(0, 4).map(noteCard).join('') + '</div>' +
        (d.notes.length > 4 ? '<button type="button" class="linkrow" id="more-notes" style="margin-top:10px">Show all ' + d.notes.length + ' reviews</button>' : '') + '</div>';
    }
    var info = '<div class="infocard">' +
      (p.address ? '<div><div style="font-weight:600">' + esc(p.address) + '</div></div>' : '') +
      '<div class="acts"><a class="btn btn-k" href="' + esc(p.directionsUrl) + '" target="_blank" rel="noopener">Directions</a>' +
      (p.website ? '<a class="btn btn-o" href="' + esc(p.website) + '" target="_blank" rel="noopener nofollow">Website</a>' : '') + '</div></div>';
    var more = '';
    if (d.more.length && p.cityKey) {
      more = '<div class="infocard"><h2 class="sec-h" style="margin:0">More in ' + esc(p.city) + '</h2><div>' + d.more.map(function (m) {
        return '<a class="mini" href="/places/' + esc(m.slug) + '"><div class="' + phCls(m.thumb) + '"' + bg(m.thumb) + '></div><div><div class="t">' + esc(m.name) + '</div><div class="s">' + esc(m.categoryLabel || reviews(m.count)) + '</div></div><span class="r">' + m.stars.toFixed(1) + '</span></a>';
      }).join('') + '</div><a class="linkrow" href="/cities/' + esc(p.cityKey) + '">See the best spots in ' + esc(p.city) + '</a></div>';
    }
    var invite = d.notes.length || d.score
      ? inviteCard(hero, 'See where your friends go' + (p.city ? ' in ' + p.city : ''), "Elsewhere is invite-only. Leave your number and we'll text you an invite.")
      : inviteCard(hero, 'Been here?', 'Elsewhere is invite-only. Request an invite to add your own review.');

    app.className = 'wrap';
    app.innerHTML = crumbs + shared +
      '<div class="hero ' + phCls(hero) + '"' + bg(hero) + '><div class="scrim"></div><div class="id"><h1>' + esc(p.name) + '</h1><div class="meta">' + esc(where) + '</div></div></div>' +
      '<div class="grid"><div class="main">' + score + gal + notes + '</div><aside class="side">' + info + invite + more + '</aside></div>';

    var btn = document.getElementById('more-notes');
    if (btn) btn.addEventListener('click', function () {
      document.getElementById('notes').innerHTML = d.notes.map(noteCard).join('');
      btn.remove();
    });
  }

  // ── Hub ─────────────────────────────────────────────────────────────────
  function renderHub(d) {
    var city = d.city;
    var title = esc(d.title).replace(esc(city.name), '<span class="u">' + esc(city.name) + '</span>');
    var chips = '<a class="chip' + (d.category ? '' : ' on') + '" href="/cities/' + esc(city.key) + '">All</a>' +
      d.categories.map(function (c) {
        return '<a class="chip' + (d.category && d.category.key === c.key ? ' on' : '') + '" href="/cities/' + esc(city.key) + '/' + esc(c.key) + '">' + esc(c.label) + '</a>';
      }).join('');
    var list = d.places.map(function (p) {
      return '<li><a class="ri" href="/places/' + esc(p.slug) + '"><div class="' + phCls(p.thumb) + '"' + bg(p.thumb) + '></div><div>' +
        '<div class="t">' + esc(p.name) + '</div>' + (p.categoryLabel ? '<span class="c">' + esc(p.categoryLabel) + '</span>' : '') +
        '<div class="sc"><span class="cnt">' + reviews(p.count) + '</span>' + stars(p.stars, 12) + '<b>' + p.stars.toFixed(1) + '</b></div>' +
        (p.quote ? '<div class="q">"' + esc(p.quote.text.length > 140 ? p.quote.text.slice(0, 140) + '…' : p.quote.text) + '" ' + esc(p.quote.firstName) + '</div>' : '') +
        '</div></a></li>';
    }).join('');
    var nearby = d.nearby.length
      ? '<div class="nearby"><h2 class="sec-h" style="margin:0">Nearby</h2><div class="cities">' + d.nearby.map(function (c) {
        return '<a class="chip" href="/cities/' + esc(c.key) + '">' + esc(c.name) + '</a>';
      }).join('') + '</div></div>'
      : '';
    var crumbs = d.category ? '<nav class="crumbs"><a href="/cities/' + esc(city.key) + '">' + esc(city.name) + '</a></nav>' : '';
    app.className = 'wrap';
    app.innerHTML = '<div class="hub-h">' + crumbs + '<h1>' + title + '</h1><p>Ranked by how many people went and how they rated it.</p></div>' +
      '<div class="chips">' + chips + '</div><ol class="rank">' + list + '</ol>' + nearby +
      '<div class="hub-invite">' + inviteCard(d.places[0] && d.places[0].thumb, 'Know a spot that should be here?', 'Elsewhere is invite-only. Request an invite to start logging.') + '</div>';
  }

  // ── Loading / error ─────────────────────────────────────────────────────
  var ssrHtml = app ? app.innerHTML : '';
  function showError() {
    app.className = 'wrap';
    app.innerHTML = '<div class="retry"><p>This page didn\'t load. Check your connection and try again.</p><button type="button" class="btn btn-k" id="retry">Try again</button></div>';
    document.getElementById('retry').addEventListener('click', load);
  }
  function load() {
    if (!src) return;
    fetch(src, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        var d = res.body;
        if (d.kind === 'place') renderPlace(d);
        else if (d.kind === 'hub') renderHub(d);
        else { app.innerHTML = ssrHtml; } // gone/expired: keep the server-rendered state
      })
      .catch(function () { if (!app.innerHTML.trim() || app.querySelector('.retry')) showError(); });
  }

  // ── Request an invite ───────────────────────────────────────────────────
  function closeDialog() {
    var d = document.getElementById('invite-dim');
    if (d) d.remove();
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') closeDialog(); }
  function formatPhone(digits) {
    var d = digits.slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
    return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
  }
  function openDialog() {
    closeDialog();
    var dim = document.createElement('div');
    dim.className = 'dim';
    dim.id = 'invite-dim';
    dim.innerHTML = '<form class="dlg" role="dialog" aria-modal="true" aria-labelledby="inv-h" novalidate>' +
      '<h2 id="inv-h">Request an invite</h2>' +
      '<p>Elsewhere is invite-only for now. Leave your number and we\'ll text you when your invite is ready.</p>' +
      '<div class="field"><label for="inv-phone">Phone number</label><div class="in" id="inv-box"><span class="cc">+1</span>' +
      '<input id="inv-phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(201) 555-0148"></div><span class="errt" id="inv-err" hidden>Enter a 10-digit US number.</span></div>' +
      '<button type="submit" class="btn btn-y" id="inv-submit">Request invite</button>' +
      '<div class="fine">US numbers only. We only text you about your invite.</div></form>';
    document.body.appendChild(dim);
    document.addEventListener('keydown', onKey);
    dim.addEventListener('click', function (e) { if (e.target === dim) closeDialog(); });
    var input = document.getElementById('inv-phone');
    input.focus();
    input.addEventListener('input', function () {
      var digits = input.value.replace(/\D/g, '');
      if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
      input.value = formatPhone(digits);
      document.getElementById('inv-box').classList.remove('bad');
      document.getElementById('inv-err').hidden = true;
    });
    dim.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var digits = input.value.replace(/\D/g, '');
      var bad = function () { document.getElementById('inv-box').classList.add('bad'); document.getElementById('inv-err').hidden = false; };
      if (digits.length !== 10 || digits[0] === '0' || digits[0] === '1') return bad();
      var btn = document.getElementById('inv-submit');
      btn.disabled = true; btn.textContent = 'Sending…';
      fetch('/public/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: digits, path: location.pathname }) })
        .then(function (r) {
          if (r.status === 400) { btn.disabled = false; btn.textContent = 'Request invite'; return bad(); }
          if (!r.ok) throw new Error('failed');
          dim.querySelector('form').innerHTML = '<div class="done-ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
            '<h2 class="center">Request received</h2><p class="center">We\'ll text ' + esc(formatPhone(digits)) + ' when your invite is ready.</p>' +
            '<button type="button" class="btn btn-o" id="inv-close">Keep browsing</button>';
          document.getElementById('inv-close').addEventListener('click', closeDialog);
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = 'Request invite';
          document.getElementById('inv-err').textContent = "That didn't go through. Try again.";
          document.getElementById('inv-err').hidden = false;
        });
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-invite]');
    if (t) { e.preventDefault(); openDialog(); }
  });

  if (kind === 'place' || kind === 'hub' || kind === 'share') load();
})();
