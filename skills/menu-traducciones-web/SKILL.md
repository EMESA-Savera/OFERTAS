---
name: menu-traducciones-web
description: Replicar el menu de traducciones e i18n ligero usado en OFERTAS: selector de idioma con banderas en el header, carga de diccionarios JSON desde `/static/translations`, traduccion por atributos `data-translate-*`, persistencia en `localStorage`, eventos `MonthlyI18nReady` y `languageChanged`, y rehidratacion de UI dinamica tras cambiar idioma. Usar cuando el usuario pida portar el menu de idiomas, el dropdown de banderas o el patron completo de traducciones frontend a otro proyecto web.
---

# Menu Traducciones Web

Esta skill empaqueta el patron real que ya funciona en OFERTAS para el menu de traducciones. No describe un i18n generico ni una libreria externa: documenta el contrato concreto de este proyecto para poder replicarlo en otros frontends con el menor numero posible de decisiones nuevas.

## Cuando usar esta skill

Usa esta skill cuando necesites cualquiera de estas tareas:

1. Portar el selector de idioma con banderas a otro proyecto web.
2. Reutilizar el i18n ligero basado en JSON estaticos y atributos `data-translate-*`.
3. Montar el menu de idiomas dentro de un header global reutilizable.
4. Replicar el cambio de idioma con persistencia en `localStorage`.
5. Rehidratar UI dinamica al cambiar idioma sin meter i18next ni otro framework i18n.
6. Detectar textos visuales sin traducir durante desarrollo.

## Fuente de verdad en este repo

- Motor i18n y menu: `static/js/i18n.js`
- Header que monta el selector: `static/js/globalHeader.js`
- Estilos del dropdown, flags y responsive: `static/css/global.css`
- Punto de entrada base para cada pagina: `templates/base.html`
- Diccionarios reales: `static/translations/es.json`, `static/translations/en.json`, `static/translations/cs.json`
- Consumidor principal del evento de cambio: `static/js/ofertas.js`
- Consumidor del login/widget al cambiar idioma: `static/js/loginModal.js`
- Referencia detallada de portado: `references/ofertas-menu-traducciones.md`

## Que replica exactamente

Esta skill replica estas decisiones tecnicas del proyecto:

1. Idioma actual guardado en `localStorage.language` con compatibilidad heredada para `appLanguage`.
2. Diccionarios JSON servidos desde `/static/translations/<lang>.json`.
3. Idiomas soportados actualmente: `es`, `en`, `cs`.
4. Alias `cz -> cs` para mantener compatibilidad con datos antiguos.
5. Traduccion del DOM por atributos:
   - `data-translate-key`
   - `data-translate-key-placeholder`
   - `data-translate-key-value`
   - `data-translate-key-title`
   - `data-translate-key-aria-label`
6. Menu de idioma montado automaticamente dentro del header global, antes del widget de sesion.
7. Selector visual con banderas CSS puras para Espana, Reino Unido y Republica Checa.
8. Fallback al diccionario por defecto `es` cuando falta una clave o no carga un idioma secundario.
9. Eventos globales para integraciones:
   - `MonthlyI18nReady`
   - `languageChanged`
10. Modo debug para detectar textos visibles sin binding de traduccion.

## Flujo recomendado de portado

1. Copiar primero el motor `i18n.js` y los JSON de `static/translations`.
2. Copiar despues el bloque CSS del selector de idioma y de las flags.
3. Integrar el `globalHeader.js` o adaptar su punto de insercion para montar el selector en tu cabecera.
4. Añadir en la plantilla base el bootstrap temprano de idioma y el `script` `pageI18nConfig`.
5. Marcar el HTML con atributos `data-translate-*` antes de intentar traducir mensajes dinamicos.
6. Suscribir las piezas dinamicas del proyecto a `languageChanged`.
7. Activar el modo debug de i18n solo cuando necesites localizar textos visuales sin traducir.

## Contrato minimo que debe mantenerse

### HTML base

Debes conservar estas piezas:

1. `document.documentElement.lang` resuelto antes de pintar la pagina.
2. Un `script` JSON con id `pageI18nConfig` para el titulo y su clave opcional.
3. Carga de `i18n.js` antes de `globalHeader.js`.
4. Un header con `.header-right-section` o equivalente para insertar el selector.
5. Atributos `data-translate-*` en el DOM traducible.

### JS global

Debes conservar estas capacidades:

