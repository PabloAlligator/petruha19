document.addEventListener('DOMContentLoaded', () => {

const initHeader = () => {
  const header = document.querySelector('.header');
  const burger = document.querySelector('.burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileMenuDialog = document.querySelector('.mobile-menu__dialog');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
  const mobileMenuClose = document.querySelector('.mobile-menu__close');
  const mobileMenuLinks = document.querySelectorAll(
    '.mobile-menu__link, .mobile-menu__button, .mobile-menu__phone',
  );

  if (
    !header ||
    !burger ||
    !mobileMenu ||
    !mobileMenuDialog ||
    !mobileMenuOverlay ||
    !mobileMenuClose
  ) {
    return;
  }

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  let lastScroll = window.scrollY;
  const scrollThreshold = 80;

  const isMenuOpen = () => mobileMenu.classList.contains('active');

  const openMenu = () => {
    burger.classList.add('active');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    mobileMenu.classList.add('active');
    mobileMenu.inert = false;
    mobileMenuOverlay.classList.add('active');
    document.body.classList.add('menu-open');
    header.classList.remove('is-hidden');

    window.setTimeout(() => mobileMenuClose.focus(), 120);
  };

  const closeMenu = ({ restoreFocus = true } = {}) => {
    if (!isMenuOpen()) return;

    burger.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    mobileMenu.classList.remove('active');
    mobileMenu.inert = true;
    mobileMenuOverlay.classList.remove('active');
    document.body.classList.remove('menu-open');

    if (restoreFocus) burger.focus();
  };

  burger.addEventListener('click', () => {
    if (isMenuOpen()) {
      closeMenu();
      return;
    }

    openMenu();
  });

  mobileMenuClose.addEventListener('click', () => closeMenu());
  mobileMenuOverlay.addEventListener('click', () => closeMenu());

  mobileMenuLinks.forEach((link) => {
    link.addEventListener('click', () => closeMenu({ restoreFocus: false }));
  });

  document.addEventListener('keydown', (event) => {
    if (!isMenuOpen()) return;

    if (event.key === 'Escape') {
      closeMenu();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = Array.from(
      mobileMenuDialog.querySelectorAll(focusableSelector),
    ).filter((element) => !element.hasAttribute('disabled'));

    if (!focusableElements.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 920 && isMenuOpen()) {
      closeMenu({ restoreFocus: false });
    }
  });

  window.addEventListener(
    'scroll',
    () => {
      const currentScroll = window.scrollY;
      const headerHeight = header.offsetHeight;

      header.classList.toggle('scrolled', currentScroll > scrollThreshold);

      if (isMenuOpen()) {
        header.classList.remove('is-hidden');
        lastScroll = currentScroll;
        return;
      }

      const isScrollingDown = currentScroll > lastScroll + 4;
      const isScrollingUp = currentScroll < lastScroll - 4;

      if (isScrollingDown && currentScroll > headerHeight * 1.6) {
        header.classList.add('is-hidden');
      } else if (isScrollingUp || currentScroll <= scrollThreshold) {
        header.classList.remove('is-hidden');
      }

      lastScroll = currentScroll;
    },
    { passive: true },
  );

  header.addEventListener('mouseenter', () => {
    header.classList.remove('is-hidden');
  });
};

  const initHeroTilt = () => {
    const hero = document.querySelector('.js-hero-tilt');

    if (!hero) return;

    const isDesktop = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (!isDesktop || reducedMotion) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const movePower = 26;
    const rotatePower = 5;
    const smooth = 0.075;

    const updateHero = () => {
      currentX += (targetX - currentX) * smooth;
      currentY += (targetY - currentY) * smooth;

      hero.style.setProperty('--hero-x', `${currentX * movePower}px`);
      hero.style.setProperty('--hero-y', `${currentY * movePower}px`);
      hero.style.setProperty(
        '--hero-rotate-x',
        `${currentY * -rotatePower}deg`,
      );
      hero.style.setProperty('--hero-rotate-y', `${currentX * rotatePower}deg`);

      requestAnimationFrame(updateHero);
    };

    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();

      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    hero.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
    });

    updateHero();
  };

  const initCompareSliders = () => {
    const compares = document.querySelectorAll('.js-compare');

    compares.forEach((compare) => {
      const handle = compare.querySelector('.compare__handle');

      if (!handle) return;

      let isDragging = false;

      handle.setAttribute('role', 'slider');
      handle.setAttribute('aria-valuemin', '0');
      handle.setAttribute('aria-valuemax', '100');
      handle.setAttribute('aria-valuenow', '50');

      const setPercent = (value) => {
        const percent = Math.max(0, Math.min(100, value));

        compare.style.setProperty('--compare-position', `${percent}%`);
        handle.setAttribute('aria-valuenow', String(Math.round(percent)));
      };

      const setPosition = (clientX) => {
        const rect = compare.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));

        setPercent(percent);
      };

      compare.addEventListener('pointerdown', (event) => {
        isDragging = true;
        compare.setPointerCapture(event.pointerId);
        setPosition(event.clientX);
      });

      compare.addEventListener('pointermove', (event) => {
        if (!isDragging) return;

        setPosition(event.clientX);
      });

      compare.addEventListener('pointerup', () => {
        isDragging = false;
      });

      compare.addEventListener('pointercancel', () => {
        isDragging = false;
      });

      handle.addEventListener('keydown', (event) => {
        const current = Number(handle.getAttribute('aria-valuenow')) || 50;
        let next = current;

        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          next = current - 5;
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          next = current + 5;
        } else if (event.key === 'Home') {
          next = 0;
        } else if (event.key === 'End') {
          next = 100;
        } else {
          return;
        }

        event.preventDefault();
        setPercent(next);
      });
    });
  };

  const createWorksPreviewSlide = (work) => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide works-preview__slide';
    const card = document.createElement('article');
    card.className = 'works-preview__card';

    const link = document.createElement('a');
    link.className = 'works-preview__card-link';
    link.href = `/portfolio/${encodeURIComponent(work.slug)}`;
    link.setAttribute('aria-label', `Смотреть работу ${work.title}`);

    const media = document.createElement('div');
    media.className = 'works-preview__media';
    const after = document.createElement('img');
    after.className = 'works-preview__image works-preview__image--after';
    after.src = work.after.imagePath;
    after.alt = work.after.alt || `${work.car} после ремонта`;
    after.loading = 'lazy';
    const before = document.createElement('img');
    before.className = 'works-preview__image works-preview__image--before';
    before.src = work.before.imagePath;
    before.alt = work.before.alt || `${work.car} до ремонта`;
    before.loading = 'lazy';
    const scan = document.createElement('span');
    scan.className = 'works-preview__scan';
    scan.setAttribute('aria-hidden', 'true');
    media.append(after, before, scan);

    const labels = document.createElement('div');
    labels.className = 'works-preview__labels';
    const service = document.createElement('span');
    service.textContent = work.service;
    const year = document.createElement('i');
    year.textContent = `'${String(new Date(work.createdAt).getFullYear()).slice(-2)}`;
    labels.append(service, year);

    const states = document.createElement('div');
    states.className = 'works-preview__before-after';
    const afterState = document.createElement('span');
    afterState.className = 'works-preview__state works-preview__state--after';
    afterState.textContent = 'После';
    const beforeState = document.createElement('span');
    beforeState.className = 'works-preview__state works-preview__state--before';
    beforeState.textContent = 'До';
    states.append(afterState, beforeState);

    const body = document.createElement('div');
    body.className = 'works-preview__card-body';
    const title = document.createElement('h3');
    title.className = 'works-preview__card-title';
    title.textContent = work.car || work.title;
    const description = document.createElement('p');
    description.className = 'works-preview__card-text';
    description.textContent = work.shortDescription || work.title;
    const meta = document.createElement('div');
    meta.className = 'works-preview__meta';
    const duration = document.createElement('span');
    duration.textContent = work.durationDays ? `${work.durationDays} дн.` : 'Срок по задаче';
    const location = document.createElement('span');
    location.textContent = work.location || 'Абакан';
    meta.append(duration, location);
    body.append(title, description, meta);

    const arrow = document.createElement('span');
    arrow.className = 'works-preview__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    card.append(link, media, labels, states, body, arrow);
    slide.append(card);
    return slide;
  };

  const initWorksSwiper = async () => {
    const swiperElement = document.querySelector('.js-works-swiper');

    if (!swiperElement) return;

    const track = swiperElement.querySelector('.works-preview__track');

    try {
      const response = await fetch('/api/works?limit=12&featured=true', {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const payload = await response.json();
        const works = Array.isArray(payload.items) ? payload.items : [];

        if (track) {
          if (works.length) {
            track.replaceChildren(...works.map(createWorksPreviewSlide));
          } else {
            const emptySlide = document.createElement('div');
            emptySlide.className = 'swiper-slide works-preview__slide works-preview__slide--empty';
            emptySlide.textContent = 'Новые работы скоро появятся';
            track.replaceChildren(emptySlide);
          }
        }
      }
    } catch {
      // Статические карточки остаются безопасным fallback при недоступном API.
    }

    if (typeof Swiper === 'undefined') return;

    new Swiper(swiperElement, {
      loop: true,
      speed: 700,
      slidesPerView: 5,
      spaceBetween: 18,
      grabCursor: true,
      watchOverflow: true,
      loopAdditionalSlides: 5,

      autoplay: {
        delay: 4200,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },

      navigation: {
        prevEl: '.works-preview__control--prev',
        nextEl: '.works-preview__control--next',
      },

      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },

      breakpoints: {
        0: {
          slidesPerView: 2,
          spaceBetween: 10,
        },
        560: {
          slidesPerView: 2,
          spaceBetween: 16,
        },
        760: {
          slidesPerView: 3,
          spaceBetween: 18,
        },
        1200: {
          slidesPerView: 5,
          spaceBetween: 18,
        },
      },
    });
  };

  const initPaintDemo = () => {
    const demo = document.querySelector('.paint-demo');

    if (!demo) return;

    const car = demo.querySelector('.paint-demo__car');
    const selectedName = demo.querySelector('.paint-demo__selected-name');
    const colorButtons = demo.querySelectorAll('.paint-demo__color');

    if (!car || !selectedName || !colorButtons.length) return;

    colorButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const carSrc = button.dataset.car;
        const colorName = button.dataset.name;

        if (!carSrc || !colorName) return;

        colorButtons.forEach((item) => {
          item.classList.remove('is-active');
        });

        button.classList.add('is-active');
        selectedName.textContent = colorName;

        car.classList.add('is-changing');

        window.setTimeout(() => {
          car.src = carSrc;
          car.alt = `Автомобиль в цвете ${colorName}`;
          car.classList.remove('is-changing');
        }, 180);
      });
    });
  };

  function initLeadForm() {
    const form = document.getElementById('leadForm');
    const phoneInput = document.getElementById('leadPhone');
    const submitButton = document.getElementById('leadSubmitBtn');
    const buttonText = submitButton ? submitButton.querySelector('.btn-text') : null;
    const successMessage = document.getElementById('leadSuccessMessage');
    const errorMessage = document.getElementById('leadErrorMessage');

    if (
        !form ||
        !phoneInput ||
        !submitButton ||
        !buttonText ||
        !successMessage ||
        !errorMessage
    ) {
        return;
    }

    const formStartTime = Date.now();
    let isSending = false;

    const setStatus = (type, message = '') => {
        successMessage.classList.remove('active');
        errorMessage.classList.remove('active');

        successMessage.textContent = '';
        errorMessage.textContent = '';

        if (type === 'success') {
            successMessage.textContent = message;
            successMessage.classList.add('active');
        }

        if (type === 'error') {
            errorMessage.textContent = message;
            errorMessage.classList.add('active');
        }
    };

    const setLoading = (state) => {
        isSending = state;
        submitButton.disabled = state;
        buttonText.textContent = state ? 'ОТПРАВЛЯЕМ...' : 'ОТПРАВИТЬ ЗАЯВКУ';
    };

    phoneInput.addEventListener('input', (event) => {
        event.target.value = formatLeadPhone(event.target.value);
    });

    phoneInput.addEventListener('focus', () => {
        if (!phoneInput.value.trim()) {
            phoneInput.value = '+7';
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (isSending) return;

        setStatus();

        const formData = new FormData(form);

        const name = String(formData.get('name') || '').trim();
        const phone = String(formData.get('phone') || '').trim();
        const phoneDigits = getLeadPhoneDigits(phone);
        const service = String(formData.get('service') || '').trim();
        const car = String(formData.get('car') || '').trim();
        const message = String(formData.get('message') || '').trim();
        const website = String(formData.get('website') || '').trim();

        if (!name || name.length < 2 || name.length > 80) {
            setStatus('error', 'Введите корректное имя.');
            form.elements.name?.focus();
            return;
        }

        if (phoneDigits.length !== 11 || !/^7\d{10}$/.test(phoneDigits)) {
            setStatus('error', 'Введите корректный номер телефона в формате +7.');
            phoneInput.focus();
            return;
        }

        if (!service || service.length < 2 || service.length > 120) {
            setStatus('error', 'Выберите услугу.');
            form.elements.service?.focus();
            return;
        }

        if (car.length > 120) {
            setStatus('error', 'Название автомобиля слишком длинное.');
            form.elements.car?.focus();
            return;
        }

        if (message.length > 900) {
            setStatus('error', 'Комментарий слишком длинный. Максимум 900 символов.');
            return;
        }

        const payload = {
            name,
            phone,
            service,
            car,
            message,
            website,
            page: window.location.href,
            form_time: formStartTime
        };

        try {
            setLoading(true);

            const response = await fetch('/api/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            let result = null;

            try {
                result = await response.json();
            } catch {
                result = null;
            }

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || 'Не удалось отправить заявку.');
            }

            setStatus(
                'success',
                result.message || 'Спасибо! Заявка отправлена, мы скоро свяжемся с вами.'
            );

            form.reset();
            phoneInput.value = '';
        } catch (error) {
            setStatus(
                'error',
                error.message || 'Ошибка отправки. Попробуйте ещё раз чуть позже.'
            );
        } finally {
            setLoading(false);
        }
    });
}

