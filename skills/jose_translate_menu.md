# Skill: jose_translate_menu

## Objetivo

Esta skill describe un selector de idioma reutilizable para aplicaciones web renderizadas con HTML servidor + JavaScript cliente.

Su propósito es dejar una solución portable que:

- detecte idioma inicial antes del render visible
- cargue diccionarios JSON por idioma
- traduzca la página por atributos declarativos
- inserte un menú visual de idiomas en el header
- persista el idioma en `localStorage`
- emita eventos para que el resto de la app pueda reaccionar
- sea compatible con código heredado si ya existe una API previa de traducción

La implementación validada en este proyecto está basada en:

- `static/js/i18n.js`
- `static/js/globalHeader.js`
- `templates/base.html`
- `static/css/global.css`

## Cuándo usar esta skill

Usa esta skill cuando quieras replicar en otro proyecto:

- un menú de idiomas en el header
- traducción cliente con JSON por idioma
- traducción declarativa con `data-translate-*`
- persistencia de idioma entre recargas
- compatibilidad entre una API nueva `MonthlyI18n` y una API heredada del proyecto

No la uses como referencia principal si:

- el proyecto ya tiene un framework i18n fuerte como `react-intl`, `i18next`, `vue-i18n` o similar y no quieres duplicar capas
- el idioma depende del backend y no quieres persistirlo en cliente
- la app no tiene un header común donde montar el selector

## Resultado esperado

Al integrar correctamente esta skill, el proyecto debe tener:

1. Un idioma inicial resuelto antes de pintar la interfaz.
2. Un módulo global `window.MonthlyI18n` listo para traducciones y cambio de idioma.
3. Un selector visual de banderas montado dinámicamente en el header.
4. Traducción automática del título y de nodos marcados con atributos `data-translate-*`.
5. Eventos `MonthlyI18nReady` y `languageChanged` para rehidratar componentes.
6. Persistencia en `language` y `appLanguage`.
7. Compatibilidad opcional con una API antigua como `window.GlobalHeader.translate()`.

## Arquitectura mínima

La solución se divide en 4 piezas.

### 1. Bootstrap temprano del idioma

Antes del render principal, la plantilla debe fijar `html[lang]` leyendo:

- `localStorage.language`
- `localStorage.appLanguage`
- `navigator.language`

También debe normalizar alias, especialmente:

- `cz -> cs`

### 2. Módulo i18n dedicado

Debe existir un archivo como `i18n.js` que:

- mantenga `SUPPORTED_LANGUAGES`
- cargue `/static/translations/<lang>.json` o la ruta equivalente en el proyecto
- traduzca el DOM
- monte el selector visual
- persista el idioma
- exponga una API global estable

### 3. Integración con el header

El header no debe hardcodear el selector en HTML. Debe dejar un contenedor `.header-right-section` y permitir que el módulo lo inserte.

Si existe widget de usuario o sesión, el selector se monta antes de:

- `#userSessionWidgetHost`
- o, como fallback, antes de `#loginWidgetContainer`

### 4. Estilos del selector

El CSS debe vivir en la hoja global del header o en la hoja compartida del layout, no dentro de cada pantalla.

## Contrato HTML

La plantilla base debe incluir como mínimo:

### Script JSON de configuración de título

```html
<script id="pageI18nConfig" type="application/json">
  {"title":"Dashboard","titleKey":"page.dashboard"}
</script>
```

Este bloque permite que el módulo traduzca `document.title` y sincronice el título visual del header.

### Bootstrap temprano del idioma

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

### Header compatible

```html
<header class="app-header">
  <div class="header-main-row">
    <div class="header-left-section"></div>
    <h1 class="header-title" data-translate-key="page.dashboard">Dashboard</h1>
    <div class="header-right-section">
      <div id="userSessionWidgetHost"></div>
    </div>
  </div>
</header>
```

### Orden de scripts

El módulo i18n debe cargarse antes del bootstrap principal de la página:

```html
<script src="/static/js/i18n.js"></script>
<script src="/static/js/globalHeader.js"></script>
<script src="/static/js/app.js"></script>
```

Si el proyecto tiene cargas dinámicas o el orden es incierto, el bootstrap del header debe incluir un fallback para cargar `i18n.js` por sí mismo.

## Contrato JS