1. Normalizar idioma con alias y fallback a `es`.
2. Cargar y cachear diccionarios por idioma.
3. Traducir DOM completo bajo demanda con `translatePage()`.
4. Cambiar idioma con `changeLanguage()` y persistirlo.
5. Montar el selector con `mountLanguageSelector()`.
6. Emitir `languageChanged` despues del cambio efectivo.
7. Exponer un helper de traduccion para textos dinamicos.

### CSS del menu

Debes conservar al menos:

1. Contenedor `.language-switcher` con posicion relativa.
2. Trigger tipo pill `.language-switcher-trigger`.
3. Dropdown absoluto `.language-switcher-menu` alineado a la derecha.
4. Estado abierto por clase `.is-open`.
5. Flags circulares `.flag-btn` con variantes `.es`, `.uk`, `.cz`.
6. Variante responsive que oculta la etiqueta del idioma en movil.

## Contrato de APIs frontend a respetar

API publica del objeto global `MonthlyI18n`:

1. `ready`
2. `translate(key, params, fallback, lang)`
3. `translatePage(lang)`
4. `changeLanguage(lang)`
5. `getCurrentLanguage()`
6. `getSupportedLanguages()`
7. `mountLanguageSelector()`
8. `scanForMissingVisualTranslations()`
9. `reportMissingVisualTranslations()`
10. `isMissingI18nDebugEnabled()`

API puente del header global `GlobalHeader`:

1. `init()`
2. `translate()`
3. `translatePage()`
4. `changeLanguage()`
5. `getCurrentLanguage()`
6. `getSupportedLanguages()`
7. `reloadTranslations()`

## Estructura de archivos a portar

Orden minimo recomendado:

1. `static/js/i18n.js`
2. `static/js/globalHeader.js`
3. `static/css/global.css`
4. `static/translations/es.json`
5. `static/translations/en.json`
6. `static/translations/cs.json`
7. `templates/base.html` o plantilla equivalente

## Claves obligatorias del diccionario

El menu depende como minimo de estas claves:

1. `language.es`
2. `language.en`
3. `language.cs`
4. `header.go_home`

Ademas, cada pantalla debe aportar sus propias claves `data-translate-*`.

## Eventos e integraciones que debes replicar

1. `MonthlyI18nReady` cuando el sistema ya cargo diccionarios iniciales y tradujo la pagina.
2. `languageChanged` cada vez que el usuario cambia idioma desde el menu.
3. Los consumidores dinamicos deben escuchar `languageChanged` y volver a pintar su UI derivada.

Patron ya usado en este repo:

1. `ofertas.js` ejecuta `refreshTranslatedUi` al cambiar idioma.
2. `loginModal.js` vuelve a traducir y refresca el widget de usuario cuando el modal esta abierto.

## Restricciones importantes

1. No introducir una libreria i18n nueva si el objetivo es replicar este patron exacto.
2. No romper el alias historico `cz -> cs` si existen datos o URLs heredadas.
3. No montar el selector en un contenedor sin posicion estable; el dropdown depende de un host claro en la cabecera.
4. No usar `innerHTML` por defecto para todo; solo cuando el nodo lleve `data-translate-html="true"`.
5. No olvides traducir `title`, `placeholder`, `value` y `aria-label`; el patron actual no se limita al texto visible.
6. No asumir que el cambio de idioma re-renderiza UI dinamica por arte de magia; cada modulo que genere texto en JS debe engancharse al evento.
7. No tomar `docs/SISTEMA_TRADUCCIONES.md` como fuente de verdad unica para este repo; la implementacion vigente esta en `static/js/i18n.js` y `static/js/globalHeader.js`.

## Checklist corto de validacion

1. La pagina arranca con `html[lang]` correcto antes del primer render perceptible.
2. El selector aparece en el header y muestra la flag del idioma actual.
3. Al cambiar idioma se actualizan titulo, labels, placeholders, tooltips y `aria-labels`.
4. El idioma se conserva al recargar gracias a `localStorage`.
5. Si falla un idioma secundario, el sistema cae a `es`.
6. Los modulos con texto dinamico reaccionan al evento `languageChanged`.
7. Con `localStorage.i18nDebugMissing = '1'` o `?i18n_debug=1` aparecen advertencias de textos visuales sin traducir.

## Referencia detallada

Consulta `references/ofertas-menu-traducciones.md` para el contrato tecnico completo, snippets minimos y orden de implementacion.