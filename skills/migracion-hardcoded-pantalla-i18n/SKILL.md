---
name: migracion-hardcoded-pantalla-i18n
description: Migrar textos hardcodeados de una pantalla web al sistema i18n existente de OFERTAS usando claves semanticas, `data-translate-*` en HTML y `t()` o `tf()` en JS. Usar cuando el usuario pida limpiar una vista concreta, eliminar literales en `templates/index.html` o `static/js/ofertas.js`, sustituir claves `auto.*` por claves estables, o portar una pantalla legacy al patron actual de traducciones.
---

# Migracion Hardcoded Pantalla I18n

Esta skill documenta como convertir una pantalla concreta con textos hardcodeados al patron i18n real de OFERTAS. No describe una migracion teorica: toma como referencia la convivencia actual entre HTML ya traducido y deuda i18n restante en `static/js/ofertas.js`.

## Cuando usar esta skill

Usa esta skill cuando necesites cualquiera de estas tareas:

1. Migrar una vista concreta desde literales hardcodeados a `data-translate-*` o `t()`.
2. Sustituir claves `auto.*` por claves semanticas estables.
3. Traducir titulos, placeholders y `aria-labels` generados desde JS.
4. Limpiar una pantalla que mezcla HTML bien traducido y JS todavia hardcodeado.
5. Portar una pantalla legacy al contrato i18n actual sin reescribir toda la app.

## Fuente de verdad en este repo

- Pantalla objetivo real: `templates/index.html`
- Logica dinamica de la pantalla: `static/js/ofertas.js`
- Motor i18n: `static/js/i18n.js`
- Diccionarios: `static/translations/es.json`, `static/translations/en.json`, `static/translations/cs.json`
- Inventario de deuda i18n: `data/i18n_visual_inventory.json`
- Workflow de sincronizacion: `tools/sync_visual_translations.py`
- Referencia detallada de portado: `references/ofertas-migracion-hardcoded-pantalla.md`

## Hipotesis de trabajo que replica esta skill

En OFERTAS la mayor parte del HTML estable ya esta migrada con `data-translate-*`, pero siguen quedando literales relevantes dentro de `static/js/ofertas.js`. Por eso la migracion correcta no empieza por los JSON: empieza por localizar si el texto vive en HTML estable, en render JS o en mensajes dinamicos, y aplicar el binding adecuado en cada caso.

## Tipos de migracion que debes distinguir

### 1. Texto estable en HTML

Usa atributos `data-translate-*`.

Casos:

1. Texto visible: `data-translate-key`
2. Placeholder: `data-translate-key-placeholder`
3. Tooltip: `data-translate-key-title`
4. Accesibilidad: `data-translate-key-aria-label`
5. Value de inputs o botones: `data-translate-key-value`

### 2. Texto generado en JS pero estable semánticamente

Usa `t('clave', 'Fallback')`.

Casos:

1. Labels de navegación
2. Botones de tablas
3. Mensajes vacíos
4. Títulos y tooltips estáticos

### 3. Texto generado en JS con interpolación

Usa `tf('clave', 'Fallback con {token}', { token: valor })`.

Casos:

1. `aria-label` con número de oferta
2. Botones tipo `Editar precio de {material}`
3. Mensajes con referencias o nombres dinámicos

### 4. Texto runtime impredecible o técnico

Evalúa si debe:

1. quedarse como mensaje backend con `message_key`
2. mapearse en una tabla de traducciones runtime
3. o aceptar temporalmente una clave `auto.*`

## Patron real ya consolidado en este repo

### HTML bien migrado

La plantilla principal ya usa este patron:

1. `data-translate-key="offer.new_request_title"`
2. `data-translate-key-placeholder="offer.sender_placeholder"`
3. `data-translate-key-title="nav.settings"`
4. `data-translate-key-aria-label="common.close"`

### JS bien migrado

En `static/js/ofertas.js` ya existe este patron correcto:

1. `t('literal.bom.loading_materials', 'Cargando materiales...')`
2. `t('common.remove', 'Quitar')`
3. `tf('literal.bom.edit_price_aria', 'Editar precio de {material}', { material })`

### JS todavía con deuda

Todavia hay ejemplos reales de deuda o migracion incompleta en `static/js/ofertas.js`:

