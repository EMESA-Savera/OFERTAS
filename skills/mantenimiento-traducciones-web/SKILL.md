---
name: mantenimiento-traducciones-web
description: Mantener y ampliar el sistema de traducciones de OFERTAS usando el flujo real del repo: chequeo de paridad entre diccionarios, inventario de textos visibles, alta automatica de claves faltantes, generacion de claves `auto.*`, exportacion de textos a Excel y deteccion de literales hardcodeados para su migracion a i18n. Usar cuando el usuario pida añadir claves, revisar faltantes, sincronizar `es/en/cs`, extraer textos visibles o preparar un backlog de traducciones para otro proyecto web.
---

# Mantenimiento Traducciones Web

Esta skill empaqueta el workflow real que ya existe en OFERTAS para mantener los diccionarios y descubrir textos que todavia no estan integrados en i18n. No es una metodologia teorica: describe el proceso que este repo ya soporta con scripts Python e inventario JSON.

## Cuando usar esta skill

Usa esta skill cuando necesites cualquiera de estas tareas:

1. Añadir nuevas claves a `es`, `en` y `cs` sin perder paridad.
2. Detectar textos visibles hardcodeados en HTML, JS o Python.
3. Generar un inventario actualizado de bindings i18n y literales pendientes.
4. Dar de alta automaticamente claves faltantes en los JSON de traduccion.
5. Exportar el catalogo visual a Excel para traduccion o revision funcional.
6. Preparar un plan de migracion de textos hardcodeados a `data-translate-*` o `translate()`.

## Fuente de verdad en este repo

- Chequeo de paridad: `tools/check_translations.py`
- Sincronizacion de claves e inventario visual: `tools/sync_visual_translations.py`
- Exportacion a Excel: `tools/export_visual_texts_excel.py`
- Inventario persistido: `data/i18n_visual_inventory.json`
- Diccionarios reales: `static/translations/es.json`, `static/translations/en.json`, `static/translations/cs.json`
- Deteccion runtime de textos visuales sin binding: `static/js/i18n.js`
- Referencia detallada de portado: `references/ofertas-mantenimiento-traducciones.md`

## Que replica exactamente

Esta skill replica estas decisiones tecnicas del proyecto:

1. Los idiomas canonicos son `es`, `en` y `cs`.
2. La paridad de claves se valida con un script dedicado antes de dar por buena una entrega.
3. El inventario escanea archivos `.html`, `.js` y `.py` bajo `api`, `static`, `templates` e `index.html`.
4. Los textos visibles sin clave pueden convertirse en claves generadas automaticamente con prefijo `auto.`.
5. El inventario se guarda en `data/i18n_visual_inventory.json`.
6. Cuando faltan claves, `sync_visual_translations.py` puede rellenarlas en los diccionarios.
7. El exportador a Excel mezcla claves existentes y un set controlado de literales manuales para revision externa.
8. En runtime existe un modo debug complementario para detectar textos visuales sin traducir en el navegador.

## Flujo recomendado de trabajo

1. Ejecutar primero el chequeo de paridad para confirmar el estado base.
2. Ejecutar despues el inventario en modo `--check` para ver claves faltantes sin tocar JSON.
3. Revisar `data/i18n_visual_inventory.json` para distinguir:
   - claves ya enlazadas
   - textos visibles pendientes de migrar
4. Si el alta automatica es aceptable, correr la sincronizacion sin `--check`.
5. Ajustar manualmente traducciones reales en `en` y `cs` cuando el autocompletado deje texto espejo desde `es`.
6. Exportar a Excel si negocio o traduccion necesita revisar el catalogo completo.
7. Cerrar siempre con `check_translations.py`.

## Comandos base del workflow

```powershell
python tools/check_translations.py
python tools/sync_visual_translations.py --check
python tools/sync_visual_translations.py
python tools/export_visual_texts_excel.py
```

Variantes utiles:

```powershell
python tools/sync_visual_translations.py --inventory data/i18n_visual_inventory.json --check
python tools/sync_visual_translations.py --no-copy-source-to-all-languages
python tools/export_visual_texts_excel.py --output excel/textos_visuales_usuario.xlsx
```

## Contrato minimo que debe mantenerse

### Diccionarios

Debes conservar estas reglas:

1. `es.json`, `en.json` y `cs.json` deben ser objetos JSON planos `clave -> texto`.
2. Todos los valores deben ser strings.
3. Las tres variantes deben mantener exactamente la misma paridad de claves.

### Inventario

Debes conservar estas salidas:

1. Resumen de archivos escaneados.
2. `keyed_entries` para claves ya enlazadas en el codigo.
3. `raw_entries` para literales visibles sin binding i18n.
4. Conteo `missing_by_language`.

### Generacion automatica

Debes conservar estas decisiones:

1. Las claves generadas usan prefijo `auto.`.
2. La clave incorpora ruta relativa, contexto, slug del texto y hash corto.
3. El español se rellena con `source_text` o con la propia clave si no hay texto mejor.
4. `en` y `cs` pueden copiar el texto fuente o heredar temporalmente el valor de `es`.

## Contrato CLI real

### `check_translations.py`

1. No acepta opciones.
2. Devuelve `0` si hay paridad completa.
3. Devuelve `1` si faltan o sobran claves.

### `sync_visual_translations.py`

Opciones reales:

1. `--inventory <ruta>`
2. `--check`
3. `--no-copy-source-to-all-languages`

Comportamiento real:

1. Con `--check` no escribe los JSON, solo inventario y resumen.
2. Sin `--check` actualiza `es/en/cs`.
3. Si faltan claves y estas en `--check`, sale con codigo `1`.

### `export_visual_texts_excel.py`

Opciones reales:

1. `--output <ruta.xlsx>`

Comportamiento real:

1. Exporta una hoja `textos_visuales`.
2. Añade una hoja `resumen`.
3. Si el fichero esta bloqueado, guarda con sufijo `_actualizado`.

## Qué escanea el sincronizador

Alcance real del scanner:

1. Directorios: `api`, `static`, `templates`
2. Archivo adicional: `index.html`
3. Sufijos soportados: `.html`, `.js`, `.py`
4. Directorios ignorados: `.git`, `.venv`, `__pycache__`, `build`, `certificados_ofertas`, `data`, `dist`, `excel`, `node_modules`

## Señales que detecta el inventario

### Claves ya enlazadas

Detecta como i18n consolidado:

1. `data-translate-key`
2. `data-translate-key-placeholder`
3. `data-translate-key-title`
4. `data-translate-key-aria-label`
5. `data-translate-key-value`
6. Llamadas JS `t('clave')`
7. Llamadas JS `translate('clave', ...)`

### Textos crudos candidatos a migracion

Detecta como deuda i18n:

1. Texto visible en HTML sin binding.
2. `placeholder`, `title` y `aria-label` sin binding.
3. Asignaciones JS a `textContent`, `innerText`, `placeholder`, `title`, `ariaLabel` con literales.
4. Objetos JS con campos tipo `label`, `text`, `title`, `message`, `emptyMessage`.
5. Algunos mensajes Python en diccionarios o `jsonify(...)`.

## Cómo interpretar `i18n_visual_inventory.json`

1. `summary` te dice el tamaño y deuda actual del inventario.
2. `keyed_entries` sirve para ver si una clave ya existe y dónde se usa.
3. `raw_entries` es el backlog real de textos sin integrar.
4. `present_in` indica si la clave ya existe en cada idioma.

## Restricciones importantes

1. No aceptar ciegamente todas las claves `auto.*` en UI final; muchas deben convertirse en claves funcionales y semanticas.
2. No usar la sincronizacion automatica como sustituto de traduccion real a `en` y `cs`.
3. No editar manualmente el inventario como fuente maestra; es un artefacto generado.
4. No mezclar directorios generados o de build en el analisis funcional.
5. No considerar que `Result: OK` en paridad implica que la UI ya este bien traducida; puede seguir habiendo literales hardcodeados.

## Relacion con la deteccion runtime

Esta skill se complementa con el modo debug de `MonthlyI18n`:

1. `localStorage.i18nDebugMissing = '1'`
2. o `?i18n_debug=1`

Usa el scanner offline para inventario amplio y el debug runtime para detectar huecos que solo aparecen tras interacciones o render dinamico.

## Checklist corto de validacion

1. `python tools/check_translations.py` termina en `Result: OK`.
2. `python tools/sync_visual_translations.py --check` genera inventario sin modificar JSON.
3. El inventario separa correctamente claves existentes y `raw_entries`.
4. Tras sincronizar, `es/en/cs` siguen con paridad completa.
5. Si se exporta Excel, el archivo contiene hojas `textos_visuales` y `resumen`.
6. Los nuevos textos relevantes dejan de aparecer como deuda i18n en el flujo objetivo.

## Referencia detallada

Consulta `references/ofertas-mantenimiento-traducciones.md` para el contrato tecnico completo, ejemplos de salida y estrategia de migracion.