function formatLeadPhone(value) {
    const rawDigits = String(value || '').replace(/\D/g, '').slice(0, 11);

    let normalized = rawDigits;

    if (normalized.startsWith('8')) {
        normalized = '7' + normalized.slice(1);
    }

    if (!normalized.startsWith('7') && normalized.length > 0) {
        normalized = '7' + normalized.slice(0, 10);
    }

    let result = '+7';

    if (normalized.length > 1) {
        result += ` (${normalized.slice(1, 4)}`;
    }

    if (normalized.length >= 5) {
        result += `) ${normalized.slice(4, 7)}`;
    }

    if (normalized.length >= 8) {
        result += `-${normalized.slice(7, 9)}`;
    }

    if (normalized.length >= 10) {
        result += `-${normalized.slice(9, 11)}`;
    }

    return result;
}

function getLeadPhoneDigits(value) {
    let digits = String(value || '').replace(/\D/g, '').slice(0, 11);

    if (digits.startsWith('8')) {
        digits = '7' + digits.slice(1);
    }

    if (!digits.startsWith('7') && digits.length > 0) {
        digits = '7' + digits.slice(0, 10);
    }

    return digits;
}



const initFloatingActions = () => {
  const actions = document.querySelector('[data-floating-actions]');
  const footer = document.querySelector('.footer');

  if (!actions || !footer) return;

  const scrollThreshold = 120;
  const footerOffset = 80;
  let ticking = false;

  const updateVisibility = () => {
    const hasScrolled = window.scrollY > scrollThreshold;
    const footerTop = footer.getBoundingClientRect().top;
    const footerIsNear = footerTop <= window.innerHeight + footerOffset;

    actions.classList.toggle('is-visible', hasScrolled && !footerIsNear);
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateVisibility);
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  updateVisibility();
};

  initHeader();
  initFloatingActions();
  initHeroTilt();
  initCompareSliders();
  initWorksSwiper();
  initPaintDemo();
  initLeadForm();
});
