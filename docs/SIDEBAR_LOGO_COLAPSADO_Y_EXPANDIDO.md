# Sidebar: logo colapsado y titulo expandido

Este documento explica que se hace en este proyecto para que el encabezado del sidebar se vea de una forma cuando esta cerrado y cambie al titulo completo cuando el usuario pasa el raton por encima, con una transicion suave.

## Donde esta implementado

La implementacion real esta en:

- `Templates/index.html`

En ese archivo estan tanto el HTML del sidebar como el CSS que controla la animacion.

## Objetivo visual

Se busca este comportamiento:

1. En estado colapsado, el sidebar ocupa poco ancho y en la cabecera solo se ve un badge con las iniciales del proyecto: `CM`.
2. En estado expandido, al hacer hover sobre el sidebar, el ancho aumenta.
3. Durante esa expansion, el badge `CM` desaparece y aparece el titulo completo `Cuadro de Mando`.
4. El cambio no se hace de golpe, sino con transiciones de `width`, `opacity`, `padding` y alineacion.

## Estructura HTML

La cabecera del sidebar esta montada asi:

```html
<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <span class="sidebar-header-mark" aria-hidden="true">CM</span>
    <span class="sidebar-header-text">Cuadro de Mando</span>
  </div>
</aside>
```

Cada pieza tiene una responsabilidad clara:

- `.sidebar`: contenedor que cambia de ancho entre colapsado y expandido.
- `.sidebar-header`: fila interna que recoloca el contenido.
- `.sidebar-header-mark`: badge visible cuando el sidebar esta cerrado.
- `.sidebar-header-text`: titulo completo, oculto al inicio y visible al expandir.

## Como se consigue el efecto

### 1. El sidebar nace estrecho

En estado base, el sidebar usa un ancho fijo pequeño:

```css
.sidebar {
  width: 80px;
  padding: 24px 12px;
  transition: width 0.24s ease, padding 0.24s ease, box-shadow 0.24s ease;
}
```

Esto obliga a una presentacion compacta. Con `80px` solo cabe bien el badge redondo y los iconos del menu.

### 2. En hover, el sidebar se expande

Cuando el usuario pasa el raton por encima:

```css
.sidebar:hover {
  width: 250px;
  padding: 24px 16px;
}
```

Ese cambio de ancho y padding es la base de toda la animacion. No hace falta JavaScript para esta parte: solo CSS con `:hover`.

### 3. El header cambia de centrado a alineado a la izquierda

Mientras esta cerrado, la cabecera centra el contenido:

```css
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar:hover .sidebar-header {
  justify-content: flex-start;
}
```

Esto hace que:

- cerrado: el badge `CM` quede centrado y se vea limpio;
- abierto: el bloque pase a comportarse como una cabecera normal con lectura izquierda a derecha.

### 4. El badge se oculta reduciendo su presencia fisica

El badge inicial se dibuja asi:

```css
.sidebar-header-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  flex-shrink: 0;
  transition: opacity 0.2s ease, width 0.2s ease, margin 0.2s ease;
}

.sidebar:hover .sidebar-header-mark {
  opacity: 0;
  width: 0;
  margin-right: 0;
  overflow: hidden;
  box-shadow: none;
}
```

La clave aqui es que no solo se baja la opacidad. Tambien se reduce el `width` a `0`.

Si solo se usara `opacity: 0`, el badge desapareceria visualmente pero seguiria ocupando espacio. Al poner `width: 0`, deja de reservar hueco y permite que el titulo entre con naturalidad.

### 5. El titulo arranca oculto y entra al expandir

El texto largo arranca en estado invisible:

```css
.sidebar-header-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
  transition: opacity 0.2s ease, width 0.2s ease;
}

.sidebar:hover .sidebar-header-text {
  opacity: 1;
  width: auto;
}
```

La logica visual es exactamente la inversa del badge:

- cerrado: el titulo no se ve y no ocupa ancho;
- abierto: el titulo aparece y recupera su ancho natural.

Con esto se produce un relevo entre ambos elementos: uno se contrae y desvanece, y el otro aparece aprovechando el espacio liberado.

## Por que funciona bien visualmente

La transicion se siente limpia porque hay varias decisiones combinadas:

1. El contenedor principal cambia de ancho antes de forzar el contenido.
2. El badge se oculta reduciendo `opacity` y `width`.
3. El titulo aparece creciendo desde `width: 0`.
4. El header cambia su alineacion de `center` a `flex-start`.
5. `overflow: hidden` evita que el texto se vea cortado o sobresalga durante el cambio.

No es una sola animacion; son varias transiciones pequenas coordinadas.

## Patrón reutilizable

Si quieres repetir este mismo patron en otro sidebar, la idea es mantener esta estructura:

1. Un contenedor padre que cambie de ancho.
2. Un elemento corto para el estado colapsado.
3. Un elemento largo para el estado expandido.
4. En el elemento corto: ocultar con `opacity: 0` y `width: 0` al expandir.
5. En el elemento largo: mostrar con `opacity: 1` y recuperar ancho al expandir.

## Ajustes que no conviene romper

Si modificas este patron, conviene respetar estas reglas:

- mantener `overflow: hidden` en header y texto;
- no usar solo `display: none` para animar, porque corta la transicion;
- no ocultar solo con `opacity`, porque el elemento seguiria ocupando espacio;
- mantener el `flex-shrink: 0` en el badge para que no se deforme en colapsado;
- revisar siempre el ancho del sidebar si el titulo nuevo es mas largo.

## Comportamiento responsive

En la parte responsive del mismo archivo se fuerza una variante distinta para movil:

```css
.sidebar-header,
.sidebar:hover .sidebar-header {
  justify-content: flex-start;
}

.sidebar-header-mark,
.sidebar:hover .sidebar-header-mark {
  opacity: 1;
  width: 38px;
}

.sidebar-header-text,
.sidebar:hover .sidebar-header-text {
  opacity: 1;
  width: auto;
}
```

Eso significa que en movil no se intenta reproducir el efecto de colapsado-hover como en escritorio. En ese contexto se prioriza legibilidad: pueden verse el badge y el titulo sin depender del hover.

## Resumen tecnico

La solucion de este proyecto se basa en CSS puro y en un intercambio controlado entre dos nodos del header:

- `CM` representa el estado compacto;
- `Cuadro de Mando` representa el estado expandido.

El efecto se consigue animando simultaneamente:

- ancho del sidebar;
- padding del sidebar;
- alineacion del header;
- opacidad y ancho del badge;
- opacidad y ancho del titulo.

No hace falta JavaScript para la animacion del logo/titulo. Toda la experiencia se resuelve con HTML estructurado y transiciones CSS sobre `:hover`.