1. Label hardcodeado `Usuarios` en `buildNavigationStack`.
2. `aria-label="Editar precio de ..."` y `title="Editar precio"` en una variante de tabla BOM.
3. Literales que el inventario ya capturo como `auto.static.js.ofertas.js.*`.

## Flujo recomendado de migracion por pantalla

1. Localizar la pantalla y su controlador JS principal.
2. Revisar si el texto esta en HTML o en HTML generado por JS.
3. Buscar primero si ya existe una clave semantica en `static/translations/*.json`.
4. Reutilizar esa clave si existe.
5. Si no existe, crear una clave semantica nueva.
6. Solo usar `auto.*` si el texto es transitorio o de bajo valor semantico.
7. Si el texto tiene interpolacion, usar `tf()` en lugar de concatenaciones hardcodeadas.
8. Revalidar con el inventario y el chequeo de paridad.

## Casos reales de migracion que esta skill debe replicar

### Caso A: label hardcodeado en breadcrumb o navegación

Problema real:

1. En `buildNavigationStack('usuarios')` aparece `label: 'Usuarios'`.

Migracion correcta:

1. Reutilizar `literal.users.title` si ya existe.
2. Sustituir por `label: t('literal.users.title', 'Usuarios')`.

### Caso B: tooltip y aria-label en HTML generado por JS

Problema real:

1. Una variante de la tabla BOM usa `aria-label="Editar precio de ${material}"` y `title="Editar precio"` hardcodeados.

Migracion correcta:

1. Reutilizar `literal.bom.edit_price`.
2. Reutilizar `literal.bom.edit_price_aria`.
3. Sustituir por `t()` y `tf()` en el template string JS.

### Caso C: placeholder o title en HTML estable

Migracion correcta:

1. Añadir `data-translate-key-placeholder` o `data-translate-key-title`.
2. Mantener el literal visible como fallback inicial en el HTML.
3. Añadir la clave en `es/en/cs`.

## Reglas para elegir clave semantica

Prefiere claves semanticas cuando el texto represente:

1. navegación
2. titulos de vistas
3. botones de accion
4. estados vacíos
5. tooltips funcionales
6. mensajes de negocio estables

Evita dejar `auto.*` en esos casos porque degradan mantenibilidad y descubribilidad.

## Cuándo aceptar `auto.*`

Acepta temporalmente `auto.*` solo si:

1. el texto es interno o de baja relevancia de producto
2. necesitas cobertura rapida mientras limpias una pantalla grande
3. el origen es un mensaje backend transitorio pendiente de curado posterior

## Contrato minimo que debe mantenerse

1. HTML estable debe usar `data-translate-*`.
2. JS estable debe usar `t()`.
3. JS con interpolacion debe usar `tf()`.
4. Toda clave nueva debe existir en `es`, `en` y `cs`.
5. La pantalla debe reaccionar correctamente a `languageChanged` si re-renderiza UI dinamica.

## Validacion recomendada

1. Confirmar que el texto deja de estar hardcodeado en HTML o JS.
2. Ejecutar `python tools/sync_visual_translations.py --check`.
3. Revisar que el texto ya no aparezca como `raw_entry` o que al menos use clave semantica.
4. Ejecutar `python tools/check_translations.py`.
5. Si la pantalla es dinamica, cambiar idioma en runtime y comprobar re-render.

## Restricciones importantes

1. No migrar un texto de JS a `data-translate-key` si el nodo se genera enteramente en runtime; ahi toca `t()` o `tf()`.
2. No crear claves nuevas si ya existe una clave semantica equivalente en `static/translations/*.json`.
3. No dejar concatenaciones tipo `'Editar ' + material` si el mensaje debe ser traducible; usa interpolacion.
4. No tomar como exito solo la paridad de JSON; la deuda de pantalla vive en `raw_entries` y en render runtime.

## Checklist corto de validacion

1. La pantalla objetivo usa el binding correcto segun viva en HTML o JS.
2. Las claves reutilizan el diccionario existente cuando aplica.
3. Las nuevas claves tienen nombre semantico y no `auto.*` salvo excepcion justificada.
4. El inventario deja de reportar el literal como deuda de la pantalla.
5. La UI cambia de idioma correctamente sin romper render dinamico.

## Referencia detallada

Consulta `references/ofertas-migracion-hardcoded-pantalla.md` para el contrato tecnico completo, ejemplos reales y orden de trabajo.