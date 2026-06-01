# Referencia Tecnica: Menu de traducciones de OFERTAS

Esta referencia documenta el patron exacto ya implementado en OFERTAS para el menu de idiomas y el i18n ligero asociado. El objetivo es poder portarlo a otro proyecto web sin reinterpretar su arquitectura.

## Fuente de verdad

- `static/js/i18n.js`
- `static/js/globalHeader.js`
- `static/css/global.css`
- `templates/base.html`
- `static/translations/es.json`
- `static/translations/en.json`
- `static/translations/cs.json`

## Resumen del comportamiento real

1. La pagina resuelve un idioma inicial antes de cargar el resto del JS.
2. `i18n.js` normaliza el idioma, carga `es` y luego el idioma activo.
3. `translatePage()` aplica traducciones sobre atributos `data-translate-*`.
4. `globalHeader.js` inicializa el header, monta el selector de idioma y vuelve a traducir la cabecera.
5. El usuario cambia idioma desde un dropdown con banderas CSS.
6. `changeLanguage()` persiste el idioma y emite `languageChanged`.
7. Los modulos que pintan texto dinamico escuchan ese evento y se re-renderizan.

## Bootstrap temprano de idioma

La plantilla base fija `lang` y `data-language` antes del render visible.

```html
<script>
  (function () {
    const aliases = { es: 'es', en: 'en', cs: 'cs', cz: 'cs' };
    let lang = 'es';
    try {
      const saved = localStorage.getItem('language') || localStorage.getItem('appLanguage');
      const browser = navigator.language ? navigator.language.split('-')[0] : 'es';
      lang = aliases[String(saved || browser || 'es').toLowerCase()] || 'es';
    } catch {
      lang = 'es';
    }
    document.documentElement.lang = lang;
    document.documentElement.dataset.language = lang;
  })();
</script>
```

Decision importante:

1. Se conserva compatibilidad con `appLanguage`.
2. `cz` se normaliza a `cs`.
3. El fallback final siempre es `es`.

## Contrato minimo de la plantilla base

```html
<title>{% block title %}Presupuestos{% endblock %}</title>
<script id="pageI18nConfig" type="application/json">
  {"title": "Presupuestos", "titleKey": "app.title"}
</script>

<script src="/static/js/i18n.js"></script>
<script src="/static/js/globalHeader.js" data-title="Presupuestos" data-title-key="app.title"></script>
```

Detalles que no conviene romper:

1. `pageI18nConfig` sirve para traducir el `document.title`.
2. `i18n.js` debe cargarse antes que `globalHeader.js`.
3. El header puede leer titulo desde `pageI18nConfig` o desde `data-title` y `data-title-key` del script.

## Contrato del motor i18n

### Idiomas soportados y alias

```javascript
const DEFAULT_LANGUAGE = 'es';
const SUPPORTED_LANGUAGES = ['es', 'en', 'cs'];
const LANGUAGE_ALIASES = {
  es: 'es',
  en: 'en',
  cs: 'cs',
  cz: 'cs',
};
```

### Carga de diccionarios

```javascript
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
```

Decisiones clave:

1. Los diccionarios se cachean en memoria.
2. Si falla un idioma secundario, cae a `es`.
3. El fetch usa credenciales same-origin.

### Atributos soportados para binding

```javascript
const TRANSLATION_BINDING_ATTRIBUTES = [
  'data-translate-key',
  'data-translate-key-placeholder',
  'data-translate-key-value',
  'data-translate-key-title',
  'data-translate-key-aria-label',
];
```

Esto implica que el portado no esta completo si solo traduces texto plano.

### API publica

```javascript
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
```

## Aplicacion de traducciones al DOM

El motor recorre el DOM y actualiza varios atributos.

