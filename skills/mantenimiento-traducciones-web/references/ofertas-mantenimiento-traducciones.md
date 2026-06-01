# Referencia Tecnica: mantenimiento de traducciones en OFERTAS

Esta referencia documenta el workflow real del repo para mantener diccionarios, descubrir literales visibles y sincronizar faltantes entre `es`, `en` y `cs`.

## Fuente de verdad

- `tools/check_translations.py`
- `tools/sync_visual_translations.py`
- `tools/export_visual_texts_excel.py`
- `data/i18n_visual_inventory.json`
- `static/translations/es.json`
- `static/translations/en.json`
- `static/translations/cs.json`
- `static/js/i18n.js`

## Estado actual validado del repo

El chequeo real de paridad devuelve OK:

```text
Translation key parity check
Directory: C:\Proyectos\OFERTAS_prueba\static\translations
Total unique keys: 959

[es] keys: 959
  Missing keys: none
  Extra keys: none

[en] keys: 959
  Missing keys: none
  Extra keys: none

[cs] keys: 959
  Missing keys: none
  Extra keys: none

Result: OK
```

Esto solo confirma paridad estructural. No garantiza ausencia de textos hardcodeados en la UI.

## Herramienta 1: chequeo de paridad

### Comando

```powershell
python tools/check_translations.py
```

### Qué hace realmente

1. Carga `es.json`, `en.json` y `cs.json`.
2. Valida que cada fichero sea un objeto JSON plano.
3. Valida que todas las claves y valores sean strings.
4. Compara la union completa de claves contra cada idioma.
5. Falla si detecta faltantes o extras.

### Cuándo usarlo

1. Antes de tocar traducciones, para conocer el estado base.
2. Después de cualquier alta o borrado de claves.
3. Como validación mínima antes de entregar cambios de i18n.

## Herramienta 2: sincronización e inventario visual

### CLI real

```text
usage: sync_visual_translations.py [-h] [--inventory INVENTORY] [--check]
                                   [--no-copy-source-to-all-languages]
```

Opciones:

1. `--inventory INVENTORY`: ruta del JSON donde guardar el inventario.
2. `--check`: no escribe los JSON de traducción; solo inventario y resumen.
3. `--no-copy-source-to-all-languages`: para `en/cs` reutiliza primero el valor de `es` en vez de copiar el literal fuente.

### Comandos típicos

```powershell
python tools/sync_visual_translations.py --check
python tools/sync_visual_translations.py
python tools/sync_visual_translations.py --no-copy-source-to-all-languages
```

### Qué archivos escanea

1. Directorios `api`, `static`, `templates`.
2. El archivo raíz `index.html`.
3. Solo extensiones `.html`, `.js`, `.py`.

### Qué ignora

1. `.git`
2. `.venv`
3. `__pycache__`
4. `build`
5. `certificados_ofertas`
6. `data`
7. `dist`
8. `excel`
9. `node_modules`
10. El propio `i18n_visual_inventory.json`

### Cómo reconoce claves ya integradas

En HTML:

1. `data-translate-key`
2. `data-translate-key-placeholder`
3. `data-translate-key-title`
4. `data-translate-key-aria-label`
5. `data-translate-key-value`

En JS:

1. `t('clave')`
2. `translate('clave', ...)`

### Cómo detecta deuda i18n

En HTML:

1. Texto visible en tags como `button`, `label`, `span`, `p`, `option`, `td`, `th`.
2. `placeholder`, `title` y `aria-label` visibles sin `data-translate-key-*`.
3. `value` visible en `button`, `input` u `option` sin binding.

En JS:

1. Asignaciones a `textContent`, `innerText`, `placeholder`, `title`, `ariaLabel` con literales.
2. Objetos con propiedades `label`, `text`, `title`, `message`, `emptyMessage`.
3. `return 'literal';` cuando parece texto visible.

En Python:

1. Diccionarios con `message`, `detail`, `title`, `label`, `placeholder`.
2. Algunos `jsonify(...)` con literales.

## Claves automáticas `auto.*`

Cuando el scanner encuentra un literal visible sin clave, genera una clave estable con esta forma:

```text
auto.<ruta-normalizada>.<contexto>.<slug-del-texto>.<hash8>
```

Ejemplo conceptual:

```text
auto.api.app.ofertas.py.dict_message.cliente_no_encontrado.8dba5b5a
```

Partes:

1. Ruta relativa normalizada.
2. Contexto donde apareció el texto.
3. Slug recortado del literal.
4. Hash SHA1 corto para estabilidad.

Regla práctica:

1. Sirve para dar de alta cobertura rápidamente.
2. No siempre es una buena clave final para UI estable.
3. Si el texto es de producto o navegación, conviene renombrarlo luego a una clave semántica.

