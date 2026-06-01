# Referencia Tecnica: migrar una pantalla hardcodeada al i18n de OFERTAS

Esta referencia describe como limpiar una pantalla concreta usando la mezcla real de patrones que hoy existe entre `templates/index.html` y `static/js/ofertas.js`.

## Fuente de verdad

- `templates/index.html`
- `static/js/ofertas.js`
- `static/js/i18n.js`
- `static/translations/es.json`
- `static/translations/en.json`
- `static/translations/cs.json`
- `data/i18n_visual_inventory.json`
- `tools/sync_visual_translations.py`
- `tools/check_translations.py`

## Diagnóstico real del repo

### Lo que ya está bien resuelto

La pantalla principal ya tiene mucho HTML migrado con bindings directos, por ejemplo:

```html
<h1 data-translate-key="offer.new_request_title">Nueva Solicitud de Presupuesto</h1>
<input placeholder="Nombre <correo@empresa.com>" data-translate-key-placeholder="offer.sender_placeholder" />
<button data-translate-key="common.clear_form">Limpiar formulario</button>
```

Esto marca la pauta correcta para texto estable en plantilla.

### Lo que sigue pendiente en JS

En `static/js/ofertas.js` todavía aparecen literales concretos que no deberían quedarse hardcodeados.

Ejemplo 1:

```javascript
if (viewName === 'usuarios') {
  return [
    { label: t('nav.home', 'Inicio'), target: 'inicio', htmlFile: null },
    { label: t('nav.settings', 'Configuración'), target: 'configuracion', htmlFile: null },
    { label: 'Usuarios', target: 'usuarios', htmlFile: null },
  ];
}
```

Ejemplo 2:

```javascript
<button
  class="btn-inline btn-inline--success btn-inline--icon"
  type="button"
  data-edit-material-precio="..."
  aria-label="Editar precio de ${escapeHtml(material.material || '')}"
  title="Editar precio"
>✎</button>
```

Ambos casos deben migrarse a claves existentes o nuevas claves semanticas.

## Paso 1: clasificar el texto según su superficie

Antes de migrar, decide de qué tipo es:

1. Texto fijo dentro del HTML base: `data-translate-*`
2. Texto fijo generado desde JS: `t()`
3. Texto con interpolación: `tf()`
4. Texto runtime no estructurado: tabla de mensajes o `message_key`

Si te equivocas aquí, la migración suele quedar a medias.

## Paso 2: buscar clave existente antes de inventar una nueva

La prioridad correcta es esta:

1. Buscar si ya existe una clave semantica en `static/translations/*.json`.
2. Si existe, reutilizarla.
3. Si no existe, crear una nueva clave semantica.
4. Solo en último caso aceptar `auto.*`.

Ejemplos reales ya existentes:

1. `literal.users.title`
2. `literal.bom.edit_price`
3. `literal.bom.edit_price_aria`
4. `offer.reassign_no_users`

## Paso 3: aplicar el binding correcto

### Caso A: HTML estable

Antes:

```html
<input placeholder="Introduce la descripción del cliente" />
```

Después:

```html
<input
  placeholder="Introduce la descripción del cliente"
  data-translate-key-placeholder="config.client_name_placeholder"
/>
```

Regla:

1. El literal visible puede quedarse como fallback inicial en markup.
2. La traducción efectiva la aplica `translatePage()`.

### Caso B: JS estable sin interpolación

Antes:

```javascript
{ label: 'Usuarios', target: 'usuarios', htmlFile: null }
```

Después:

```javascript
{ label: t('literal.users.title', 'Usuarios'), target: 'usuarios', htmlFile: null }
```

### Caso C: JS con interpolación

Antes:

```javascript
aria-label="Editar precio de ${escapeHtml(material.material || '')}"
title="Editar precio"
```

Después:

```javascript
aria-label="${escapeHtml(tf('literal.bom.edit_price_aria', 'Editar precio de {material}', { material: material.material || '' }))}"
title="${escapeHtml(t('literal.bom.edit_price', 'Editar precio'))}"
```

## Paso 4: elegir entre clave semántica y `auto.*`

### Usa clave semántica si el texto es parte del producto

Ejemplos:

1. `Usuarios`
2. `Editar precio`
3. `No hay usuarios configurados en este departamento`
4. `cliente.com` cuando define un placeholder funcional conocido

### Tolera `auto.*` solo como cobertura temporal

El repo ya muestra ejemplos de deuda capturada en inventario y hasta en diccionarios:

1. `auto.static.js.ofertas.js.object_label.usuarios.29968aa1`
2. `auto.static.js.ofertas.js.text_assignment.editar_precio.40b45f81`

Estas claves sirven para no perder cobertura, pero no son la forma deseable final para la UI principal.

## Paso 5: usar el inventario como verificación, no como objetivo final

`data/i18n_visual_inventory.json` te ayuda a localizar deuda, pero no sustituye criterio de diseño de claves.

Qué debes mirar:

1. Si el texto aparece en `raw_entries`, todavía está hardcodeado.
2. Si aparece con una `auto.*`, decide si conviene renombrarlo a una clave semántica.
3. Si el texto ya se resuelve con una clave semántica, evita duplicarlo.

## Paso 6: respetar el contrato runtime

La pantalla de OFERTAS re-renderiza elementos al cambiar idioma. Por eso, cualquier migración de JS tiene que convivir con el evento `languageChanged` y con las funciones de render ya existentes.

Reglas prácticas:

1. Si el texto vive dentro de una función `render*`, usa `t()` o `tf()` dentro de esa función.
2. No traduzcas una sola vez en init si el HTML se vuelve a regenerar.
3. Si una lista o tabla se recompone, el binding está en el render, no en el DOM previo.

## Secuencia mínima de trabajo en una pantalla

1. Elegir una zona concreta: navegación, tabla, modal, filtros, mensajes.
2. Buscar literales hardcodeados en el JS o HTML de esa zona.
3. Reutilizar claves existentes si las hay.
4. Crear claves nuevas solo cuando falten.
5. Reemplazar concatenaciones por `tf()` si hay tokens.
6. Ejecutar chequeo de inventario y paridad.

## Comandos útiles tras cada slice

```powershell
python tools/sync_visual_translations.py --check
python tools/check_translations.py
```

Si la pantalla depende mucho de render dinámico, añade además validación manual de cambio de idioma en navegador.

## Errores típicos en esta migración

1. Convertir texto generado por JS a `data-translate-key` aunque el nodo ni exista en el HTML base.
2. Crear una clave nueva cuando ya existe una equivalente.
3. Dejar `title` y `aria-label` hardcodeados aunque el texto visible ya esté traducido.
4. Aceptar `auto.*` para navegación principal o acciones troncales.
5. Dar por cerrada la migración porque `check_translations.py` pasa, aunque el inventario siga detectando deuda de pantalla.

## Criterio práctico para decidir rápido

1. Si el texto está en plantilla estable: `data-translate-*`.
2. Si el texto está en render JS fijo: `t()`.
3. Si el texto incorpora datos: `tf()`.
4. Si el origen es backend o cadena impredecible: `message_key`, mapa runtime o `auto.*` temporal.

## Checklist de aceptación

1. La zona de pantalla elegida ya no tiene literales hardcodeados relevantes.
2. Los tooltips, placeholders y `aria-labels` también quedaron migrados.
3. Se reutilizaron claves existentes cuando era posible.
4. Las nuevas claves son semánticas.
5. El inventario deja de señalar el texto como deuda i18n cruda.
6. La pantalla sigue respondiendo bien al cambio de idioma.