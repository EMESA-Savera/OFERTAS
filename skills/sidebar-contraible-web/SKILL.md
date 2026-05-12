---
name: sidebar-contraible-web
description: Replicar el sidebar lateral claro consolidado en Monthly-report-V3: colapsado a 80px, expandido por hover a 250px, navegación SPA por `data-stage-toggle`, badge superior `MR`, items con icono + label, estado activo con rail izquierdo y botón inferior de configuración con engranaje centrado en colapsado y texto visible en expandido. Usar cuando el usuario pida un sidebar EMESA/Savera Components claro, hover-expand, o quiera portar exactamente este patrón a otro proyecto.
---

# Sidebar Contraible Web

Esta skill documenta la variante real ya consolidada en `Monthly-report-V3`, no un sidebar genérico abstracto. El objetivo es poder portar el patrón completo a otros proyectos sin perder sus decisiones de layout, interacción y estilo.

## Fuente de verdad

- Implementación HTML: `Monthly-report-V3/templates/index.html`
- Implementación CSS: `Monthly-report-V3/assets/css/base.css`
- Lógica SPA: `Monthly-report-V3/assets/js/app.js`
- Referencia técnica de portado: `references/monthly-report-v3-sidebar.md`

## Qué patrón replica

El sidebar objetivo tiene estas propiedades obligatorias:

1. Sidebar fijo a la izquierda dentro de un layout con contenido desplazado.
2. Estado colapsado por defecto en `80px`.
3. Expansión solo por hover a `250px`.
4. Tema claro con borde derecho suave y sombra lateral azul muy ligera.
5. Navegación vertical por botones con icono centrado en colapsado y texto visible en expandido.
6. Header superior con badge `MR` azul igual al tono de la cabecera principal.
7. Botón inferior de configuración separado del menú principal.
8. Estado activo por vista/panel usando `data-stage-toggle` y clase `active`.
9. Sin botón manual de toggle de ancho.
10. Responsive: en móvil el sidebar deja de ser fijo y pasa a ocupar ancho completo.

## Flujo de trabajo recomendado

1. Detectar si el proyecto destino es SPA, MPA o plantilla server-side.
2. Identificar el contenedor de layout principal para reservar espacio al contenido.
3. Portar juntos estos bloques:
    - estructura HTML del sidebar
    - reglas CSS del contenedor y del sidebar
    - reglas CSS de items, header y botón inferior
    - JS de activación de panel/ruta
4. Adaptar solo el contenido de labels, iconos y paneles destino.
5. Validar primero el colapsado/expandido visual antes de refinar el contenido.
6. Validar luego el estado activo y el switching de vistas.

## Contrato HTML obligatorio

Estructura mínima equivalente:

```html
<section class="app-layout-monthly">
   <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
         <span class="sidebar-header-mark" aria-hidden="true">MR</span>
         <span class="sidebar-header-text">Dashboard</span>
      </div>

      <ul class="sidebar-menu">
         <li>
            <button type="button" class="menu-btn active" data-stage-toggle="coreReportPanel" aria-pressed="true">
               <span class="emoji">📊</span>
               <span class="label">Core report</span>
            </button>
         </li>
         <li>
            <button type="button" class="menu-btn" data-stage-toggle="analysisPanel" aria-pressed="false">
               <span class="emoji">📈</span>
               <span class="label">Operational analysis</span>
            </button>
         </li>
      </ul>

      <div class="sidebar-footer">
         <button type="button" class="menu-btn sidebar-config-btn" data-stage-toggle="configurationPanel" aria-pressed="false" aria-label="Configuration and traceability" title="Configuration and traceability">
            <span class="emoji">⚙️</span>
            <span class="label">Configuration and traceability</span>
         </button>
      </div>
   </aside>

   <div class="content-wrapper" id="dashboardWorkspaceContent">
      <!-- paneles / contenido -->
   </div>
</section>
```

## Contrato CSS obligatorio

### Layout y posicionamiento

- `.app-layout-monthly`
   - `display: flex`
   - `gap: 0`
   - `align-items: stretch`
   - `position: relative`

- `.sidebar`
   - `width: 80px`
   - `padding: 24px 12px`
   - `background: #ffffff`
   - `border-right: 1px solid #d8e2eb`
   - `height: calc(100vh - 142px)`
   - `position: fixed`
   - `left: 0`
   - `top: 132px`
   - `display: flex`
   - `flex-direction: column`
   - `box-shadow: 10px 0 30px rgba(56, 128, 199, 0.08)`
   - `transition: width 0.24s ease, padding 0.24s ease, box-shadow 0.24s ease`

- `.sidebar:hover`
   - `width: 250px`
   - `padding: 24px 16px`
   - `box-shadow: 14px 0 36px rgba(56, 128, 199, 0.14)`

- `.content-wrapper`
   - `margin-left: 80px`
   - `padding: 30px 20px`

### Header del sidebar

- `.sidebar-header`
   - layout centrado
   - `min-height: 36px`
   - tipografía en mayúsculas y tracking visible

- `.sidebar-header-mark`
   - `width: 38px`
   - `height: 38px`
   - `border-radius: 12px`
   - `background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)`
   - texto blanco

- `.sidebar-header-text`
   - oculto por defecto
   - visible solo en expandido

### Items del menú

- `.sidebar-menu`
   - `display: flex`
   - `flex-direction: column`
   - `gap: 6px`
   - `list-style: none`

- `.sidebar-menu button`
   - `min-height: 52px`
   - `padding: 14px 12px`
   - `border-radius: 14px`
   - sin borde nativo
   - fondo transparente
   - `display: flex`
   - `align-items: center`
   - `justify-content: center`
   - `gap: 12px`
   - `font-weight: 600`

