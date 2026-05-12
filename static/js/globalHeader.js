// globalHeader.js - Sistema de Header Global Reutilizable

(function () {
  'use strict';

  const HEADER_CONFIG = {
    logoSrc: '/static/images/Logo_EMESA.png',
    logoAlt: 'EMESA',
    homeUrl: '/',
    loginWidgetId: 'loginWidgetContainer',
  };

  function getPageTitleConfig() {
    const pageConfigElement = document.getElementById('pageI18nConfig');
    if (pageConfigElement) {
      try {
        const pageConfig = JSON.parse(pageConfigElement.textContent || '{}');
        if (pageConfig.title || pageConfig.titleKey) {
          return {
            text: pageConfig.title || document.title || 'SGA EMESA',
            key: pageConfig.titleKey || null,
          };
        }
      } catch {
        // Invalid JSON, fallback below.
      }
    }

    const scripts = document.querySelectorAll('script[src*="globalHeader.js"]');
    for (const script of scripts) {
      if (script.dataset.title || script.dataset.titleKey) {
        return {
          text: script.dataset.title || document.title || 'SGA EMESA',
          key: script.dataset.titleKey || null,
        };
      }
    }

    return {
      text: document.title || 'SGA EMESA',
      key: null,
    };
  }

  function createHeaderHTML(titleConfig) {
    const titleText = typeof titleConfig === 'string' ? titleConfig : titleConfig.text;
    const titleKey = typeof titleConfig === 'string' ? '' : (titleConfig.key || '');
    const titleKeyAttribute = titleKey ? ` data-translate-key="${titleKey}"` : '';

    return `
      <div class="global-header app-header">
        <div class="header-main-row">
          <div class="header-left-section">
            <a href="${HEADER_CONFIG.homeUrl}" class="logo-link" title="Ir a Inicio" data-translate-key-title="header.go_home">
              <img class="emesa-logo" src="${HEADER_CONFIG.logoSrc}" alt="${HEADER_CONFIG.logoAlt}">
            </a>
          </div>
          <span class="header-title"${titleKeyAttribute}>${titleText}</span>
          <div class="header-right-section">
            <div id="userSessionWidgetHost">
              <div id="${HEADER_CONFIG.loginWidgetId}"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function createHeaderStyles() {
    if (document.getElementById('globalHeaderStyles')) {
      return;
    }

    const styles = document.createElement('style');
    styles.id = 'globalHeaderStyles';
    styles.textContent = `
      .global-header {
        background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        padding: 12px 0;
        position: relative;
        z-index: 1000;
      }

      .global-header .header-main-row {
        align-items: center;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        padding: 0 20px;
        width: 100%;
      }

      .global-header .header-left-section {
        align-items: center;
        display: flex;
        gap: 15px;
      }

      .global-header .logo-link {
        align-items: center;
        display: flex;
        text-decoration: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .global-header .logo-link:hover {
        opacity: 0.9;
        transform: scale(1.05);
      }

      .global-header .emesa-logo {
        cursor: pointer;
        height: 45px;
        width: auto;
      }

      .global-header .header-title {
        color: #fff;
        font-size: 1.5rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        text-transform: uppercase;
      }

      .global-header .header-right-section,
      .global-header #userSessionWidgetHost,
      .global-header #${HEADER_CONFIG.loginWidgetId} {
        align-items: center;
        display: flex;
        gap: 12px;
      }

      @media (max-width: 768px) {
        .global-header .header-title {
          font-size: 1rem;
          letter-spacing: 0.5px;
        }

        .global-header .emesa-logo {
          height: 35px;
        }

        .global-header .header-main-row {
          padding: 0 10px;
        }
      }

      @media (max-width: 480px) {
        .global-header .header-title {
          font-size: 0.85rem;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function ensureI18nLoaded() {
    if (window.MonthlyI18n) {
      return window.MonthlyI18n;
    }

    await loadScript('/static/js/i18n.js');

    if (window.MonthlyI18n && window.MonthlyI18n.ready) {
      try {
        await window.MonthlyI18n.ready;
      } catch {
        return window.MonthlyI18n;
      }
    }

    return window.MonthlyI18n;
  }

  async function initGlobalHeader(options = {}) {
    const title = options.title
      ? { text: options.title, key: options.titleKey || null }
      : getPageTitleConfig();

    await ensureI18nLoaded();

    createHeaderStyles();

    const existingHeader = document.querySelector('.header');
    if (existingHeader) {
      existingHeader.outerHTML = createHeaderHTML(title);
    } else if (!document.querySelector('.global-header')) {
      const headerWrapper = document.createElement('div');
      headerWrapper.innerHTML = createHeaderHTML(title);
      document.body.insertBefore(headerWrapper.firstElementChild, document.body.firstChild);
    }

    try {
      await loadScript('/static/js/loginModal.js');
      await loadScript('/static/js/sharedSession.js');

      if (typeof LoginModal !== 'undefined' && LoginModal.init) {
        LoginModal.init();
      }

      if (typeof SharedSession !== 'undefined' && SharedSession.init) {
        SharedSession.init();
      }
    } catch (error) {
      console.error('[GlobalHeader] Error cargando scripts:', error);
    }

    if (window.MonthlyI18n && typeof window.MonthlyI18n.mountLanguageSelector === 'function') {
      window.MonthlyI18n.mountLanguageSelector();
    }

    if (window.MonthlyI18n && typeof window.MonthlyI18n.translatePage === 'function') {
      window.MonthlyI18n.translatePage();
    }

    window.dispatchEvent(new CustomEvent('globalHeaderReady'));
  }

  function updateHeaderTitle(newTitle) {
    const titleElement = document.querySelector('.global-header .header-title');
    if (!titleElement) {
      return;
    }

    titleElement.textContent = newTitle;
    delete titleElement.dataset.translateKey;

    if (window.MonthlyI18n && typeof window.MonthlyI18n.translatePage === 'function') {
      window.MonthlyI18n.translatePage();
    }
  }

  window.GlobalHeader = {
    init: initGlobalHeader,
    updateTitle: updateHeaderTitle,
    config: HEADER_CONFIG,
    translate: (...args) => window.MonthlyI18n && typeof window.MonthlyI18n.translate === 'function'
      ? window.MonthlyI18n.translate(...args)
      : args[0],
    translatePage: (...args) => window.MonthlyI18n && typeof window.MonthlyI18n.translatePage === 'function'
      ? window.MonthlyI18n.translatePage(...args)
      : undefined,
    changeLanguage: (...args) => window.MonthlyI18n && typeof window.MonthlyI18n.changeLanguage === 'function'
      ? window.MonthlyI18n.changeLanguage(...args)
      : Promise.resolve(false),
    getCurrentLanguage: () => window.MonthlyI18n && typeof window.MonthlyI18n.getCurrentLanguage === 'function'
      ? window.MonthlyI18n.getCurrentLanguage()
      : (document.documentElement.lang || 'es'),
    getSupportedLanguages: () => window.MonthlyI18n && typeof window.MonthlyI18n.getSupportedLanguages === 'function'
      ? window.MonthlyI18n.getSupportedLanguages()
      : ['es', 'en', 'cs'],
    getTranslation: (...args) => window.MonthlyI18n && typeof window.MonthlyI18n.translate === 'function'
      ? window.MonthlyI18n.translate(...args)
      : args[0],
    reloadTranslations: () => window.MonthlyI18n && window.MonthlyI18n.ready
      ? window.MonthlyI18n.ready.then(() => window.MonthlyI18n.translatePage())
      : Promise.resolve(),
  };

  async function autoInitialize() {
    const script = document.querySelector('script[src*="globalHeader.js"]');
    if (script && script.dataset.autoInit !== 'false') {
      await initGlobalHeader();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize, { once: true });
  } else {
    autoInitialize();
  }
})();
