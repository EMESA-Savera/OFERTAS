# Sistema de traducciones

## Resumen

El proyecto usa un sistema de traducciones muy simple y directo:

1. El backend Flask publica la carpeta `translations/` como archivos estáticos.
2. Cada pantalla HTML carga un JSON según el idioma seleccionado: `translation_es.json`, `translation_en.json` o `translation_cz.json`.
3. La propia pantalla aplica las claves sobre el DOM buscando atributos como `data-translate-key`.
4. El idioma activo se guarda en `localStorage` con la clave `language`.
5. Si el idioma pedido no existe, la pantalla hace fallback a `es`.

No hay un motor i18n centralizado ni librería externa tipo i18next. La lógica está repetida en muchas pantallas.

---

## Archivos principales que intervienen

### 1. Carpeta de traducciones

Ubicación en desarrollo:

- `translations/translation_es.json`
- `translations/translation_en.json`
- `translations/translation_cz.json`

Esos tres ficheros son la fuente real de textos para la UI.

### 2. Backend que publica las traducciones

Archivo:

- `api/appOMEGAS.py`

Puntos clave:

- Define la ruta física de traducciones con:

```python
RUTA_TRADUCCIONES = os.path.join(BASE_DIR, 'translations')
```

- Expone los JSON con esta ruta Flask:

```python
@app.route('/translations/<path:nombre_archivo>')
def servir_traducciones(nombre_archivo):
    return send_from_directory(RUTA_TRADUCCIONES, nombre_archivo)
```

Conclusión: cualquier pantalla puede pedir por HTTP algo como:

```text
/translations/translation_es.json
```

### 3. Selector de idioma compartido

Archivo:

- `assets/globalHeader.js`

Este archivo no traduce textos por sí mismo, pero sí aporta una pieza importante:

- Inserta el selector de idioma en el header global.
- Ofrece las opciones `es`, `en` y `cz`.
- Cuando el usuario cambia el selector llama a `changeLanguage(...)` si la pantalla la tiene definida.
- Sincroniza el valor del selector con `localStorage.language`.

Es decir: el header compartido depende de que cada página implemente su propia función `changeLanguage` y su propia carga de traducciones.

---

## Cómo funciona el flujo real

## Paso 1. Resolución de rutas en backend

En `api/appOMEGAS.py` el backend distingue dos modos:

- Desarrollo: `BASE_DIR` apunta a la raíz del proyecto.
- Ejecutable PyInstaller: `BASE_DIR` apunta a `sys._MEIPASS`.

Eso es importante porque las traducciones siempre se buscan relativas a `BASE_DIR`.

Consecuencia:

- En desarrollo, Flask sirve `translations/` desde la carpeta real del repo.
- En el `.exe`, Flask sirve `translations/` desde los recursos empaquetados dentro del bundle.

## Paso 2. La pantalla decide qué idioma cargar

Patrón repetido en las pantallas:

```javascript
const lang = localStorage.getItem('language') || navigator.language.split('-')[0] || 'es';
loadTranslations(lang);
```

Orden real de prioridad:

1. `localStorage.language`
2. Idioma del navegador (`navigator.language`)
3. Fallback final a `es`

## Paso 3. La pantalla pide el JSON al backend

Hay dos variantes equivalentes en el proyecto:

```javascript
const response = await fetch(`/translations/translation_${lang}.json`);
```

o bien:

```javascript
const fileName = `translation_${lang}.json`;
const response = await fetch(`/translations/${fileName}`);
```

## Paso 4. Fallback a español si falta el idioma

Patrón repetido:

```javascript
if (!response.ok) {
    if (lang !== 'es') await loadTranslations('es');
    return;
}
```

Si no existe, por ejemplo, `translation_fr.json`, la pantalla intenta cargar `translation_es.json`.

## Paso 5. Aplicación de las claves al DOM

La mayoría de pantallas usan funciones como estas:

```javascript
function applyTranslations(translations) {
    currentTranslations = translations;
    document.querySelectorAll('[data-translate-key]').forEach(el => {
        if (translations[el.getAttribute('data-translate-key')]) {
            el.innerHTML = translations[el.getAttribute('data-translate-key')];
        }
    });
    document.querySelectorAll('[data-translate-key-title]').forEach(el => {
        if (translations[el.getAttribute('data-translate-key-title')]) {
            el.setAttribute('title', translations[el.getAttribute('data-translate-key-title')]);
        }
    });
    document.querySelectorAll('[data-translate-key-placeholder]').forEach(el => {
        if (translations[el.getAttribute('data-translate-key-placeholder')]) {
            el.setAttribute('placeholder', translations[el.getAttribute('data-translate-key-placeholder')]);
        }
    });
}
```

Se traducen tres tipos de cosas:

- Contenido HTML con `data-translate-key`
- Tooltips con `data-translate-key-title`
- Placeholders con `data-translate-key-placeholder`

## Paso 6. Textos dinámicos desde JavaScript

Además del DOM inicial, muchas pantallas usan:

```javascript
function getTranslation(key) {
    return currentTranslations[key] || key;
}
```

Eso sirve para traducir:

- mensajes de `alert(...)`
- textos generados en plantillas dinámicas
- estados de tablas
- labels construidos por JS

Si una clave no existe en el JSON, la función devuelve la propia clave como fallback visual.

---

## Dónde está la lógica en el frontend

La lógica no está centralizada en un solo JS común. Está replicada dentro de muchas pantallas HTML.

### Pantallas de origen que usan `/translations/`

- `Pantallas/Pantallas_Generales/Pantalla_INICIO.html`
- `Pantallas/Pantallas_Generales/Pantalla_INICIO_NEW.html`
- `Pantallas/Pantallas_Omegas/Pantalla_General_omegas.html`
- `Pantallas/Pantallas_Omegas/Reset_omegas.html`
- `Pantallas/Pantallas_Omegas/Reset_Trazabilidad.html`
- `Pantallas/Pantallas_Omegas/Stock_Omegas.html`
- `Pantallas/Pantallas_Omegas/Stock_Trazabilidad.html`
- `Pantallas/Pantallas_Maestro/Pantalla_general_Maestro.html`
- `Pantallas/Pantallas_Maestro/Omega_Master.html`
- `Pantallas/Pantallas_Maestro/ProductosFaltantes_Master.html`
- `Pantallas/Pantallas_Pedidos/Pantalla_principal_Pedidos.html`
- `Pantallas/Pantallas_Pedidos/Sequenced_Omegas.html`
- `Pantallas/Pantallas_Pedidos/Summary_Omegas.html`
- `Pantallas/Pantallas_Reportes/Pantalla_principal_reportes.html`
- `Pantallas/Pantallas_Reportes/Summary.html`
- `Pantallas/Pantallas_Configuración/Gestion_Permisos.html`
- `Pantallas/Pantallas_Configuración/scrCambiarPassword.html`
- `Pantallas/Pantallas_VerPedidos/VerPedidos.html`
- `Pantallas/Pantallas_VerPedidos/OB_C.html`
- `Pantallas/Pantallas_VerPedidos/OB_C_Trazabilidad.html`
- `Pantallas/Pantallas_VerPedidos/OB_W.html`
- `Pantallas/Pantallas_VerPedidos/Picking.html`
- `Pantallas/Pantallas_VerPedidos/Summary.html`
- `Pantallas/Pantallas_VerPedidos/Tie_Brackets.html`

Importante:

- Las carpetas `dist/.../_internal/...` contienen copias generadas al empaquetar.
- Para migrar o mantener el sistema, debes mirar y copiar los archivos fuente originales, no las copias en `dist/`.

---

## Qué contienen los JSON

Los JSON son diccionarios planos `clave -> texto`.

Ejemplo real:

```json
{
  "logout_tooltip": "Cerrar sesión",
  "main_title": "ALMACÉN",
  "stock_omegas": "STOCK",
  "master_omegas": "MAESTRO MATERIALES"
}
```

Características importantes:

- No hay anidación por módulos o pantallas.
- Todas las claves conviven en el mismo fichero por idioma.
- Eso simplifica el sistema, pero hace que los JSON crezcan bastante y mezclen textos de muchas vistas.

Idiomas soportados ahora mismo:

- `es`
- `en`
- `cz`

---

## Caso especial: traducciones de backend para correos

Hay una excepción importante: no todo sale de `translations/*.json`.

En `api/appOMEGAS.py` existe la función:

```python
def enviar_correo_sap_diff(diferencias, idioma='es'):
```