```javascript
document.querySelectorAll('[data-translate-key]').forEach((element) => {
  const key = element.getAttribute('data-translate-key');
  applyTranslationToElement(element, translate(key, null, element.textContent, normalized));
});

document.querySelectorAll('[data-translate-key-placeholder]').forEach((element) => {
  const key = element.getAttribute('data-translate-key-placeholder');
  element.setAttribute('placeholder', translate(key, null, element.getAttribute('placeholder') || '', normalized));
});

document.querySelectorAll('[data-translate-key-title]').forEach((element) => {
  const key = element.getAttribute('data-translate-key-title');
  element.setAttribute('title', translate(key, null, element.getAttribute('title') || '', normalized));
});

document.querySelectorAll('[data-translate-key-aria-label]').forEach((element) => {
  const key = element.getAttribute('data-translate-key-aria-label');
  element.setAttribute('aria-label', translate(key, null, element.getAttribute('aria-label') || '', normalized));
});
```

Regla importante:

1. El texto usa `textContent` por defecto.
2. Solo se usa `innerHTML` si el nodo define `data-translate-html="true"`.
3. Los `input` pueden traducir `value` usando `data-translate-key-value`.

## Contrato del header global

El header no contiene el i18n en si, pero crea el host exacto donde se monta el selector.

HTML generado por `globalHeader.js`:

```html
<div class="global-header app-header">
  <div class="header-main-row">
    <div class="header-left-section">
      <a href="/" class="logo-link" title="Ir a Inicio" data-translate-key-title="header.go_home">
        <img class="emesa-logo" src="/static/images/Logo_EMESA.png" alt="EMESA">
      </a>
    </div>
    <span class="header-title" data-translate-key="app.title">Presupuestos</span>
    <div class="header-right-section">
      <div id="userSessionWidgetHost">
        <div id="loginWidgetContainer"></div>
      </div>
    </div>
  </div>
</div>
```

La insercion del selector depende de esta regla:

1. Buscar `.app-header .header-right-section` o `.global-header .header-right-section`.
2. Insertar el selector antes de `#userSessionWidgetHost` o `#loginWidgetContainer`.

## HTML real del selector de idioma

```html
<div class="language-switcher">
  <button class="language-switcher-trigger" type="button" aria-haspopup="true" aria-expanded="false" data-lang="es">
    <span class="flag-btn es" aria-hidden="true"></span>
    <span class="language-switcher-current-label">Español</span>
  </button>
  <div class="language-switcher-menu" role="menu">
    <button class="language-option" type="button" role="menuitemradio" data-lang="es">
      <span class="flag-btn es" aria-hidden="true"></span>
      <span class="language-option-label">Español</span>
    </button>
    <button class="language-option" type="button" role="menuitemradio" data-lang="en">
      <span class="flag-btn uk" aria-hidden="true"></span>
      <span class="language-option-label">English</span>
    </button>
    <button class="language-option" type="button" role="menuitemradio" data-lang="cs">
      <span class="flag-btn cz" aria-hidden="true"></span>
      <span class="language-option-label">Čeština</span>
    </button>
  </div>
</div>
```

Decisiones a mantener:

1. El trigger usa `aria-haspopup` y `aria-expanded`.
2. Cada opcion usa `role="menuitemradio"`.
3. La flag visible se recalcula al sincronizar el selector.

## CSS minimo a portar

```css
.language-switcher {
  position: relative;
}

.language-switcher-trigger {
  align-items: center;
  background: rgba(7, 27, 62, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 999px;
  color: #fff;
  display: inline-flex;
  gap: 10px;
  min-height: 46px;
  padding: 6px 14px 6px 8px;
}

.language-switcher-menu {
  background: rgba(5, 31, 75, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(5, 23, 51, 0.35);
  display: none;
  min-width: 210px;
  padding: 10px;
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  z-index: 1100;
}

.language-switcher.is-open .language-switcher-menu {
  display: block;
}

.flag-btn {
  border: 2px solid #fff;
  border-radius: 50%;
  height: 40px;
  width: 40px;
}

.flag-btn.es {
  background: linear-gradient(to bottom, #aa151b 0 25%, #f1bf00 25% 75%, #aa151b 75% 100%);
}

.flag-btn.uk {
  background-color: #012169;
}

.flag-btn.cz {
  background: linear-gradient(to bottom, #ffffff 0 50%, #d7141a 50% 100%);
}
```