## Cómo rellena valores faltantes

La sincronización usa estas reglas:

1. Si falta en `es`, usa `source_text` o la propia clave.
2. Si falta en `en/cs` y no usas `--no-copy-source-to-all-languages`, copia `source_text`.
3. Si usas `--no-copy-source-to-all-languages`, `en/cs` heredan primero el valor de `es`.

Esto significa que el script resuelve cobertura estructural, no calidad lingüística definitiva.

## Estructura del inventario JSON

`data/i18n_visual_inventory.json` contiene:

1. `summary`
2. `keyed_entries`
3. `raw_entries`

### `summary`

Incluye al menos:

1. `files_scanned`
2. `keyed_entries`
3. `raw_entries`
4. `missing_by_language`

### `keyed_entries`

Cada entrada resume una clave ya enlazada:

```json
{
  "key": "app.title",
  "source_text": "Presupuestos",
  "occurrences": [
    {
      "file": "templates/index.html",
      "source": "html",
      "context": "text",
      "fallback": "Presupuestos"
    }
  ],
  "present_in": {
    "es": true,
    "en": true,
    "cs": true
  }
}
```

### `raw_entries`

Cada entrada representa deuda i18n pendiente de migración:

```json
{
  "generated_key": "auto....",
  "text": "Texto visible",
  "file": "static/js/ofertas.js",
  "source": "js",
  "context": "text_assignment",
  "present_in": {
    "es": false,
    "en": false,
    "cs": false
  }
}
```

## Herramienta 3: exportación a Excel

### CLI real

```text
usage: export_visual_texts_excel.py [-h] [--output OUTPUT]
```

### Comando típico

```powershell
python tools/export_visual_texts_excel.py --output excel/textos_visuales_usuario.xlsx
```

### Qué exporta

1. Hoja `textos_visuales` con columnas `identificador`, `origen`, `tipo`, `es`, `en`, `cs`.
2. Hoja `resumen` con métricas del catálogo.
3. Claves encontradas por escaneo de referencias.
4. Filas manuales para literales controlados que aún no salen de forma automática.

### Detalle importante

Existe un bloque `MANUAL_LITERAL_ROWS` con textos curados a mano. Si al portar el workflow a otro proyecto quieres mantener este patrón, tendrás que decidir si conservar una lista manual similar o ampliar el scanner automático.

## Relación con el debug runtime

El workflow offline no sustituye al detector runtime de `MonthlyI18n`.

Activación:

```javascript
localStorage.setItem('i18nDebugMissing', '1');
```

O por URL:

```text
?i18n_debug=1
```

Qué añade este modo:

1. Escanea el DOM actual en el navegador.
2. Detecta texto visible que aparece tras interacción o render dinámico.
3. Emite `MonthlyI18nMissingVisuals`.
4. Ayuda a cazar huecos que no siempre se ven en el análisis estático.

## Workflow recomendado para añadir textos nuevos

1. Añadir primero bindings correctos en HTML o JS con claves semánticas si el texto es estable.
2. Ejecutar `python tools/sync_visual_translations.py --check`.
3. Revisar `raw_entries` y decidir qué `auto.*` aceptar y qué claves renombrar a mano.
4. Si procede, ejecutar `python tools/sync_visual_translations.py`.
5. Traducir de verdad `en` y `cs` cuando el script haya dejado textos espejo o literales fuente.
6. Ejecutar `python tools/check_translations.py`.
7. Activar debug runtime si la pantalla tiene render dinámico fuerte.

## Workflow recomendado para migrar legacy hardcodeado

1. Localizar el literal en `raw_entries`.
2. Sustituir el literal por `data-translate-*`, `t(...)` o `translate(...)`.
3. Elegir clave semántica si afecta a UI estable.
4. Reservar `auto.*` para cobertura rápida o mensajes internos de bajo valor semántico.
5. Repetir inventario y comprobar que el texto deja de aparecer como raw.

## Riesgos típicos

1. Confundir paridad con calidad de traducción.
2. Dejar `en` y `cs` copiadas desde `es` demasiado tiempo.
3. Aceptar `auto.*` para navegación o títulos principales y degradar mantenibilidad.
4. Editar `data/i18n_visual_inventory.json` manualmente y perder cambios al regenerarlo.
5. Ignorar el runtime y dejar sin traducir texto que solo nace tras eventos JS.

## Checklist de aceptación

1. `check_translations.py` termina en OK.
2. El inventario se genera en la ruta esperada.
3. Los textos nuevos dejan de salir como `raw_entries` o quedan justificados.
4. `es/en/cs` mantienen el mismo número de claves.
5. El Excel se genera cuando negocio necesita revisión externa.
6. Las pantallas dinámicas no muestran warnings de `MonthlyI18nMissingVisuals` en el flujo validado.