Esa función tiene un diccionario Python interno llamado `textos` con versiones en `es`, `en` y `cz` para el correo HTML de diferencias SAP.

Eso significa:

- La UI web usa `translations/*.json`.
- El correo SAP no usa esos JSON.
- Si copias el sistema a otro proyecto y también quieres el correo traducido, debes copiar esa parte Python o rehacerla.

---

## Qué archivos hay que copiar a otro proyecto

Si quieres trasladar la idea completa, el mínimo funcional es este:

### Opción A. Copiar el sistema tal como está

Debes copiar:

1. La carpeta `translations/`
2. La ruta Flask que sirve `/translations/<path:nombre_archivo>`
3. La resolución de `RUTA_TRADUCCIONES`
4. El selector compartido `assets/globalHeader.js` si quieres el selector visual común
5. En cada pantalla, las funciones:
   - `loadTranslations(lang)`
   - `applyTranslations(translations)`
   - `getTranslation(key)`
   - `changeLanguage(lang)`
6. Los atributos HTML:
   - `data-translate-key`
   - `data-translate-key-title`
   - `data-translate-key-placeholder`

### Opción B. Llevar solo la idea, pero mejorada

Si lo vas a portar a otro proyecto, la mejora evidente es:

- Mantener `translations/*.json`
- Mantener la ruta `/translations/...`
- Sacar toda la lógica JS repetida a un único archivo común, por ejemplo `assets/i18n.js`

Ahora mismo el patrón funciona, pero está duplicado en muchas páginas.

---

## Qué copiar si también vas a empaquetar con PyInstaller

Archivo importante:

- `api/appOMEGAS.spec`

Ahí ya está configurado que PyInstaller meta dentro del bundle:

```python
datas=[
    ('../translations', 'translations'),
    ('../assets', 'assets'),
    ('../IMAGENES', 'IMAGENES'),
    ('../Pantallas', 'Pantallas')
]
```

Si en el otro proyecto vas a generar `.exe`, necesitas hacer lo mismo con la carpeta de traducciones. Si no la incluyes, el endpoint `/translations/...` existirá, pero no encontrará los JSON dentro del ejecutable.

---

## Dependencias reales del sistema de traducción

Para que funcione correctamente, las piezas mínimas son:

- Backend web que sirva archivos estáticos JSON
- Carpeta `translations/` accesible desde ese backend
- HTML con claves de traducción en atributos `data-*`
- JavaScript cliente para cargar y aplicar el JSON
- Persistencia del idioma en `localStorage.language`

---

## Limitaciones del sistema actual

Estas son las limitaciones que conviene conocer antes de copiarlo tal cual:

1. La lógica está duplicada en muchas pantallas.
2. Los JSON son grandes y planos, sin separación por módulos.
3. Si falta una clave, normalmente se muestra la propia clave en pantalla.
4. Hay traducciones de backend separadas de los JSON, como el correo SAP.
5. No hay validación automática para detectar claves faltantes entre idiomas.

---

## Recomendación para replicarlo en otro proyecto

Si quieres copiar la idea sin arrastrar deuda innecesaria, la forma más limpia sería:

1. Copiar la carpeta `translations/`.
2. Crear un endpoint estático equivalente a `/translations/<archivo>`.
3. Crear un único archivo JS común de i18n para todo el frontend.
4. Mantener `localStorage.language` como fuente de verdad.
5. Mantener el fallback a `es`.
6. Añadir una comprobación para detectar claves que faltan entre `es`, `en` y `cz`.

---

## Respuesta corta

El proyecto coge las traducciones de:

- `translations/translation_es.json`
- `translations/translation_en.json`
- `translations/translation_cz.json`

Esas traducciones las sirve Flask desde `api/appOMEGAS.py` por la URL `/translations/...`, y cada HTML las carga con `fetch(...)`, aplica las claves al DOM y guarda el idioma en `localStorage`.

Si vas a copiarlo a otro proyecto, los archivos realmente relevantes son:

- `translations/`
- `api/appOMEGAS.py` o al menos su ruta `/translations/...`
- `assets/globalHeader.js` si quieres el selector común
- la lógica JS de carga/aplicación de traducciones en las pantallas
- `api/appOMEGAS.spec` si también vas a empaquetar el proyecto