// globalHeader.js - Sistema de Header Global Reutilizable
// =====================================================================
// Incluir este script en cualquier página para tener un header consistente
// Uso: <script src="/static/globalHeader.js" data-title="Mi Título"></script>
// O llamar: initGlobalHeader({ title: 'Mi Título' });

(function() {
  'use strict';

  // Configuración por defecto
  const HEADER_CONFIG = {
    logoSrc: '/static/images/Logo_EMESA.png',
    logoAlt: 'EMESA',
    homeUrl: '/',
    loginWidgetId: 'loginWidgetContainer'
  };

  // Función para obtener el título de la página
  function getPageTitle() {
    // 1. Buscar data-title en el script
    const scripts = document.querySelectorAll('script[src*="globalHeader.js"]');
    for (const script of scripts) {
      if (script.dataset.title) {
        return script.dataset.title;
      }
    }
    
    // 2. Usar el título del documento
    return document.title || 'SGA EMESA';
  }

  // Función para crear el HTML del header
  function createHeaderHTML(title) {
    return `
      <link rel="stylesheet" href="/static/css/loginModal.css">
      <div class="global-header">
        <div class="header-main-row">
          <div class="header-left-section">
            <a href="${HEADER_CONFIG.homeUrl}" class="logo-link" title="Ir a Inicio">
              <img class="emesa-logo" src="${HEADER_CONFIG.logoSrc}" alt="${HEADER_CONFIG.logoAlt}">
            </a>
          </div>
          <span class="header-title" data-original-text="${title}">${title}</span>
          <div class="header-right-section">
            <div id="${HEADER_CONFIG.loginWidgetId}"></div>
          </div>
        </div>
      </div>
    `;
  }

  // Función para crear los estilos del header
  function createHeaderStyles() {
    if (document.getElementById('globalHeaderStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'globalHeaderStyles';
    styles.textContent = `
      /* ========================================= */
      /* GLOBAL HEADER STYLES                      */
      /* ========================================= */
      
      .global-header {
        background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
        padding: 12px 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        position: relative;
        z-index: 1000;
      }

      .global-header .header-main-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 0 20px;
        box-sizing: border-box;
      }

      .global-header .header-left-section {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .global-header .logo-link {
        display: flex;
        align-items: center;
        text-decoration: none;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }

      .global-header .logo-link:hover {
        transform: scale(1.05);
        opacity: 0.9;
      }

      .global-header .emesa-logo {
        height: 45px;
        width: auto;
        cursor: pointer;
      }

      .global-header .header-title {
        color: #fff;
        font-size: 1.5rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      .global-header .header-right-section {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      /* Contenedor para el widget de login */
      .global-header #${HEADER_CONFIG.loginWidgetId} {
        display: flex;
        align-items: center;
      }

      /* Responsive */
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

  // Función para cargar scripts externos
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // Verificar si ya está cargado
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

  // Función para inicializar el header
  async function initGlobalHeader(options = {}) {
    const title = options.title || getPageTitle();

    // Crear estilos
    createHeaderStyles();

    // Buscar o crear contenedor del header
    let headerContainer = document.querySelector('.header');
    
    if (headerContainer) {
      // Reemplazar header existente
      headerContainer.outerHTML = createHeaderHTML(title);
    } else {
      // Insertar al principio del body
      const headerDiv = document.createElement('div');
      headerDiv.innerHTML = createHeaderHTML(title);
      document.body.insertBefore(headerDiv.firstElementChild, document.body.firstChild);
    }

    // Cargar scripts necesarios
    try {
      await loadScript('/static/js/loginModal.js');
      await loadScript('/static/js/sharedSession.js');

      // Inicializar el widget de login manualmente después de cargar el script
      if (typeof LoginModal !== 'undefined' && LoginModal.init) {
        LoginModal.init();
      }

      // Inicializar sesión compartida
      if (typeof SharedSession !== 'undefined' && SharedSession.init) {
        SharedSession.init();
      }
    } catch (error) {
      console.error('[GlobalHeader] Error cargando scripts:', error);
    }

    console.log('[GlobalHeader] Header inicializado correctamente');
  }

  // Función para actualizar el título del header
  function updateHeaderTitle(newTitle) {
    const titleElement = document.querySelector('.global-header .header-title');
    if (titleElement) {
      titleElement.textContent = newTitle;
      titleElement.dataset.originalText = newTitle;
      
      // Traducir inmediatamente si el sistema está disponible
      if (window.GlobalHeader && window.GlobalHeader.translatePage) {
        window.GlobalHeader.translatePage();
      }
    }
  }

  // =====================================================================
  // SISTEMA DE TRADUCCIÓN MULTI-IDIOMA
  // =====================================================================

  let translations = {};
  let currentLanguage = 'es';
  const SUPPORTED_LANGUAGES = ['es', 'en', 'cs'];
  const LANGUAGE_NAMES = {
    'es': 'Español',
    'en': 'English',
    'cs': 'Čeština'
  };

  // Función para cargar traducciones desde JSON
  async function loadTranslations(lang) {
    try {
      const response = await fetch(`/static/translations/${lang}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      translations[lang] = data;
      console.log(`[GlobalHeader] Traducciones cargadas para: ${lang}`);
      return true;
    } catch (error) {
      console.error(`[GlobalHeader] Error cargando traducciones ${lang}:`, error);
      return false;
    }
  }

  // Función para traducir un string
  function translate(key, lang = null) {
    const targetLang = lang || currentLanguage;
    
    if (!translations[targetLang]) {
      console.warn(`[GlobalHeader] Idioma no cargado: ${targetLang}`);
      return key;
    }
    
    return translations[targetLang][key] || key;
  }

  // Función para traducir el DOM recursivamente
  function translatePage(lang = null) {
    const targetLang = lang || currentLanguage;
    
    if (!translations[targetLang]) {
      // Puede ocurrir durante el arranque cuando el modal de login se monta
      // antes de terminar la carga de traducciones.
      return;
    }

    // Traducir textos (data-original-text)
    document.querySelectorAll('[data-original-text]').forEach(element => {
      if (element.dataset.noTranslate === 'true') return;
      
      const originalText = element.dataset.originalText;
      const translatedText = translate(originalText, targetLang);
      
      // Actualizar solo el contenido de texto, no los hijos
      if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
        element.textContent = translatedText;
      } else {
        // Si tiene hijos, actualizar solo el primer nodo de texto
        for (let node of element.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = translatedText;
            break;
          }
        }
      }
    });

    // Traducir placeholders (data-original-placeholder)
    document.querySelectorAll('[data-original-placeholder]').forEach(element => {
      if (element.dataset.noTranslate === 'true') return;
      
      const originalPlaceholder = element.dataset.originalPlaceholder;
      element.placeholder = translate(originalPlaceholder, targetLang);
    });

    // Traducir títulos/tooltips (data-original-title)
    document.querySelectorAll('[data-original-title]').forEach(element => {
      if (element.dataset.noTranslate === 'true') return;
      
      const originalTitle = element.dataset.originalTitle;
      element.title = translate(originalTitle, targetLang);
    });

    console.log(`[GlobalHeader] Página traducida a: ${LANGUAGE_NAMES[targetLang]}`);
  }

  // Función para cambiar el idioma
  async function changeLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      console.error(`[GlobalHeader] Idioma no soportado: ${lang}`);
      return false;
    }

    // Cargar traducciones si no están en caché
    if (!translations[lang]) {
      const loaded = await loadTranslations(lang);
      if (!loaded) return false;
    }

    currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);
    
    // Traducir la página actual
    translatePage(lang);

    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));

    return true;
  }

  // Función para crear el selector de idioma con botones de bandera
  function createLanguageSelector() {
    const selectorHTML = `
      <div class="language-buttons">
        <button class="flag-btn es ${currentLanguage === 'es' ? 'active' : ''}" 
                data-lang="es" 
                data-no-translate="true"
                title="Español"></button>
        <button class="flag-btn uk ${currentLanguage === 'en' ? 'active' : ''}" 
                data-lang="en" 
                data-no-translate="true"
                title="English"></button>
        <button class="flag-btn cz ${currentLanguage === 'cs' ? 'active' : ''}" 
                data-lang="cs" 
                data-no-translate="true"
                title="Čeština"></button>
      </div>
    `;

    // Agregar estilos del selector
    const styles = `
      <style id="languageSelectorStyles">
        /* Contenedor de botones */
        .language-buttons {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-left: 15px;
        }

        /* Estilos base para los botones de bandera */
        .flag-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          background-position: center;
          background-size: cover;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          outline: none;
          overflow: hidden;
        }

        /* Efecto hover */
        .flag-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        }

        /* Estado activo (idioma seleccionado) */
        .flag-btn.active {
          border: 3px solid #FFD700;
          box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
          transform: scale(1.05);
        }

        /* Bandera de España 🇪🇸 */
        .flag-btn.es {
          background: linear-gradient(to bottom,
            #AA151B 0%,
            #AA151B 25%,
            #F1BF00 25%,
            #F1BF00 75%,
            #AA151B 75%,
            #AA151B 100%
          );
        }

        /* Bandera del Reino Unido 🇬🇧 */
        .flag-btn.uk {
          background-color: #012169;
          background-image:
            /* Cruz roja vertical/horizontal */
            linear-gradient(90deg, transparent 46%, #C8102E 46%, #C8102E 54%, transparent 54%),
            linear-gradient(0deg, transparent 46%, #C8102E 46%, #C8102E 54%, transparent 54%),
            /* Bordes blancos de la cruz */
            linear-gradient(90deg, transparent 42%, #FFFFFF 42%, #FFFFFF 58%, transparent 58%),
            linear-gradient(0deg, transparent 42%, #FFFFFF 42%, #FFFFFF 58%, transparent 58%),
            /* Diagonales rojas finas */
            linear-gradient(135deg, transparent 48%, #C8102E 48%, #C8102E 52%, transparent 52%),
            linear-gradient(45deg, transparent 48%, #C8102E 48%, #C8102E 52%, transparent 52%),
            /* Diagonales blancas gruesas */
            linear-gradient(135deg, transparent 45%, #FFFFFF 45%, #FFFFFF 55%, transparent 55%),
            linear-gradient(45deg, transparent 45%, #FFFFFF 45%, #FFFFFF 55%, transparent 55%);
        }

        /* Bandera de República Checa 🇨🇿 */
        .flag-btn.cz {
          background: linear-gradient(to bottom, #FFFFFF 50%, #D7141A 50%);
          position: relative;
        }

        /* Triángulo azul de la bandera checa */
        .flag-btn.cz::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 0;
          width: 0;
          height: 0;
          border-top: 20px solid transparent;
          border-bottom: 20px solid transparent;
          border-left: 24px solid #11457E;
        }

        /* Responsive: reducir tamaño en móviles */
        @media (max-width: 768px) {
          .flag-btn {
            width: 35px;
            height: 35px;
          }

          .flag-btn.cz::before {
            border-top: 17.5px solid transparent;
            border-bottom: 17.5px solid transparent;
            border-left: 21px solid #11457E;
          }

          .language-buttons {
            gap: 8px;
            margin-left: 10px;
          }
        }

        @media (max-width: 480px) {
          .flag-btn {
            width: 32px;
            height: 32px;
            border: 1.5px solid white;
          }

          .flag-btn.active {
            border: 2px solid #FFD700;
          }

          .flag-btn.cz::before {
            border-top: 16px solid transparent;
            border-bottom: 16px solid transparent;
            border-left: 19px solid #11457E;
          }

          .language-buttons {
            gap: 6px;
            margin-left: 8px;
          }
        }
      </style>
    `;

    // Insertar estilos si no existen
    if (!document.getElementById('languageSelectorStyles')) {
      document.head.insertAdjacentHTML('beforeend', styles);
    }

    return selectorHTML;
  }

  // Función para inicializar el selector de idioma
  function initLanguageSelector() {
    const headerRightSection = document.querySelector('.global-header .header-right-section');
    
    if (!headerRightSection) {
      console.warn('[GlobalHeader] No se encontró header-right-section');
      return;
    }

    // Crear e insertar el selector
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = createLanguageSelector();
    headerRightSection.insertBefore(tempDiv.firstElementChild, headerRightSection.firstChild);

    // Agregar event listeners a los botones de bandera
    document.querySelectorAll('.flag-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const lang = btn.dataset.lang;
        
        if (lang === currentLanguage) return;

        const success = await changeLanguage(lang);
        
        if (success) {
          // Actualizar estado visual de los botones
          document.querySelectorAll('.flag-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });

    console.log('[GlobalHeader] Selector de idioma inicializado con botones de bandera');
  }

  // Función para cargar el idioma guardado
  async function loadSavedLanguage() {
    const savedLang = localStorage.getItem('appLanguage') || 'es';
    
    if (!SUPPORTED_LANGUAGES.includes(savedLang)) {
      console.warn(`[GlobalHeader] Idioma guardado no válido: ${savedLang}`);
      currentLanguage = 'es';
      return;
    }

    currentLanguage = savedLang;
    
    // Cargar todas las traducciones en paralelo
    await Promise.all(SUPPORTED_LANGUAGES.map(lang => loadTranslations(lang)));
    
    // Traducir la página con el idioma guardado
    translatePage(currentLanguage);
  }

  // API pública
  window.GlobalHeader = {
    init: initGlobalHeader,
    updateTitle: updateHeaderTitle,
    config: HEADER_CONFIG,
    // API de traducción
    translate: translate,
    translatePage: translatePage,
    changeLanguage: changeLanguage,
    getCurrentLanguage: () => currentLanguage,
    getSupportedLanguages: () => SUPPORTED_LANGUAGES,
    reloadTranslations: loadSavedLanguage
  };

  // Auto-inicialización cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      // Solo auto-inicializar si el script tiene el atributo data-auto-init
      const script = document.querySelector('script[src*="globalHeader.js"]');
      if (script && script.dataset.autoInit !== 'false') {
        await initGlobalHeader();
        await loadSavedLanguage();
        initLanguageSelector();
      }
    });
  } else {
    // DOM ya está listo
    const script = document.querySelector('script[src*="globalHeader.js"]');
    if (script && script.dataset.autoInit !== 'false') {
      (async () => {
        await initGlobalHeader();
        await loadSavedLanguage();
        initLanguageSelector();
      })();
    }
  }

})();
