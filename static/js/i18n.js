(function () {
  'use strict';

  const LANGUAGE_STORAGE_KEY = 'language';
  const LEGACY_LANGUAGE_STORAGE_KEY = 'appLanguage';
  const MISSING_I18N_DEBUG_STORAGE_KEY = 'i18nDebugMissing';
  const DEFAULT_LANGUAGE = 'es';
  const SUPPORTED_LANGUAGES = ['es', 'en', 'cs'];
  const LANGUAGE_ALIASES = {
    es: 'es',
    en: 'en',
    cs: 'cs',
    cz: 'cs',
  };
  const FLAG_CLASS_BY_LANGUAGE = {
    es: 'es',
    en: 'uk',
    cs: 'cz',
  };
  const DIRECT_TEXT_TAGS = new Set([
    'a',
    'button',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'label',
    'legend',
    'li',
    'option',
    'p',
    'small',
    'span',
    'strong',
    'td',
    'th',
  ]);
  const WORD_RE = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñČčĚěŠšŘřŽžÝý]+/;
  const WHITESPACE_RE = /\s+/g;
  const TRANSLATION_BINDING_ATTRIBUTES = [
    'data-translate-key',
    'data-translate-key-placeholder',
    'data-translate-key-value',
    'data-translate-key-title',
    'data-translate-key-aria-label',
  ];

  const dictionaries = new Map();
  let currentLanguage = bootstrapLanguage();
  let languageSelector = null;
  let readyResolved = false;
  let untranslatedObserver = null;
  let untranslatedScanFrame = 0;
  let lastUntranslatedSignature = '';
  let resolveReady;
  let rejectReady;

  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  function normalizeLanguage(lang) {
    const normalized = String(lang || '').trim().toLowerCase();
    return LANGUAGE_ALIASES[normalized] || DEFAULT_LANGUAGE;
  }

  function bootstrapLanguage() {
    let candidate = null;

    try {
      candidate = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
    } catch {
      candidate = null;
    }

    if (!candidate) {
      candidate = navigator.language ? navigator.language.split('-')[0] : DEFAULT_LANGUAGE;
    }

    const normalized = normalizeLanguage(candidate);
    document.documentElement.lang = normalized;
    document.documentElement.dataset.language = normalized;
    return normalized;
  }

  function persistLanguage(lang) {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      window.localStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Storage unavailable.
    }
  }

  function getPageConfig() {
    const configElement = document.getElementById('pageI18nConfig');
    if (!configElement) {
      return { title: document.title || '', titleKey: null };
    }

    try {
      const parsed = JSON.parse(configElement.textContent || '{}');
      return {
        title: parsed.title || document.title || '',
        titleKey: parsed.titleKey || null,
      };
    } catch {
      return { title: document.title || '', titleKey: null };
    }
  }

  async function loadTranslations(lang) {
    const normalized = normalizeLanguage(lang);
    if (dictionaries.has(normalized)) {
      return dictionaries.get(normalized);
    }

    const response = await fetch(`/static/translations/${normalized}.json`, { credentials: 'same-origin' });
    if (!response.ok) {
      if (normalized !== DEFAULT_LANGUAGE) {
        return loadTranslations(DEFAULT_LANGUAGE);
      }
      throw new Error(`No se pudieron cargar las traducciones para ${normalized}`);
    }

    const dictionary = await response.json();
    dictionaries.set(normalized, dictionary);
    return dictionary;
  }

  function interpolate(text, params) {
    if (!params || typeof text !== 'string') {
      return text;
    }

    return text.replace(/\{\s*([\w.-]+)\s*\}/g, (match, key) => {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        return String(params[key]);
      }
      return match;
    });
  }

  function normalizeVisibleText(value) {
    return String(value || '').replace(WHITESPACE_RE, ' ').trim();
  }

  function looksLikeVisibleText(value) {
    const normalized = normalizeVisibleText(value);
    if (!normalized) {
      return false;
    }
    if (normalized.startsWith(('/', '#', '.', 'http://', 'https://', 'mailto:', 'data:'))) {
      return false;
    }
    if (normalized.includes('{{') || normalized.includes('{%') || normalized.includes('}}') || normalized.includes('%}')) {
      return false;
    }
    return WORD_RE.test(normalized);
  }

  function isMissingI18nDebugEnabled() {
    try {
      if (window.localStorage.getItem(MISSING_I18N_DEBUG_STORAGE_KEY) === '1') {
        return true;
      }
    } catch {
      // Storage unavailable.
    }

    try {
      return new URL(window.location.href).searchParams.get('i18n_debug') === '1';
    } catch {
      return false;
    }
  }

  function hasTranslationBinding(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    if (element.dataset.noTranslate === 'true') {
      return true;
    }
    return TRANSLATION_BINDING_ATTRIBUTES.some((attribute) => element.hasAttribute(attribute));
  }

  function hasTranslatedAncestor(element) {
    let current = element.parentElement;
    while (current) {
      if (hasTranslationBinding(current)) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function getDirectVisibleText(element) {
    const chunks = [];
    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = normalizeVisibleText(node.textContent);
        if (text) {
          chunks.push(text);
        }
      }
    });
    return normalizeVisibleText(chunks.join(' '));
  }

  function buildMissingEntry(element, type, text) {
    const tagName = element.tagName.toLowerCase();
    const idPart = element.id ? `#${element.id}` : '';
    const classPart = element.classList.length ? `.${Array.from(element.classList).slice(0, 3).join('.')}` : '';
    return {
      type,
      text,
      tag: tagName,
      selector: `${tagName}${idPart}${classPart}`,
    };
  }

  function scanForMissingVisualTranslations(root = document.body) {
    if (!(root instanceof HTMLElement)) {
      return [];
    }

    const entries = [];
    const seen = new Set();
    const elements = root === document.body ? [root, ...root.querySelectorAll('*')] : [root, ...root.querySelectorAll('*')];

    elements.forEach((element) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }
      if (element.hidden || element.dataset.noTranslate === 'true' || hasTranslationBinding(element) || hasTranslatedAncestor(element)) {
        return;
      }

      const tagName = element.tagName.toLowerCase();
      if (DIRECT_TEXT_TAGS.has(tagName)) {
        const text = getDirectVisibleText(element);
        if (looksLikeVisibleText(text)) {
          const signature = `text|${tagName}|${text}`;
          if (!seen.has(signature)) {
            seen.add(signature);
            entries.push(buildMissingEntry(element, 'text', text));
          }
        }
      }

      const placeholder = element.getAttribute('placeholder');
      if (looksLikeVisibleText(placeholder) && !element.hasAttribute('data-translate-key-placeholder')) {
        const text = normalizeVisibleText(placeholder);
        const signature = `placeholder|${tagName}|${text}`;
        if (!seen.has(signature)) {
          seen.add(signature);
          entries.push(buildMissingEntry(element, 'placeholder', text));
        }
      }

      const title = element.getAttribute('title');
      if (looksLikeVisibleText(title) && !element.hasAttribute('data-translate-key-title')) {
        const text = normalizeVisibleText(title);
        const signature = `title|${tagName}|${text}`;
        if (!seen.has(signature)) {
          seen.add(signature);
          entries.push(buildMissingEntry(element, 'title', text));
        }
      }

      const ariaLabel = element.getAttribute('aria-label');
      if (looksLikeVisibleText(ariaLabel) && !element.hasAttribute('data-translate-key-aria-label')) {
        const text = normalizeVisibleText(ariaLabel);
        const signature = `aria-label|${tagName}|${text}`;
        if (!seen.has(signature)) {
          seen.add(signature);
          entries.push(buildMissingEntry(element, 'aria-label', text));
        }
      }
    });

    return entries;
  }

  function reportMissingVisualTranslations() {
    if (!isMissingI18nDebugEnabled()) {
      return [];
    }

    const entries = scanForMissingVisualTranslations(document.body);
    const signature = JSON.stringify(entries.map((entry) => `${entry.type}|${entry.selector}|${entry.text}`));
    if (signature === lastUntranslatedSignature) {
      return entries;
    }

    lastUntranslatedSignature = signature;
    window.dispatchEvent(new CustomEvent('MonthlyI18nMissingVisuals', { detail: { language: currentLanguage, entries } }));

    if (entries.length) {
      console.warn('[MonthlyI18n] Textos visibles sin traducir detectados:', entries);
    }

    return entries;
  }

  function scheduleMissingVisualTranslationReport() {
    if (!isMissingI18nDebugEnabled()) {
      return;
    }
    if (untranslatedScanFrame) {
      window.cancelAnimationFrame(untranslatedScanFrame);
    }
    untranslatedScanFrame = window.requestAnimationFrame(() => {
      untranslatedScanFrame = 0;
      reportMissingVisualTranslations();
    });
  }

  function ensureMissingVisualTranslationObserver() {
    if (!isMissingI18nDebugEnabled() || untranslatedObserver || typeof MutationObserver !== 'function') {
      return;
    }

    untranslatedObserver = new MutationObserver(() => {
      scheduleMissingVisualTranslationReport();
    });

    untranslatedObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        'placeholder',
        'title',
        'aria-label',
        'data-translate-key',
        'data-translate-key-placeholder',
        'data-translate-key-title',
        'data-translate-key-aria-label',
        'data-no-translate',
      ],
    });
  }

  function translate(key, params = null, fallback = null, lang = null) {
    const normalized = normalizeLanguage(lang || currentLanguage);
    const activeDictionary = dictionaries.get(normalized) || {};
    const defaultDictionary = dictionaries.get(DEFAULT_LANGUAGE) || {};
    const resolved = activeDictionary[key] ?? defaultDictionary[key] ?? fallback ?? key;
    return interpolate(resolved, params);
  }

  function applyTranslationToElement(element, value) {
    if (value == null) {
      return;
    }

    if (element.dataset.translateTarget === 'value') {
      element.value = value;
      return;
    }

    if (element.dataset.translateHtml === 'true') {
      element.innerHTML = value;
      return;
    }

    element.textContent = value;
  }

  function translatePage(lang = null) {
    const normalized = normalizeLanguage(lang || currentLanguage);
    if (!dictionaries.has(normalized)) {
      return;
    }

    currentLanguage = normalized;
    document.documentElement.lang = normalized;
    document.documentElement.dataset.language = normalized;

    const pageConfig = getPageConfig();
    if (pageConfig.titleKey) {
      document.title = translate(pageConfig.titleKey, null, pageConfig.title || pageConfig.titleKey, normalized);
    } else if (pageConfig.title) {
      document.title = pageConfig.title;
    }

    document.querySelectorAll('[data-translate-key]').forEach((element) => {
      const key = element.getAttribute('data-translate-key');
      if (!key || element.dataset.noTranslate === 'true') {
        return;
      }
      applyTranslationToElement(element, translate(key, null, element.textContent, normalized));
    });

    document.querySelectorAll('[data-translate-key-placeholder]').forEach((element) => {
      const key = element.getAttribute('data-translate-key-placeholder');
      if (!key || element.dataset.noTranslate === 'true') {
        return;
      }
      element.setAttribute('placeholder', translate(key, null, element.getAttribute('placeholder') || '', normalized));
    });

    document.querySelectorAll('[data-translate-key-value]').forEach((element) => {
      const key = element.getAttribute('data-translate-key-value');
      if (!key || element.dataset.noTranslate === 'true') {
        return;
      }
      element.value = translate(key, null, element.value || '', normalized);
    });

    document.querySelectorAll('[data-translate-key-title]').forEach((element) => {
      const key = element.getAttribute('data-translate-key-title');
      if (!key || element.dataset.noTranslate === 'true') {
        return;
      }
      element.setAttribute('title', translate(key, null, element.getAttribute('title') || '', normalized));
    });

    document.querySelectorAll('[data-translate-key-aria-label]').forEach((element) => {
      const key = element.getAttribute('data-translate-key-aria-label');
      if (!key || element.dataset.noTranslate === 'true') {
        return;
      }
      element.setAttribute('aria-label', translate(key, null, element.getAttribute('aria-label') || '', normalized));
    });

    syncLanguageSelector();
    scheduleMissingVisualTranslationReport();
  }

  function getFlagClass(lang) {
    return FLAG_CLASS_BY_LANGUAGE[normalizeLanguage(lang)] || FLAG_CLASS_BY_LANGUAGE[DEFAULT_LANGUAGE];
  }

  function closeLanguageSelector() {
    if (!languageSelector) {
      return;
    }

    languageSelector.classList.remove('is-open');
    const trigger = languageSelector.querySelector('.language-switcher-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  }

  function syncLanguageSelector() {
    if (!languageSelector) {
      return;
    }

    const trigger = languageSelector.querySelector('.language-switcher-trigger');
    const currentLabel = languageSelector.querySelector('.language-switcher-current-label');

    if (trigger) {
      const triggerFlag = trigger.querySelector('.flag-btn');
      trigger.dataset.lang = currentLanguage;
      if (triggerFlag) {
        triggerFlag.className = `flag-btn ${getFlagClass(currentLanguage)}`;
      }
    }

    if (currentLabel) {
      currentLabel.textContent = translate(`language.${currentLanguage}`, null, currentLanguage.toUpperCase(), currentLanguage);
    }

    languageSelector.querySelectorAll('.language-option').forEach((option) => {
      const optionFlag = option.querySelector('.flag-btn');
      const optionLabel = option.querySelector('.language-option-label');
      const optionLanguage = option.dataset.lang || DEFAULT_LANGUAGE;
      const isActive = optionLanguage === currentLanguage;

      if (optionFlag) {
        optionFlag.className = `flag-btn ${getFlagClass(optionLanguage)}`;
      }

      if (optionLabel) {
        optionLabel.textContent = translate(`language.${optionLanguage}`, null, optionLanguage.toUpperCase(), currentLanguage);
      }

      option.classList.toggle('is-active', isActive);
      option.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  async function changeLanguage(lang) {
    const normalized = normalizeLanguage(lang);
    if (!SUPPORTED_LANGUAGES.includes(normalized)) {
      return false;
    }

    await loadTranslations(DEFAULT_LANGUAGE);
    await loadTranslations(normalized);

    currentLanguage = normalized;
    persistLanguage(normalized);
    translatePage(normalized);
    closeLanguageSelector();
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: normalized } }));
    return true;
  }

  function createLanguageSelector() {
    const wrapper = document.createElement('div');
    wrapper.className = 'language-switcher';
    wrapper.innerHTML = `
      <button class="language-switcher-trigger" type="button" aria-haspopup="true" aria-expanded="false" data-lang="${currentLanguage}">
        <span class="flag-btn ${getFlagClass(currentLanguage)}" aria-hidden="true"></span>
        <span class="language-switcher-current-label">${translate(`language.${currentLanguage}`, null, currentLanguage.toUpperCase(), currentLanguage)}</span>
      </button>
      <div class="language-switcher-menu" role="menu">
        ${SUPPORTED_LANGUAGES.map((lang) => `
          <button class="language-option" type="button" role="menuitemradio" data-lang="${lang}">
            <span class="flag-btn ${getFlagClass(lang)}" aria-hidden="true"></span>
            <span class="language-option-label">${translate(`language.${lang}`, null, lang.toUpperCase(), currentLanguage)}</span>
          </button>
        `).join('')}
      </div>
    `;

    const trigger = wrapper.querySelector('.language-switcher-trigger');
    const options = wrapper.querySelectorAll('.language-option');

    trigger.addEventListener('click', () => {
      const nextState = !wrapper.classList.contains('is-open');
      wrapper.classList.toggle('is-open', nextState);
      trigger.setAttribute('aria-expanded', nextState ? 'true' : 'false');
    });

    options.forEach((option) => {
      option.addEventListener('click', async () => {
        await changeLanguage(option.dataset.lang || DEFAULT_LANGUAGE);
      });
    });

    return wrapper;
  }

  function mountLanguageSelector() {
    const headerRightSection = document.querySelector('.app-header .header-right-section, .global-header .header-right-section');
    if (!headerRightSection) {
      return;
    }

    const existingSelector = headerRightSection.querySelector('.language-switcher');
    if (existingSelector) {
      languageSelector = existingSelector;
      syncLanguageSelector();
      return;
    }

    languageSelector = createLanguageSelector();
    const sessionHost = headerRightSection.querySelector('#userSessionWidgetHost, #loginWidgetContainer');
    if (sessionHost) {
      headerRightSection.insertBefore(languageSelector, sessionHost);
    } else {
      headerRightSection.appendChild(languageSelector);
    }

    syncLanguageSelector();
  }

  function handleDocumentClick(event) {
    if (!languageSelector || languageSelector.contains(event.target)) {
      return;
    }
    closeLanguageSelector();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeLanguageSelector();
    }
  }

  async function initialize() {
    try {
      await loadTranslations(DEFAULT_LANGUAGE);
      await loadTranslations(currentLanguage);
      translatePage(currentLanguage);
      mountLanguageSelector();
      ensureMissingVisualTranslationObserver();
      scheduleMissingVisualTranslationReport();

      if (!readyResolved) {
        readyResolved = true;
        resolveReady(window.MonthlyI18n);
        window.dispatchEvent(new CustomEvent('MonthlyI18nReady', { detail: { language: currentLanguage } }));
      }
    } catch (error) {
      rejectReady(error);
      console.error('[MonthlyI18n] Error al inicializar:', error);
    }
  }

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('globalHeaderReady', mountLanguageSelector);

  window.MonthlyI18n = {
    ready,
    translate,
    translatePage,
    changeLanguage,
    getCurrentLanguage: () => currentLanguage,
    getSupportedLanguages: () => [...SUPPORTED_LANGUAGES],
    mountLanguageSelector,
    scanForMissingVisualTranslations: () => scanForMissingVisualTranslations(document.body),
    reportMissingVisualTranslations,
    isMissingI18nDebugEnabled,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();