# Referencia técnica: sidebar de Monthly-report-V3

## Fuente de verdad

Archivos reales que definen este sidebar:

- `c:\Proyectos\Monthly-report-V3\templates\index.html`
- `c:\Proyectos\Monthly-report-V3\assets\css\base.css`
- `c:\Proyectos\Monthly-report-V3\assets\js\app.js`

## Resumen funcional

El sidebar es una navegación SPA lateral clara, fija y expandible por hover. No navega por URL; activa paneles internos usando `data-stage-toggle` y `data-stage-panel`.

## Estructura real

### Layout

- Contenedor: `.app-layout-monthly`
- Sidebar: `aside.sidebar#sidebar`
- Contenido: `.content-wrapper#dashboardWorkspaceContent`

### Header del sidebar

- `.sidebar-header`
- `.sidebar-header-mark`
- `.sidebar-header-text`

Comportamiento:

- En colapsado solo se ve el badge `MR`.
- En expandido se oculta el badge y aparece el texto `Dashboard`.

### Navegación principal

Cada item usa:

- clase `menu-btn`
- atributo `data-stage-toggle`
- atributo `aria-pressed`
- un `.emoji`
- un `.label`

Items actuales:

1. `coreReportPanel`
2. `analysisPanel`
3. `detailPanel`

### Botón de configuración

Se aloja dentro de `.sidebar-footer` y usa:

- clase `menu-btn sidebar-config-btn`
- `data-stage-toggle="configurationPanel"`
- `aria-label` y `title` traducibles
- icono `⚙️`
- label `Configuration and traceability`

Comportamiento:

- Colapsado: solo icono centrado.
- Expandido: icono + label.
- No usa rail lateral activo como los items principales.

## Medidas y estilos clave

### Sidebar

- ancho colapsado: `80px`
- ancho expandido: `250px`
- padding colapsado: `24px 12px`
- padding expandido: `24px 16px`
- fondo: `#ffffff`
- borde derecho: `1px solid #d8e2eb`
- sombra colapsada: `10px 0 30px rgba(56, 128, 199, 0.08)`
- sombra expandida: `14px 0 36px rgba(56, 128, 199, 0.14)`

### Header badge

- tamaño: `38x38px`
- radio: `12px`
- gradiente: `linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)`
- texto blanco

### Botones del menú

- alto mínimo: `52px`
- radio: `14px`
- gap: `12px`
- color base texto: `#425466`
- color base icono: `#6a84a0`
- hover fondo: `#eef5fb`
- activo fondo: `#e8f1f8`
- activo borde interno: `inset 0 0 0 1px #cfe0ef`
- rail activo: `4px` a la izquierda

### Botón inferior

- alto mínimo: `48px`
- radio: `10px`
- borde interno: `inset 0 0 0 1px #d7e2ee`
- fondo blanco
- label oculto en colapsado y visible en expandido

## Lógica JS real

### Activación de paneles

`setActiveStagePanel(panelName)`:

1. Recorre todos los `data-stage-panel`.
2. Deja visible solo el panel activo con `hidden = false`.
3. Añade/quita clase `is-active`.
4. Recorre todos los botones `data-stage-toggle`.
5. Marca `active` e `is-active` en el botón correspondiente.
6. Actualiza `aria-pressed`.

### Inicialización

`initDashboardInteractions()`:

1. Limpia posibles clases `collapsed` residuales en sidebar y contenido.
2. Añade listeners click a todos los botones del sidebar.
3. Cuando se abre `detailPanel`, dispara carga de detalle operacional.

## Responsive real

En el breakpoint móvil del proyecto:

1. `.sidebar` deja de ser un rail fijo estrecho y pasa a `width: 100%`.
2. Los labels permanecen visibles.
3. Los botones se alinean a la izquierda.
4. El sidebar entra en flujo normal y el contenido deja de depender del margen lateral estrecho.

## Checklist de portabilidad

1. Replicar el contenedor de layout y el desplazamiento del contenido.
2. Mantener `80px -> 250px` como patrón base si no hay requisito distinto.
3. Mantener la ocultación/visualización de labels por hover.
4. Mantener el estado activo con rail izquierdo solo en items principales.
5. Mantener el botón de configuración abajo con variante propia.
6. Portar también la lógica JS si el proyecto tiene paneles SPA.
7. Verificar teclado y nombre accesible cuando el texto esté oculto.

## Errores comunes al portar

- Copiar solo el HTML sin el `margin-left` del contenido.
- Mantener el label del botón de configuración siempre oculto y perder la expansión.
- Tratar el botón inferior como un item normal y heredarle el rail activo.
- Portar el sidebar sin el breakpoint móvil y dejarlo inutilizable en pantallas pequeñas.
- Cambiar el ancho del sidebar sin revisar padding, alineación e iconos.