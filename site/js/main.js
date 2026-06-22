document.addEventListener('DOMContentLoaded', () => {

const initHeader = () => {
  const header = document.querySelector(".header");
  const burger = document.querySelector(".burger");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileMenuDialog = document.querySelector(".mobile-menu__dialog");
  const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");
  const mobileMenuClose = document.querySelector(".mobile-menu__close");
  const mobileMenuLinks = document.querySelectorAll(
    ".mobile-menu__link, .mobile-menu__button, .mobile-menu__phone"
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

  let lastScroll = window.scrollY;
  const scrollThreshold = 80;

  const openMenu = () => {
    burger.classList.add("active");
    burger.setAttribute("aria-expanded", "true");

    mobileMenu.classList.add("active");
    mobileMenuOverlay.classList.add("active");

    document.body.classList.add("menu-open");

    header.style.transform = "translateY(0)";
  };

  const closeMenu = () => {
    burger.classList.remove("active");
    burger.setAttribute("aria-expanded", "false");

    mobileMenu.classList.remove("active");
    mobileMenuOverlay.classList.remove("active");

    document.body.classList.remove("menu-open");
  };

  const toggleMenu = () => {
    if (mobileMenu.classList.contains("active")) {
      closeMenu();
      return;
    }

    openMenu();
  };

  burger.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  mobileMenuClose.addEventListener("click", closeMenu);
  mobileMenuOverlay.addEventListener("click", closeMenu);

  mobileMenu.addEventListener("click", (event) => {
    if (!mobileMenuDialog.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    const isMenuOpen = mobileMenu.classList.contains("active");

    if (!isMenuOpen) return;

    const isClickInsideMenu = mobileMenuDialog.contains(event.target);
    const isClickOnBurger = burger.contains(event.target);

    if (!isClickInsideMenu && !isClickOnBurger) {
      closeMenu();
    }
  });

  mobileMenuLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu.classList.contains("active")) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900 && mobileMenu.classList.contains("active")) {
      closeMenu();
    }
  });

  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;
    const headerHeight = header.offsetHeight;
    const isMenuOpen = mobileMenu.classList.contains("active");

    if (isMenuOpen) {
      header.style.transform = "translateY(0)";
      lastScroll = currentScroll;
      return;
    }

    if (currentScroll > scrollThreshold) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

    if (currentScroll > lastScroll && currentScroll > headerHeight) {
      header.style.transform = "translateY(-135%)";
    } else {
      header.style.transform = "translateY(0)";
    }

    lastScroll = currentScroll;
  });

  header.addEventListener("mouseenter", () => {
    header.style.transform = "translateY(0)";
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

      const setPosition = (clientX) => {
        const rect = compare.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));

        compare.style.setProperty('--compare-position', `${percent}%`);
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
    });
  };

  const initWorksSwiper = () => {
    const swiperElement = document.querySelector('.js-works-swiper');

    if (!swiperElement || typeof Swiper === 'undefined') return;

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
          slidesPerView: 1.1,
          spaceBetween: 14,
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

  initHeader();
  initHeroTilt();
  initCompareSliders();
  initWorksSwiper();
  initPaintDemo();
  initLeadForm();
});
