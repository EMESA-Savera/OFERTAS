# Estructura propuesta para OFERTAS

## Referencia

Se toma como referencia `MCCAB`, pero con estas mejoras:

- separación de `static` por tipo de recurso (`css`, `js`, `images`, `translations`)
- backend con subcarpetas por responsabilidad (`routes`, `services`)
- documentación técnica separada en `docs/`
- plantilla servida por Flask en `templates/`

## Estructura

- `api/`
- `templates/`
- `static/css/`
- `static/js/`
- `static/images/`
- `static/translations/`
- `sql/`
- `docs/`

## Nota

El archivo `index.html` de la raíz se conserva como prototipo inicial. La entrada estructurada para la aplicación servida es `templates/index.html`.
