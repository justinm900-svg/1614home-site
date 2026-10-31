/* 1614 Home Co. request forms. Posts to Web3Forms, then sends the visitor to /thanks.html.
   Without JavaScript the form still posts normally and Web3Forms redirects to thanks.html. */
(function () {
  var params = new URLSearchParams(window.location.search);
  function val(form, name) { var el = form.elements[name]; return el && el.value ? el.value.trim() : ''; }

  document.querySelectorAll('form.hc-form[data-w3]').forEach(function (form) {
    // Source tag (?src=mailer, ?utm_source=...) so Justin knows where the lead came from.
    var src = form.elements['Source'];
    if (src) {
      var dflt = form.getAttribute('data-src-default') || 'web';
      var s = params.get('src') || params.get('utm_source');
      src.value = s ? (form.getAttribute('data-kind') === 'freeze' && !params.get('src') ? s + '_freeze' : s) : dflt;
    }
    // Show "where did you hear" detail only when relevant
    var heardOther = form.querySelector('[data-show-when]');
    if (heardOther) {
      var key = heardOther.getAttribute('data-show-when').split('=');
      var sync = function () {
        var c = form.querySelector('input[name="' + key[0] + '"]:checked');
        heardOther.hidden = !(c && key[1].split('|').indexOf(c.value) > -1);
      };
      form.addEventListener('change', sync); sync();
    }

    var status = form.querySelector('.f-status');
    var btn = form.querySelector('.f-submit');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.classList.add('was-validated');
      if (!form.checkValidity()) {
        var bad = form.querySelector(':invalid');
        if (bad) { var d = bad.closest('details'); if (d) d.open = true; bad.focus(); }
        status.className = 'f-status err';
        status.textContent = 'Please fill in the highlighted fields.';
        return;
      }
      if (form.elements['botcheck'] && form.elements['botcheck'].checked) return;
      // "At least one of" fields (for example phone or email)
      var oneOf = form.getAttribute('data-one-of');
      if (oneOf) {
        var names = oneOf.split(','), any = names.some(function (n) { return val(form, n) !== ''; });
        if (!any) {
          status.className = 'f-status err';
          status.textContent = 'Please add a phone number or an email so I can reach you.';
          form.elements[names[0]].focus();
          return;
        }
      }

      // Build payload; join multi-select checkbox groups into one line.
      var data = {}, fd = new FormData(form);
      fd.forEach(function (v, k) {
        v = typeof v === 'string' ? v.trim() : v;
        if (v === '') return;
        data[k] = data[k] ? data[k] + ', ' + v : v;
      });
      var name = (val(form, 'First name') + ' ' + val(form, 'Last name')).trim();
      data.name = name;
      var city = val(form, 'City');
      data.subject = (form.getAttribute('data-subject') || 'Website request') + ': ' + name + (city ? ' (' + city + ')' : '');
      if (form.querySelector('[name="Text message consent"]') && !data['Text message consent']) data['Text message consent'] = 'No';
      delete data.botcheck; delete data.redirect;

      // Copy to the Make lead automation (instant reply, Airtable, alert). Fire and forget; never blocks the submit, never sends the access key.
      try {
        var hook = Object.assign({}, data); delete hook.access_key;
        fetch('https://hook.us2.make.com/f8c6mtuv15a5jg1898zknc9ij1oszdlg', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(hook), keepalive: true }).catch(function () {});
      } catch (x) {}

      btn.disabled = true; var label = btn.textContent; btn.textContent = 'Sending…';
      status.className = 'f-status'; status.textContent = '';

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && res.j.success) {
            if (window.gtag) gtag('event', 'generate_lead', { form: form.getAttribute('data-kind') });
            var reveal = form.getAttribute('data-reveal');
            if (reveal) {
              try { localStorage.setItem('1614_' + form.getAttribute('data-kind'), '1'); } catch (x) {}
              if (window.fbq) fbq('track', 'Lead');
              document.dispatchEvent(new CustomEvent('hc:unlocked', { detail: reveal }));
              return;
            }
            window.location.href = '/thanks.html' + (form.getAttribute('data-kind') === 'freeze' ? '?type=freeze' : '');
          } else { throw new Error(res.j && res.j.message || 'error'); }
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = label;
          status.className = 'f-status err';
          status.innerHTML = 'Sorry, that didn\u2019t go through. Please try again, or call or text <a href="tel:+16145859814">(614) 585-9814</a>.';
        });
    });
  });
})();
