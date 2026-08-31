'use strict';

const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (symbol) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[symbol]);
}

function cleanOrigin(value) {
  try {
    return new URL(String(value || '')).origin;
  } catch {
    return 'https://petruha19.ru';
  }
}

function renderGallery(images, title) {
  if (!images.length) return '';
  return `
    <section class="work-detail__gallery" aria-labelledby="gallery-title">
      <div class="work-detail__section-head"><span>Детали проекта</span><h2 id="gallery-title">Галерея работы</h2></div>
      <div class="work-detail__gallery-grid">
        ${images.map((image, index) => `<img src="${escapeHtml(image.imagePath)}" alt="${escapeHtml(image.alt || `${title} — фото ${index + 1}`)}" loading="lazy" decoding="async" />`).join('')}
      </div>
    </section>`;
}

router.get('/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return next();

    const work = await prisma.work.findFirst({
      where: { slug, isPublished: true },
      include: {
        images: { orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }] },
      },
    });

    if (!work) return next();
    const after = work.images.find((image) => image.kind === 'AFTER');
    const before = work.images.find((image) => image.kind === 'BEFORE');
    if (!after || !before) return next();

    const gallery = work.images.filter((image) => image.kind === 'GALLERY');
    const siteOrigin = cleanOrigin(process.env.SITE_ORIGIN);
    const canonical = `${siteOrigin}/portfolio/${encodeURIComponent(work.slug)}`;
    const seoTitle = work.seoTitle || `${work.title} — PETRUHA19`;
    const seoDescription = work.seoDescription || work.shortDescription || `${work.service} автомобиля ${work.car} в Абакане. Фото до и после работы PETRUHA19.`;
    const ogImage = `${siteOrigin}${after.imagePath}`;
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: seoTitle,
      description: seoDescription,
      url: canonical,
      image: ogImage,
      areaServed: 'Абакан',
      provider: {
        '@type': 'AutoRepair',
        name: 'PETRUHA19',
        telephone: '+7 923 596-95-09',
      },
    }).replace(/</g, '\\u003c');

    res.set('Cache-Control', 'public, max-age=300');
    return res.status(200).send(`<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(seoDescription)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(seoTitle)}" />
    <meta property="og:description" content="${escapeHtml(seoDescription)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="icon" href="/site/img/customs.png" type="image/png" />
    <link rel="stylesheet" href="/site/css/main.min.css" />
    <title>${escapeHtml(seoTitle)}</title>
    <script type="application/ld+json">${jsonLd}</script>
  </head>
  <body>
    <header class="header"><div class="header__inner"><a class="header__logo" href="/" aria-label="PETRUHA19 на главную"><span>ПЕТРУХА19</span><img src="/site/img/customs.png" alt="" /></a><nav class="header__nav" aria-label="Основная навигация"><a class="header__nav-link" href="/#services">Услуги</a><a class="header__nav-link" href="/portfolio">Работы</a><a class="header__nav-link" href="/#paint-demo">Цвета</a><a class="header__nav-link" href="/#process">Как работаем</a><a class="header__nav-link" href="/#contacts">Контакты</a></nav><a class="header__phone" href="tel:+79235969509">Позвонить</a></div></header>
    <main class="work-detail">
      <section class="work-detail__hero">
        <a class="work-detail__back" href="/portfolio">← Все работы</a>
        <span class="work-detail__kicker">${escapeHtml(work.service)} · ${escapeHtml(work.location)}</span>
        <h1>${escapeHtml(work.title)}</h1>
        <p>${escapeHtml(work.shortDescription || work.description || work.car)}</p>
        <div class="work-detail__meta"><span>${escapeHtml(work.car)}</span><span>${work.durationDays ? `${work.durationDays} дней` : 'Срок индивидуально'}</span><span>${escapeHtml(work.location)}</span></div>
      </section>
      <section class="work-detail__compare" aria-label="Фотографии до и после">
        <figure><img src="${escapeHtml(after.imagePath)}" alt="${escapeHtml(after.alt || `${work.car} после ремонта`)}" /><figcaption>После</figcaption></figure>
        <figure><img src="${escapeHtml(before.imagePath)}" alt="${escapeHtml(before.alt || `${work.car} до ремонта`)}" /><figcaption class="is-before">До</figcaption></figure>
      </section>
      <section class="work-detail__story"><div class="work-detail__section-head"><span>Результат</span><h2>Что сделали</h2></div><p>${escapeHtml(work.description || work.shortDescription || 'Выполнили кузовные и покрасочные работы.')}</p></section>
      ${renderGallery(gallery, work.title)}
      <section class="work-detail__cta"><div><span>Нужен такой же результат?</span><h2>Рассчитаем кузовные работы</h2></div><a href="/#lead">Оставить заявку</a></section>
    </main>
    <footer class="portfolio-footer"><a class="header__logo" href="/"><span>ПЕТРУХА19</span><img src="/site/img/customs.png" alt="" /></a><p>Покраска автомобилей и восстановление кузова в Абакане. Адрес: ул. Аскизская, 146В.</p><a href="tel:+79235969509">+7 923 596-95-09</a></footer>
  </body>
</html>`);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