- `.sidebar:hover .sidebar-menu button`
   - `justify-content: flex-start`
   - `padding: 14px 18px`

- `.sidebar-menu button .label`
   - oculto por defecto
   - visible solo en expandido
   - con ellipsis si desborda

- `.sidebar-menu button::before`
   - rail vertical izquierdo de `4px`
   - oculto en reposo
   - visible solo cuando el item está activo

- `.sidebar-menu button:hover:not(.active)`
   - `background: #eef5fb`
   - color de texto más oscuro

- `.sidebar-menu button.active`
   - `background: #e8f1f8`
   - `box-shadow: inset 0 0 0 1px #cfe0ef`
   - rail izquierdo visible

### Botón inferior de configuración

Este botón no debe comportarse exactamente igual que los items de navegación. Tiene variante propia.

- `.sidebar-footer`
   - `margin-top: auto`
   - `padding-top: 18px`

- `.sidebar-config-btn`
   - `min-height: 48px`
   - `padding: 12px`
   - `border-radius: 10px`
   - `background: #fff`
   - `box-shadow: inset 0 0 0 1px #d7e2ee`
   - icono centrado en colapsado

- `.sidebar:hover .sidebar-config-btn`
   - `justify-content: flex-start`
   - `padding: 12px 16px`

- `.sidebar-config-btn .label`
   - oculto por defecto
   - visible solo en expandido

- `.sidebar-config-btn::before`
   - desactivado; este botón no usa el rail activo izquierdo del menú principal

## Contrato JS obligatorio

La lógica consolidada en `Monthly-report-V3` es SPA por paneles, no navegación por URL. La referencia mínima es esta:

1. Cada botón del sidebar lleva `data-stage-toggle="<panelName>"`.
2. Cada panel visible lleva `data-stage-panel="<panelName>"`.
3. Al hacer click:
    - se ocultan los paneles no activos con `hidden`
    - se marca el panel activo con clase `is-active`
    - se marca el botón activo con clases `active` e `is-active`
    - se actualiza `aria-pressed`

Implementación mínima equivalente:

```javascript
function setActiveStagePanel(panelName) {
   if (!panelName) return;

   document.querySelectorAll("[data-stage-panel]").forEach(function (panel) {
      const isActive = panel.dataset.stagePanel === panelName;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
   });

   document.querySelectorAll("[data-stage-toggle]").forEach(function (button) {
      const isActive = button.dataset.stageToggle === panelName;
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
   });
}

document.querySelectorAll("[data-stage-toggle]").forEach(function (button) {
   button.addEventListener("click", function () {
      setActiveStagePanel(button.dataset.stageToggle);
   });
});
```

## Restricciones obligatorias

- No introducir toggle persistente de ancho con `localStorage`.
- No usar botón hamburguesa para abrir/cerrar en desktop.
- La expansión de ancho debe depender solo de hover en desktop.
- No convertir el sidebar en overlay desktop si el proyecto usa layout de escritorio fijo.
- No romper el margen izquierdo del contenido al portar el sidebar.
- No mezclar el botón de configuración con el grupo principal si el diseño actual lo mantiene anclado abajo.

## Responsive obligatorio

Para pantallas pequeñas, el patrón actual cambia:

1. `.sidebar, .sidebar:hover` pasan a `width: 100%`.
2. El sidebar deja de ser fijo y entra en el flujo normal.
3. Los labels quedan visibles sin depender del hover.
4. Los botones se justifican a la izquierda.

Si el proyecto destino no puede usar hover en móvil, mantener los labels visibles por defecto en ese breakpoint.

## Accesibilidad mínima

- `aria-label` o `data-translate-key-aria-label` cuando el label visible no esté siempre presente.
- `aria-pressed` en botones que activan paneles.
- Soporte teclado con `button`, no `div role="button"` salvo necesidad real.
- Contraste suficiente entre fondo, icono y estado activo.
- El botón de configuración debe conservar nombre accesible aunque el texto esté oculto en colapsado.

## Prompt reutilizable

"""
Quiero que portes el sidebar claro de Monthly-report-V3 a este proyecto.

REQUISITOS OBLIGATORIOS
- Sidebar fijo a la izquierda.
- Colapsado a 80px por defecto.
- Expandido a 250px solo por hover en desktop.
- Header superior con badge compacto tipo `MR` en azul de cabecera.
- Items del menú con icono centrado en colapsado y label visible solo en expandido.
- Estado activo con fondo azul suave, rail izquierdo visible y sincronización con panel/ruta activa.
- Botón inferior de configuración separado del menú principal, con engranaje centrado en colapsado y texto visible en expandido.
- Responsive: en móvil el sidebar ocupa ancho completo y los labels quedan visibles.

IMPLEMENTACIÓN
1. Analiza primero las convenciones del proyecto destino.
2. Reproduce HTML, CSS y JS equivalentes sin asumir nombres de archivos del repo origen.
3. Usa `data-stage-toggle` y `data-stage-panel` o un contrato equivalente si la app es SPA.
4. No añadas toggle persistente de ancho ni hamburguesa desktop.
5. Mantén accesibilidad con `button`, `aria-pressed` y `aria-label`.

ENTREGA
- Aplica cambios en el proyecto.
- Resume el contrato HTML, CSS y JS que has integrado.
- Verifica colapsado, expandido, estado activo, botón de configuración y responsive.
"""

## Criterio de aceptación

- El sidebar replicado se ve y se comporta como el de `Monthly-report-V3`.
- Puede portarse sin dependencias externas obligatorias.
- Conserva hover-expand, estado activo, botón inferior de configuración y variante responsive.
- El contrato queda suficientemente documentado para reproducirlo en otros proyectos sin volver a inspeccionar el repo origen.
