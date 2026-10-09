// "Download the app" on the home page: ask for a US number, then POST it to
// /public/waitlist, which texts an invite. Same endpoint as web.js's dialog.
(function () {
  'use strict';
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
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
    dim.id = 'invite-dim';
    dim.innerHTML = '<form class="dlg" role="dialog" aria-modal="true" aria-labelledby="inv-h" novalidate>' +
      '<h2 id="inv-h">Get the app</h2>' +
      '<p>Enter your number and we\'ll text you an invite.</p>' +
      '<div class="field"><label for="inv-phone">Phone number</label><div class="in" id="inv-box"><span class="cc">+1</span>' +
      '<input id="inv-phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(201) 555-0148"></div><span class="errt" id="inv-err" hidden>Enter a 10-digit US number.</span></div>' +
      '<button type="submit" class="btn btn-y" id="inv-submit">Text me an invite</button>' +
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
          if (r.status === 400) { btn.disabled = false; btn.textContent = 'Text me an invite'; return bad(); }
          if (!r.ok) throw new Error('failed');
          dim.querySelector('form').innerHTML = '<div class="done-ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
            '<h2 class="center">Check your texts</h2><p class="center">We\'re texting your invite to ' + esc(formatPhone(digits)) + '.</p>' +
            '<button type="button" class="btn btn-o" id="inv-close">Done</button>';
          document.getElementById('inv-close').addEventListener('click', closeDialog);
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = 'Text me an invite';
          document.getElementById('inv-err').textContent = "That didn't go through. Try again.";
          document.getElementById('inv-err').hidden = false;
        });
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-invite]');
    if (t) { e.preventDefault(); openDialog(); }
  });
})();