La API pública del módulo debe ser esta:

- `window.MonthlyI18n.ready`
- `window.MonthlyI18n.translate(key, params, fallback, lang)`
- `window.MonthlyI18n.translatePage(lang)`
- `window.MonthlyI18n.changeLanguage(lang)`
- `window.MonthlyI18n.getCurrentLanguage()`
- `window.MonthlyI18n.getSupportedLanguages()`
- `window.MonthlyI18n.mountLanguageSelector()`

### Comportamiento de `ready`

`ready` debe ser una `Promise` resuelta cuando:

- el idioma inicial ya está decidido
- el diccionario por defecto ya está cargado
- el diccionario actual ya está cargado
- la página ya fue traducida una primera vez
- el selector ya pudo intentar montarse

### Eventos emitidos

El módulo debe emitir:

- `MonthlyI18nReady`
- `languageChanged`

`languageChanged` debe incluir al menos:

```js
{ detail: { language: normalizedLang } }
```

## Flujo completo de inicialización

El flujo recomendado es este:

1. La plantilla fija `html[lang]` antes del render.
2. `i18n.js` se carga y crea `window.MonthlyI18n`.
3. El módulo resuelve el idioma desde storage o navegador.
4. Carga primero el diccionario por defecto.
5. Carga después el diccionario del idioma actual.
6. Traduce la página.
7. Intenta montar el selector en el header.
8. Resuelve `ready`.
9. Emite `MonthlyI18nReady`.
10. Los componentes de la app esperan `ready` antes de inicializar texto dependiente del idioma.

## Contrato de traducción declarativa

Esta skill soporta estos atributos:

- `data-translate-key`
- `data-translate-key-placeholder`
- `data-translate-key-value`
- `data-translate-key-title`
- `data-translate-key-aria-label`
- `data-translate-target="value"`
- `data-translate-html="true"`
- `data-no-translate="true"`

### Regla de `data-translate-key`

Se usa para texto visible del nodo.

```html
<span data-translate-key="nav.home">Inicio</span>
```

### Regla de placeholder

```html
<input data-translate-key-placeholder="auth.username_placeholder" placeholder="Usuario">
```

### Regla de title

```html
<button data-translate-key-title="header.go_home" title="Ir a inicio"></button>
```

### Regla de aria-label

```html
<button data-translate-key-aria-label="auth.logout_tooltip" aria-label="Cerrar sesión"></button>
```

### Exclusión de traducción

Si un nodo no debe tocarse, usar:

```html
data-no-translate="true"
```

## Reglas de idioma

### Idiomas soportados

Por defecto:

```js
['es', 'en', 'cs']
```

### Normalización

Reglas mínimas:

- `es -> es`
- `en -> en`
- `cs -> cs`
- `cz -> cs`
- cualquier valor no soportado cae a `es`

### Persistencia

Guardar siempre ambos valores:

- `language`
- `appLanguage`

Esto evita romper compatibilidad con vistas heredadas o integraciones anteriores.

## Contrato CSS

Clases mínimas a replicar:

- `.language-switcher`
- `.language-switcher-trigger`
- `.language-switcher-menu`
- `.language-option`
- `.language-switcher-current-label`
- `.flag-btn`
- `.flag-btn.es`
- `.flag-btn.uk`
- `.flag-btn.cz`

### Requisitos visuales mínimos

- Trigger con fondo translúcido azul oscuro.
- Borde redondeado completo tipo píldora.
- Menú flotante alineado a la derecha.
- Menú con fondo azul oscuro semitransparente.
- Opciones con hover visible.
- Bandera activa con borde dorado y glow.
- Banderas circulares de 40px.
- Responsive: en móvil puede ocultarse el texto y dejar solo la bandera.

## Lógica del selector

### Montaje

`mountLanguageSelector()` debe:

1. localizar `.app-header .header-right-section` o `.global-header .header-right-section`
2. evitar insertar un segundo selector si ya existe
3. insertar el selector antes del host de sesión si existe
4. si no existe host de sesión, insertarlo al final del contenedor derecho

### Interacciones mínimas

Debe soportar:

- click en el trigger para abrir o cerrar
- click en una opción para cambiar idioma
- click fuera para cerrar
- tecla `Escape` para cerrar

### Sincronización visual

Después de cambiar idioma, el selector debe:

