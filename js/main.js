document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduceMotion ? 'auto' : 'smooth';

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function goTo(hash) {
    if (hash === '#inicio') {
      window.scrollTo({ top: 0, behavior });
      history.replaceState(null, '', '#inicio');
      return true;
    }
    const target = document.querySelector(hash);
    if (!target) return false;
    target.scrollIntoView({ behavior, block: 'start' });
    history.replaceState(null, '', hash);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    return true;
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (link.classList.contains('soon')) {
        e.preventDefault();
        showToast('Este tema estará disponible próximamente.');
        return;
      }
      if (href.length > 1 && goTo(href)) e.preventDefault();
    });
  });

  const sidebar = document.querySelector('.sidebar');
  document.querySelectorAll('.toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.sidebar-section');
      const collapse = btn.getAttribute('aria-expanded') === 'true';
      const name = section.classList.contains('sidebar-temas') ? 'temas' : 'sumario';
      btn.setAttribute('aria-expanded', String(!collapse));
      btn.setAttribute('aria-label', (collapse ? 'Expandir ' : 'Contraer ') + name);
      section.classList.toggle('collapsed', collapse);
      if (name === 'temas') sidebar.classList.toggle('temas-collapsed', collapse);
    });
  });

  const sumarioLinks = document.querySelectorAll('.sumario-list a');
  const sections = [...sumarioLinks]
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  function setCurrent(id) {
    sumarioLinks.forEach(a => {
      const on = a.getAttribute('href') === id;
      a.classList.toggle('current', on);
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }

  function updateCurrent() {
    let active = null;
    sections.forEach(sec => {
      if (sec.getBoundingClientRect().top <= 110) active = sec;
    });
    setCurrent(active ? '#' + active.id : null);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateCurrent(); ticking = false; });
  }, { passive: true });
  updateCurrent();

  const toTop = document.querySelector('.to-top');
  if (toTop) {
    const updateToTop = () => { toTop.hidden = window.scrollY < 400; };
    window.addEventListener('scroll', updateToTop, { passive: true });
    updateToTop();
  }

  const frames = [...document.querySelectorAll('.frame')];
  if (frames.length) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Visor de imágenes');
    box.innerHTML =
      '<button type="button" class="lb-btn lb-close" aria-label="Cerrar">&times;</button>' +
      '<button type="button" class="lb-btn lb-prev" aria-label="Imagen anterior">&#8249;</button>' +
      '<figure class="lb-fig"><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="lb-btn lb-next" aria-label="Imagen siguiente">&#8250;</button>';
    document.body.appendChild(box);

    const lbImg = box.querySelector('img');
    const lbCap = box.querySelector('figcaption');
    let index = 0;
    let opener = null;

    function show(i) {
      index = (i + frames.length) % frames.length;
      const img = frames[index].querySelector('img');
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = (index + 1) + ' / ' + frames.length;
    }
    function open(i, trigger) {
      opener = trigger;
      show(i);
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
      box.querySelector('.lb-close').focus();
    }
    function close() {
      box.classList.remove('open');
      document.body.style.overflow = '';
      if (opener) opener.focus();
    }

    frames.forEach((frame, i) => {
      frame.addEventListener('click', () => open(i, frame));
      frame.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, frame); }
      });
    });
    box.querySelector('.lb-close').addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
    box.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
    box.addEventListener('click', e => { if (e.target === box) close(); });
    document.addEventListener('keydown', e => {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  const embeds = [...document.querySelectorAll('.video-embed[data-video]')];
  embeds.forEach(embed => { embed.dataset.facade = embed.innerHTML; });

  function restore(embed) {
    embed.innerHTML = embed.dataset.facade;
  }

  const canEmbed = location.protocol === 'http:' || location.protocol === 'https:';

  function activate(embed) {
    embeds.forEach(other => {
      if (other !== embed && (other.querySelector('iframe') || other.querySelector('.video-notice'))) restore(other);
    });
    const id = embed.dataset.video;

    if (!canEmbed) {
      embed.innerHTML =
        '<div class="video-notice">' +
        '<p>YouTube no permite reproducir videos incrustados cuando la página se abre como archivo local (error 153).</p>' +
        '<p>Abre el sitio desde su dirección web (<strong>https://</strong>) para verlo aquí.</p>' +
        '<a class="btn-cta" href="https://www.youtube.com/watch?v=' + id + '" target="_blank" rel="noopener noreferrer">Ver en YouTube ↗</a>' +
        '</div>';
      return;
    }

    const params = new URLSearchParams({
      autoplay: '1',
      rel: '0',
      playsinline: '1',
      origin: location.origin
    });
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/' + id + '?' + params.toString();
    iframe.title = embed.dataset.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    embed.innerHTML = '';
    embed.appendChild(iframe);
  }

  embeds.forEach(embed => {
    embed.addEventListener('click', e => {
      if (e.target.closest('.video-play')) activate(embed);
    });
  });

  const quizzes = [...document.querySelectorAll('.quiz')];
  const summary = document.querySelector('.quiz-summary');
  const score = document.querySelector('.quiz-score');

  function updateSummary() {
    const answered = quizzes.filter(q => q.querySelector('.quiz-opt:disabled')).length;
    if (answered !== quizzes.length || !summary) return;
    const good = quizzes.filter(q => q.querySelector('.quiz-opt.chosen.correct')).length;
    score.textContent = 'Resultado: ' + good + ' de ' + quizzes.length + ' respuestas correctas.';
    summary.hidden = false;
  }

  quizzes.forEach(quiz => {
    const options = quiz.querySelectorAll('.quiz-opt');
    const feedback = quiz.querySelector('.quiz-feedback');
    options.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const isCorrect = btn.getAttribute('data-correct') === 'true';
        options.forEach(o => {
          o.disabled = true;
          if (o.getAttribute('data-correct') === 'true') o.classList.add('correct');
        });
        btn.classList.add('chosen');
        feedback.hidden = false;
        if (isCorrect) {
          feedback.className = 'quiz-feedback ok';
          feedback.textContent = '¡Correcto! Bien aplicado el concepto.';
        } else {
          btn.classList.add('incorrect');
          feedback.className = 'quiz-feedback fail';
          feedback.textContent = 'No es la mejor opción. Revisa la respuesta marcada en verde.';
        }
        updateSummary();
      });
    });
  });

  const reset = document.querySelector('.btn-reset');
  if (reset) {
    reset.addEventListener('click', () => {
      quizzes.forEach(quiz => {
        quiz.querySelectorAll('.quiz-opt').forEach(o => {
          o.disabled = false;
          o.classList.remove('correct', 'incorrect', 'chosen');
        });
        const fb = quiz.querySelector('.quiz-feedback');
        fb.hidden = true;
        fb.textContent = '';
      });
      summary.hidden = true;
      goTo('#quizzes');
    });
  }

  if (location.hash.length > 1) {
    setTimeout(() => goTo(location.hash), 50);
  }
});
