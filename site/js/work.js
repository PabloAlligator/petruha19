'use strict';

(() => {
  const page = document.querySelector('[data-work-page]');
  if (!page) return;

  const one = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];

  function getSlug() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const portfolioIndex = parts.indexOf('portfolio');
    const pathSlug = portfolioIndex >= 0 ? parts[portfolioIndex + 1] : '';
    const querySlug = new URLSearchParams(window.location.search).get('slug') || '';

    try {
      return decodeURIComponent(pathSlug || querySlug).trim();
    } catch {
      return '';
    }
  }

  function setMeta(selector, value) {
    const element = one(selector);
    if (element) element.setAttribute('content', value);
  }

  function pluralDays(value) {
    const number = Math.abs(Number(value)) % 100;
    const last = number % 10;
    if (number > 10 && number < 20) return 'дней';
    if (last === 1) return 'день';
    if (last > 1 && last < 5) return 'дня';
    return 'дней';
  }

  function showError(message) {
    one('[data-work-loading]')?.setAttribute('hidden', '');
    const error = one('[data-work-error]');
    const errorText = one('[data-work-error-text]');
    if (errorText) errorText.textContent = message;
    error?.removeAttribute('hidden');
    page.setAttribute('aria-busy', 'false');
    document.title = 'Работа не найдена — PETRUHA19';
  }

  function renderGallery(images, title) {
    const section = one('[data-work-gallery-section]');
    const grid = one('[data-work-gallery]');
    if (!section || !grid || !images.length) return;

    const pictures = images.map((image, index) => {
      const picture = document.createElement('img');
      picture.src = image.imagePath;
      picture.alt = image.alt || `${title} — фото ${index + 1}`;
      picture.loading = 'lazy';
      picture.decoding = 'async';
      return picture;
    });

    grid.replaceChildren(...pictures);
    section.removeAttribute('hidden');
  }

  function renderWork(work) {
    if (!work?.after?.imagePath || !work?.before?.imagePath) {
      showError('Для этой работы пока не загружены обязательные фотографии.');
      return;
    }

    const seoTitle = work.seoTitle || `${work.title} — PETRUHA19`;
    const seoDescription = work.seoDescription || work.shortDescription || `${work.service} автомобиля ${work.car} в Абакане. Фото после и до работы PETRUHA19.`;
    const canonical = `${window.location.origin}/portfolio/${encodeURIComponent(work.slug)}`;
    const imageUrl = new URL(work.after.imagePath, window.location.origin).href;

    document.title = seoTitle;
    setMeta('[data-work-meta-description]', seoDescription);
    setMeta('[data-work-og-title]', seoTitle);
    setMeta('[data-work-og-description]', seoDescription);
    setMeta('[data-work-og-url]', canonical);
    setMeta('[data-work-og-image]', imageUrl);
    one('[data-work-canonical]')?.setAttribute('href', canonical);

    const jsonLd = one('[data-work-jsonld]');
    if (jsonLd) {
      jsonLd.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: seoTitle,
        description: seoDescription,
        url: canonical,
        image: imageUrl,
        areaServed: work.location || 'Абакан',
        provider: {
          '@type': 'AutoRepair',
          name: 'PETRUHA19',
          telephone: '+7 923 596-95-09',
        },
      });
    }

    one('[data-work-kicker]').textContent = `${work.service} · ${work.location || 'Абакан'}`;
    one('[data-work-title]').textContent = work.title;
    one('[data-work-summary]').textContent = work.shortDescription || work.description || work.car;
    one('[data-work-car]').textContent = work.car;
    one('[data-work-duration]').textContent = work.durationDays ? `${work.durationDays} ${pluralDays(work.durationDays)}` : 'Срок индивидуально';
    one('[data-work-location]').textContent = work.location || 'Абакан';
    one('[data-work-description]').textContent = work.description || work.shortDescription || 'Выполнили кузовные и покрасочные работы.';

    const after = one('[data-work-after]');
    after.src = work.after.imagePath;
    after.alt = work.after.alt || `${work.car} после ремонта`;
    const before = one('[data-work-before]');
    before.src = work.before.imagePath;
    before.alt = work.before.alt || `${work.car} до ремонта`;

    renderGallery(Array.isArray(work.gallery) ? work.gallery : [], work.title);
    one('[data-work-loading]')?.setAttribute('hidden', '');
    all('[data-work-section]').forEach((section) => section.removeAttribute('hidden'));
    page.setAttribute('aria-busy', 'false');
  }

  async function loadWork() {
    const slug = getSlug();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      showError('Некорректный адрес работы.');
      return;
    }

    try {
      const response = await fetch(`/api/works/${encodeURIComponent(slug)}`, {
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.item) {
        throw new Error(payload.message || 'Работа не найдена.');
      }
      renderWork(payload.item);
    } catch (error) {
      showError(error.message || 'Не удалось загрузить работу.');
    }
  }

  loadWork();
})();