- cambiar la bandera del trigger
- cambiar el texto del idioma actual
- marcar la opción activa
- actualizar `aria-expanded`
- cerrar el menú

## Integración con header heredado

Si el proyecto ya expone una API previa como `window.GlobalHeader`, no dupliques la lógica de traducción. En su lugar:

- mueve la lógica real a `window.MonthlyI18n`
- deja `window.GlobalHeader` como wrapper de compatibilidad

Ejemplo de wrappers:

```js
window.GlobalHeader = {
  translate: (...args) => window.MonthlyI18n.translate(...args),
  translatePage: (...args) => window.MonthlyI18n.translatePage(...args),
  changeLanguage: (...args) => window.MonthlyI18n.changeLanguage(...args),
  getCurrentLanguage: () => window.MonthlyI18n.getCurrentLanguage(),
  getSupportedLanguages: () => window.MonthlyI18n.getSupportedLanguages(),
};
```

### Fallback recomendable

Si el header puede cargarse antes que `i18n.js`, añade una función tipo `ensureI18nLoaded()` que:

1. compruebe si `window.MonthlyI18n` existe
2. si no existe, cargue `i18n.js`
3. espere `window.MonthlyI18n.ready`
4. continúe con el render del header

Esto evita errores de orden de carga entre plantillas o páginas especiales.

## Integración con la app principal

La aplicación debe esperar `ready` antes de arrancar componentes que dependan del idioma.

Ejemplo:

```js
document.addEventListener('DOMContentLoaded', async () => {
  if (window.MonthlyI18n && window.MonthlyI18n.ready) {
    try {
      await window.MonthlyI18n.ready;
    } catch {
      // fallback silencioso
    }
  }

  initApp();
});
```

Esto es especialmente importante si:

- generas columnas traducidas de tablas
- montas modales con textos traducibles
- construyes placeholders en JS
- renderizas navegación lateral con nombres traducidos

## Estructura recomendada de traducciones

Ruta recomendada:

- `/static/translations/es.json`
- `/static/translations/en.json`
- `/static/translations/cs.json`

Cada JSON debe incluir al menos:

```json
{
  "language.es": "Español",
  "language.en": "English",
  "language.cs": "Čeština"
}
```

Además, conviene tener claves para:

- título de página
- navegación
- acciones del header
- login/logout
- placeholders comunes
- estados de tablas y formularios

## Checklist de portabilidad

### HTML

1. Añadir bootstrap temprano del idioma.
2. Añadir `pageI18nConfig`.
3. Asegurar `.app-header` o un header compatible.
4. Asegurar `.header-right-section`.
5. Añadir `#userSessionWidgetHost` si existe sesión o usuario.

### JS

1. Crear módulo dedicado `i18n.js`.
2. Mantener `SUPPORTED_LANGUAGES = ['es', 'en', 'cs']` si no hay otra necesidad.
3. Mantener alias `cz -> cs`.
4. Exponer `window.MonthlyI18n.ready`.
5. Emitir `MonthlyI18nReady` y `languageChanged`.
6. Hacer que la app espere `ready`.
7. Si hay API previa, dejar wrappers de compatibilidad.
8. Si hay carga desordenada, añadir `ensureI18nLoaded()`.

### CSS

1. Portar las clases del selector.
2. Mantener trigger translúcido y menú flotante.
3. Mantener las banderas circulares de 40px.
4. Mantener estado activo con borde dorado.
5. Añadir responsive para ocultar el label si hace falta.

### Traducciones

1. Verificar `language.es`, `language.en`, `language.cs`.
2. Verificar claves del título de página.
3. Verificar textos del header y sesión.
4. Verificar placeholders y `aria-label`.

## Errores comunes al portar

### 1. Cargar solo el JS y olvidar el CSS

Síntoma:

- el selector existe, pero se ve roto o como botones sin estilo

Solución:

- portar las clases CSS del selector junto al módulo

### 2. Insertar el selector manualmente en HTML

Síntoma:

- aparece duplicado

Solución:

- dejar que `mountLanguageSelector()` sea la única fuente de montaje

### 3. Arrancar la app antes de `ready`

Síntoma:

- tablas o modales construidos con claves sin traducir
- labels inconsistentes entre pantallas
- errores por dependencias aún no cargadas

Solución:

