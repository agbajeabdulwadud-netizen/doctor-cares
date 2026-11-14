/* Doctor Cares Hospital — shared front-end interaction layer.
   All forms are demonstration-only: this file does not send or persist personal data. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastFocus = null;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

   function loadSharedHeader() {
  return fetch('header.html')
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Could not load shared header');
      }
      return response.text();
    })
    .then(function (html) {
      var container = document.getElementById('shared-header');
      if (!container) return;

      container.innerHTML = html;

      var currentPage = window.location.pathname.split('/').pop() || 'index.html';
      var links = container.querySelectorAll('.nav-link');

      Array.prototype.forEach.call(links, function (link) {
        var linkPage = link.getAttribute('href').split('#')[0];

        if (linkPage === currentPage) {
          link.classList.add('active-link');
          link.setAttribute('aria-current', 'page');
        }
      });

      initHeader();
      initMobileNavigation();
    })
    .catch(function (error) {
      console.error('Header loading failed:', error);
    });
}
  
function initPreloader() {
  var preloader = document.getElementById('preloader');
  if (!preloader) return;

  var dismissed = false;

  function dismiss() {
    if (dismissed || !preloader.isConnected) return;

    dismissed = true;
    preloader.classList.add('fade-out');

    window.setTimeout(function () {
      if (preloader.parentNode) {
        preloader.parentNode.removeChild(preloader);
      }
    }, reduceMotion ? 0 : 600);
  }

  // Display the animation for three seconds, then fade it away.
  window.setTimeout(dismiss, 3000);
}


  function initHeader() {
    var header = document.getElementById('site-header');
    var topButton = document.getElementById('scroll-top-btn');
    var ticking = false;
    function update() {
      var y = window.scrollY || window.pageYOffset || 0;
      if (header) header.classList.toggle('header-compact', y > 30);
      if (topButton) topButton.classList.toggle('is-visible', y > 400);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
    if (topButton) topButton.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    var year = document.getElementById('current-year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function initMobileNavigation() {
    var toggle = document.getElementById('menu-toggle-btn');
    var nav = document.getElementById('primary-navbar');
    var backdrop = document.getElementById('nav-backdrop');
    if (!toggle || !nav) return;
    var links = nav.querySelectorAll('a');
    function close(returnFocus) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      toggle.classList.remove('is-open');
      nav.classList.remove('is-open');
      if (backdrop) { backdrop.classList.remove('is-open'); backdrop.setAttribute('aria-hidden', 'true'); }
      document.body.classList.remove('menu-open');
      if (returnFocus) toggle.focus();
    }
    function open() {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation');
      toggle.classList.add('is-open');
      nav.classList.add('is-open');
      if (backdrop) { backdrop.classList.add('is-open'); backdrop.setAttribute('aria-hidden', 'false'); }
      document.body.classList.add('menu-open');
      var first = nav.querySelector('a');
      if (first && window.matchMedia('(max-width: 768px)').matches) first.focus();
    }
    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') close(false); else open();
    });
    if (backdrop) backdrop.addEventListener('click', function () { close(true); });
    Array.prototype.forEach.call(links, function (link) { link.addEventListener('click', function () { close(false); }); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') close(true); });
    window.addEventListener('resize', function () { if (window.innerWidth > 768 && toggle.getAttribute('aria-expanded') === 'true') close(false); });
  }

  function initAccordions() {
    var triggers = document.querySelectorAll('.faq-trigger');
    Array.prototype.forEach.call(triggers, function (trigger) {
      trigger.addEventListener('click', function () {
        var expanded = trigger.getAttribute('aria-expanded') === 'true';
        var targetId = trigger.getAttribute('aria-controls');
        var panel = targetId ? document.getElementById(targetId) : null;
        Array.prototype.forEach.call(triggers, function (other) {
          other.setAttribute('aria-expanded', 'false');
          var otherPanel = document.getElementById(other.getAttribute('aria-controls'));
          if (otherPanel) otherPanel.hidden = true;
        });
        if (!expanded && panel) { trigger.setAttribute('aria-expanded', 'true'); panel.hidden = false; }
      });
    });
  }

  function initBookingDialog() {
    var dialog = document.getElementById('booking-modal');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    var triggers = document.querySelectorAll('.open-booking-modal');
    var closeButton = document.getElementById('modal-close-btn');
    var previous = document.getElementById('modal-prev');
    var next = document.getElementById('modal-next');
    var finish = document.getElementById('modal-finish');
    var panels = Array.prototype.slice.call(dialog.querySelectorAll('[data-step-panel]'));
    var dots = Array.prototype.slice.call(dialog.querySelectorAll('[data-step]'));
    var announcement = document.getElementById('booking-step-announcement');
    var current = 1;

    function checked(name) {
      var input = dialog.querySelector('input[name="' + name + '"]:checked');
      return input ? input.value : '';
    }
    function setStep(step) {
      current = step;
      panels.forEach(function (panel) {
        var active = Number(panel.getAttribute('data-step-panel')) === step;
        panel.hidden = !active;
        panel.classList.toggle('active', active);
      });
      dots.forEach(function (dot) {
        var n = Number(dot.getAttribute('data-step'));
        dot.classList.toggle('active', n === step);
        dot.classList.toggle('completed', n < step);
        if (n === step) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current');
      });
      if (previous) previous.hidden = step === 1 || step === 6;
      if (next) next.hidden = step === 6;
      if (finish) finish.hidden = step !== 6;
      if (next) next.textContent = step === 5 ? 'Complete demo request' : 'Continue';
      if (announcement) announcement.textContent = 'Step ' + step + ' of 6';
      var heading = document.getElementById('modal-step-title');
      var activeHeading = dialog.querySelector('[data-step-panel="' + step + '"] .step-heading');
      if (heading && activeHeading) heading.textContent = activeHeading.textContent.replace(/^Step \d+:\s*/, '');
      if (activeHeading) { activeHeading.setAttribute('tabindex', '-1'); activeHeading.focus(); }
    }
    function setDateMinimum() {
      var date = document.getElementById('slot-date');
      if (!date) return;
      var now = new Date();
      var local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      date.min = local;
      if (date.value && date.value < local) date.value = '';
    }
    function updateReview() {
      var date = document.getElementById('slot-date');
      var name = document.getElementById('booking-name');
      var email = document.getElementById('booking-email');
      var phone = document.getElementById('booking-phone');
      var values = {
        'review-department': checked('deptChoice'),
        'review-doctor': checked('doctorChoice'),
        'review-date': date && date.value ? date.value : '—',
        'review-time': checked('slotTime') || '—',
        'review-name': name ? name.value.trim() : '—',
        'review-email': email ? email.value.trim() : '—',
        'review-phone': phone ? phone.value.trim() : '—'
      };
      Object.keys(values).forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = values[id] || '—'; });
    }
    function validateStep() {
      if (current === 3) {
        var date = document.getElementById('slot-date');
        if (date && !date.checkValidity()) { date.reportValidity(); return false; }
      }
      if (current === 4) {
        var fields = ['booking-name', 'booking-email', 'booking-phone'];
        for (var i = 0; i < fields.length; i++) {
          var field = document.getElementById(fields[i]);
          if (field && !field.checkValidity()) { field.reportValidity(); return false; }
        }
      }
      return true;
    }
    function open(trigger) {
      lastFocus = trigger || document.activeElement;
      var preferred = trigger && trigger.getAttribute('data-preferred-doctor');
      if (preferred) {
        var radios = dialog.querySelectorAll('input[name="doctorChoice"]');
        Array.prototype.forEach.call(radios, function (radio) { radio.checked = radio.value === preferred; });
      }
      setDateMinimum();
      if (!dialog.open) dialog.showModal();
      setStep(1);
    }
    function resetFields() {
      ['booking-name','booking-email','booking-phone'].forEach(function(id){var field=document.getElementById(id);if(field)field.value='';});
      var date=document.getElementById('slot-date');if(date)date.value='';
      Array.prototype.forEach.call(dialog.querySelectorAll('input[type=radio]'),function(radio){radio.checked=radio.defaultChecked;});
      setStep(1);
    }
    function close() { if (dialog.open) dialog.close(); }
    Array.prototype.forEach.call(triggers, function (trigger) { trigger.addEventListener('click', function () { open(trigger); }); });
    if (closeButton) closeButton.addEventListener('click', close);
    if (previous) previous.addEventListener('click', function () { if (current > 1 && current < 6) setStep(current - 1); });
    if (next) next.addEventListener('click', function () {
      if (!validateStep()) return;
      if (current === 4) updateReview();
      if (current < 6) setStep(current + 1);
    });
    if (finish) finish.addEventListener('click', close);
    dialog.addEventListener('click', function (event) { if (event.target === dialog) close(); });
    dialog.addEventListener('close', function () { resetFields(); if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus(); });
    setDateMinimum();
  }

  function initDemoForms() {
    var forms = document.querySelectorAll('form[data-demo-form]');
    Array.prototype.forEach.call(forms, function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var status = form.nextElementSibling;
        if (!status || !status.classList.contains('form-status')) {
          status = document.createElement('p');
          status.className = 'form-status';
          status.setAttribute('role', 'status');
          status.setAttribute('aria-live', 'polite');
          form.insertAdjacentElement('afterend', status);
        }
        var id = (form.id || '').toLowerCase();
        if (id.indexOf('appt') !== -1 || id.indexOf('appointment') !== -1) {
          status.textContent = 'Demonstration only: no appointment was booked and no information was sent or stored.';
        } else if (id.indexOf('feedback') !== -1) {
          status.textContent = 'Demonstration only: your feedback has not been transmitted or stored.';
        } else {
          status.textContent = 'Demonstration only: your message has not been transmitted or stored. Connect a secure, approved form handler before launch.';
        }
        status.hidden = false;
      });
    });
  }

  function initDoctorSearch() {
    var input = document.getElementById('doctorSearchInput');
    if (!input) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll('.doctor-card'));
    var empty = document.getElementById('noDoctorResults');
    input.addEventListener('input', function () {
      var query = input.value.toLowerCase().trim();
      var visible = 0;
      cards.forEach(function (card) {
        var match = card.textContent.toLowerCase().indexOf(query) !== -1;
        card.hidden = !match;
        if (match) visible++;
      });
      if (empty) empty.hidden = visible !== 0;
    });
  }

  function initPrintChecklist() {
    var printLink = document.querySelector('[data-print-checklist]');
    if (printLink) printLink.addEventListener('click', function (event) { event.preventDefault(); window.print(); });
  }

  function initDepartmentTemplate() {
    if (!/service-template\.html$/i.test(window.location.pathname)) return;
    var dept = new URLSearchParams(window.location.search).get('dept');
    var labels = {
      'internal-medicine':'General Internal Medicine',
      'paediatric-surgery':'Paediatric Surgery',
      'paediatrics':'Paediatrics & Child Health',
      'oncology':'Clinical Oncology',
      'diagnostics':'Pathology & Diagnostics',
      'obgyn':'Obstetrics & Gynaecology'
    };
    if (!dept || !labels[dept]) return;
    var label = labels[dept];
    var h1 = document.querySelector('main h1, h1');
    if (h1) h1.textContent = label + ' — Department Scope';
    document.title = label + ' | Doctor Cares Hospital Demonstration';
  }

  function initContactDateBounds() {
    var dateInputs = document.querySelectorAll('input[type="date"]');
    var now = new Date();
    var local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    Array.prototype.forEach.call(dateInputs, function (input) { if (!input.min) input.min = local; });
  }

  ready(function () {
  initPreloader();
  loadSharedHeader();
  initAccordions();
  initBookingDialog();
  initDemoForms();
  initDoctorSearch();
  initPrintChecklist();
  initDepartmentTemplate();
  initContactDateBounds();
});
   })();