Notas practicas:

1. La implementacion real del repo incluye el dibujo completo de Union Jack por gradientes.
2. La flag checa usa un pseudo-elemento `::before` para el triangulo azul.
3. En movil se oculta `.language-switcher-current-label` y se reducen las flags.

## Cambio de idioma y eventos

```javascript
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
```

Esta emision no es opcional si quieres replicar el comportamiento del repo.

## Consumidores reales del evento

### Ofertas

```javascript
window.addEventListener('languageChanged', refreshTranslatedUi);
```

### Login modal

```javascript
window.addEventListener('languageChanged', () => {
  if (loginModalState.isOpen && window.GlobalHeader && window.GlobalHeader.translatePage) {
    window.GlobalHeader.translatePage();
  }

  updateUserWidget();
});
```

Regla de portado:

1. Todo modulo que construya texto con JS debe engancharse a `languageChanged`.
2. Si el modulo ya usa `GlobalHeader.translate()` o `GlobalHeader.getCurrentLanguage()`, no hace falta duplicar logica de idioma.

## Claves minimas del diccionario

Ejemplo real:

```json
{
  "app.title": "Presupuestos",
  "header.go_home": "Ir a Inicio",
  "language.cs": "Čeština",
  "language.en": "English",
  "language.es": "Español"
}
```

El menu no queda completo si faltan esas claves.

## Deteccion de textos visibles sin traducir

El sistema incluye una utilidad de diagnostico para localizar UI visible sin binding i18n.

Activacion:

1. `localStorage.setItem('i18nDebugMissing', '1')`
2. O abrir la pagina con `?i18n_debug=1`

Comportamiento:

1. Escanea texto visible, placeholders, titles y `aria-labels`.
2. Ignora nodos con `data-no-translate="true"`.
3. Emite `MonthlyI18nMissingVisuals`.
4. Escribe advertencias en consola con los selectores y textos detectados.

Esto es util si portas el menu y quieres verificar que el resto del HTML nuevo quedo bien etiquetado.

## Orden de implementacion recomendado en otro proyecto

1. Crear `static/translations/es.json`, `en.json` y `cs.json` con las claves del menu.
2. Copiar el bootstrap temprano de idioma a la plantilla base.
3. Copiar `i18n.js` y adaptar solo la URL de fetch si cambian las rutas estaticas.
4. Copiar los estilos del selector y de las flags a la hoja global.
5. Copiar o adaptar `globalHeader.js` para que exista un host valido del selector.
6. Marcar el DOM con `data-translate-*`.
7. Conectar `languageChanged` en los modulos que pintan UI dinamica.
8. Validar el modo debug para detectar huecos de traduccion.

## Errores tipicos al portar

1. Cargar `globalHeader.js` antes de `i18n.js` y dejar el selector sin montar.
2. Mantener textos visibles en HTML sin `data-translate-key`.
3. Traducir solo texto de nodos y olvidar `placeholder`, `title` o `aria-label`.
4. Quitar el alias `cz -> cs` y romper usuarios con preferencia guardada antigua.
5. No re-renderizar tablas, chips o mensajes creados por JS al cambiar idioma.
6. Cambiar el host del header sin adaptar `mountLanguageSelector()`.

## Checklist rapido de aceptacion

1. El header pinta el selector con la flag correcta en la primera carga.
2. El dropdown abre y cierra por click exterior y por `Escape`.
3. Cambiar a `en` o `cs` actualiza inmediatamente la pagina.
4. Al recargar, el idioma se conserva.
5. Si el JSON del idioma falla, la pagina sigue operativa en `es`.
6. Los modulos dinamicos se actualizan tras `languageChanged`.
7. Con el modo debug activo no quedan textos visibles sin binding en las pantallas objetivo.