- esperar `window.MonthlyI18n.ready`

### 4. No mantener `language` y `appLanguage`

Síntoma:

- algunas vistas recuerdan idioma y otras no
- integración heredada rota

Solución:

- persistir ambas claves

### 5. No traducir `document.title`

Síntoma:

- el header cambia de idioma pero la pestaña del navegador no

Solución:

- usar `pageI18nConfig` y traducirlo desde el módulo

### 6. No controlar click fuera o `Escape`

Síntoma:

- el menú queda abierto y molesta la interacción

Solución:

- registrar listeners globales para click y teclado

### 7. Depender solo del orden ideal de scripts

Síntoma:

- en unas páginas funciona y en otras `MonthlyI18n` no existe

Solución:

- añadir fallback de carga en el bootstrap del header o del layout

## Pruebas mínimas obligatorias

Cuando portes esta skill, valida al menos lo siguiente.

### Pruebas de carga

1. La página abre con el idioma persistido previamente.
2. Si no hay idioma guardado, se usa `navigator.language`.
3. Si `navigator.language` trae `cz`, se resuelve a `cs`.
4. Si el JSON del idioma no existe, hace fallback al idioma por defecto.

### Pruebas de UI

1. El selector aparece en el header.
2. El selector se coloca antes del widget de sesión.
3. El menú abre al pulsar el trigger.
4. El menú cierra al pulsar fuera.
5. El menú cierra con `Escape`.
6. La opción activa queda resaltada correctamente.

### Pruebas funcionales

1. Cambiar a inglés traduce título, header y contenido.
2. Volver a español restaura el contenido.
3. La recarga mantiene el idioma elegido.
4. Los componentes que dependen de traducciones construidas en JS arrancan bien.
5. No aparecen errores en consola al cambiar de idioma.

### Pruebas de compatibilidad

1. Si existe `window.GlobalHeader.translate`, sigue funcionando.
2. Login/logout siguen traduciendo texto y tooltips.
3. El resto de la app sigue escuchando `languageChanged` sin cambios.

## Patrón de adopción recomendado

Para replicarlo en un proyecto nuevo, sigue este orden:

1. Crear `i18n.js` con API pública y `ready`.
2. Portar CSS del selector.
3. Añadir bootstrap temprano en la plantilla base.
4. Añadir `pageI18nConfig`.
5. Adaptar el header para tener `.app-header` y `.header-right-section`.
6. Hacer que el header cargue o consuma `MonthlyI18n`.
7. Hacer que la app principal espere `ready`.
8. Validar cambio de idioma, persistencia y cierre del menú.
9. Si existe una API heredada, dejar wrappers y migrar gradualmente.

## Decisiones de diseño recomendadas

- Mantén la lógica de traducción en un solo módulo.
- Evita dos sistemas de i18n paralelos.
- Trata el header como integración, no como fuente de verdad de traducciones.
- Traduce por atributos declarativos siempre que sea posible.
- Usa wrappers de compatibilidad para migraciones progresivas.
- Haz fallback al idioma por defecto de forma silenciosa y segura.
- No rompas el arranque de la app si falla una traducción puntual.

## Plantilla mínima reutilizable

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

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
    })();
  </script>

  <script id="pageI18nConfig" type="application/json">
    {"title":"Dashboard","titleKey":"page.dashboard"}
  </script>

  <link rel="stylesheet" href="/static/css/global.css">
</head>
<body>
  <header class="app-header">
    <div class="header-main-row">
      <div class="header-left-section"></div>
      <h1 class="header-title" data-translate-key="page.dashboard">Dashboard</h1>
      <div class="header-right-section">
        <div id="userSessionWidgetHost"></div>
      </div>
    </div>
  </header>

  <script src="/static/js/i18n.js"></script>
  <script src="/static/js/app.js"></script>
</body>
</html>
```

## Resumen corto

Esta skill implementa un menú de traducción portable, visual y compatible con proyectos heredados.

La clave para replicarla bien es respetar 5 contratos:

1. Bootstrap temprano del idioma.
2. Módulo único `MonthlyI18n`.
3. Header con contenedor de montaje.
4. CSS del selector.
5. Espera explícita a `ready` en la app principal.

Si esos 5 puntos se respetan, el selector se puede portar con poco riesgo a proyectos futuros.
