# OFERTAS

Base inicial de la aplicación OFERTAS con estructura inspirada en `MCCAB`, pero más organizada por responsabilidad.

## Estructura principal

- `api/`: backend Flask y lógica de servidor.
- `templates/`: plantillas HTML.
- `static/`: recursos estáticos separados por tipo (`css/`, `js/`, `images/`, `translations/`).
- `sql/`: scripts SQL del proyecto.
- `docs/`: documentación funcional y técnica.

## Punto de partida recomendado

- Entrada frontend estructurada: `templates/index.html`
- App backend inicial: `api/app_ofertas.py`
- Prototipo inicial creado antes: `index.html`

## Siguiente paso sugerido

Mover la SPA actual de `index.html` a `templates/` + `static/` y arrancar el backend Flask para servirla correctamente.
