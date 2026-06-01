# Estilo del menu visual con banderas

Este documento concentra el estilo visual, la estructura HTML y el comportamiento minimo necesarios para replicar el menu de idiomas con banderas usado en OFERTAS.

No describe un selector de idioma generico. Documenta la variante concreta ya consolidada en este proyecto: boton tipo pill sobre cabecera azul, dropdown oscuro translúcido, banderas circulares dibujadas en CSS y estado activo resaltado en dorado.

## Fuente de verdad

- `static/css/global.css`
- `static/js/i18n.js`
- `static/js/globalHeader.js`
- `docs/BANDERAS_CSS_HTML.md`

## Qué apariencia replica

El selector tiene estas propiedades visuales:

1. Se inserta en la parte derecha del header global.
2. El disparador es una pill redondeada con fondo azul oscuro translúcido.
3. El texto del idioma aparece junto a una bandera circular.
4. El dropdown flota debajo del trigger, alineado a la derecha.
5. Las opciones usan fondo transparente y resaltado suave al hover.
6. La opción activa resalta la bandera con borde dorado y glow.
7. En móvil se oculta la etiqueta del idioma y se deja solo la bandera.

## Estructura HTML exacta

El HTML real lo genera `i18n.js`, pero para replicarlo puedes usar esta estructura:

```html
<div class="language-switcher">
  <button class="language-switcher-trigger" type="button" aria-haspopup="true" aria-expanded="false" data-lang="es">
    <span class="flag-btn es" aria-hidden="true"></span>
    <span class="language-switcher-current-label">Español</span>
  </button>

  <div class="language-switcher-menu" role="menu">
    <button class="language-option is-active" type="button" role="menuitemradio" data-lang="es" aria-pressed="true">
      <span class="flag-btn es" aria-hidden="true"></span>
      <span class="language-option-label">Español</span>
    </button>

    <button class="language-option" type="button" role="menuitemradio" data-lang="en" aria-pressed="false">
      <span class="flag-btn uk" aria-hidden="true"></span>
      <span class="language-option-label">English</span>
    </button>

    <button class="language-option" type="button" role="menuitemradio" data-lang="cs" aria-pressed="false">
      <span class="flag-btn cz" aria-hidden="true"></span>
      <span class="language-option-label">Čeština</span>
    </button>
  </div>
</div>
```

## Punto de inserción recomendado

En OFERTAS no se coloca en cualquier parte. Se monta dentro de:

1. `.app-header .header-right-section`
2. o `.global-header .header-right-section`

Y se inserta antes de:

1. `#userSessionWidgetHost`
2. o `#loginWidgetContainer`

Si tu layout no usa esta estructura, conserva al menos estas condiciones:

1. El contenedor debe tener una posición estable dentro del header.
2. Debe haber espacio suficiente para que el dropdown no se corte.
3. El selector debe quedar visualmente alineado con el resto de acciones de cabecera.

## CSS completo para replicarlo

Este es el bloque esencial del estilo actual.

```css
.language-switcher {
  position: relative;
}

.language-switcher-trigger {
  align-items: center;
  background: rgba(7, 27, 62, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  gap: 10px;
  min-height: 46px;
  padding: 6px 14px 6px 8px;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.language-switcher-trigger:hover {
  background: rgba(7, 27, 62, 0.42);
  border-color: rgba(255, 255, 255, 0.55);
  transform: translateY(-1px);
}

.language-switcher-trigger::after {
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid currentColor;
  content: '';
  display: block;
  margin-left: 2px;
}

.language-switcher-menu {
  background: rgba(5, 31, 75, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(5, 23, 51, 0.35);
  display: none;
  min-width: 210px;
  padding: 10px;
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  z-index: 1100;
}

.language-switcher.is-open .language-switcher-menu {
  display: block;
}

.language-option {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 14px;
  color: #fff;
  cursor: pointer;
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  text-align: left;
  width: 100%;
}

.language-option:hover,
.language-option.is-active {
  background: rgba(255, 255, 255, 0.1);
}

.language-switcher-current-label {
  font-size: 0.95rem;
  font-weight: 600;
}

.flag-btn {
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
  display: inline-block;
  flex: 0 0 auto;
  height: 40px;
  overflow: hidden;
  position: relative;
  width: 40px;
}

.language-option.is-active .flag-btn,
.language-switcher-trigger .flag-btn {
  border-color: #f2d264;
  box-shadow: 0 0 12px rgba(242, 210, 100, 0.45);
}

.flag-btn.es {
  background: linear-gradient(to bottom, #aa151b 0 25%, #f1bf00 25% 75%, #aa151b 75% 100%);
}

.flag-btn.uk {
  background-color: #012169;
  background-image:
    linear-gradient(90deg, transparent 46%, #c8102e 46%, #c8102e 54%, transparent 54%),
    linear-gradient(0deg, transparent 46%, #c8102e 46%, #c8102e 54%, transparent 54%),
    linear-gradient(90deg, transparent 42%, #ffffff 42%, #ffffff 58%, transparent 58%),
    linear-gradient(0deg, transparent 42%, #ffffff 42%, #ffffff 58%, transparent 58%),
    linear-gradient(135deg, transparent 48%, #c8102e 48%, #c8102e 52%, transparent 52%),
    linear-gradient(45deg, transparent 48%, #c8102e 48%, #c8102e 52%, transparent 52%),
    linear-gradient(135deg, transparent 45%, #ffffff 45%, #ffffff 55%, transparent 55%),
    linear-gradient(45deg, transparent 45%, #ffffff 45%, #ffffff 55%, transparent 55%);
}

.flag-btn.cz {
  background: linear-gradient(to bottom, #ffffff 0 50%, #d7141a 50% 100%);
}

.flag-btn.cz::before {
  border-bottom: 20px solid transparent;
  border-left: 24px solid #11457e;
  border-top: 20px solid transparent;
  content: '';
  height: 0;
  left: -1px;
  position: absolute;
  top: -1px;
  width: 0;
}

@media (max-width: 768px) {
  .language-switcher-trigger {
    min-height: 40px;
    padding-right: 12px;
  }

  .language-switcher-current-label {
    display: none;
  }

  .flag-btn {
    height: 34px;
    width: 34px;
  }

  .flag-btn.cz::before {
    border-bottom-width: 17px;
    border-left-width: 21px;
    border-top-width: 17px;
  }
}
```

## Decisiones visuales clave

### Trigger

El boton no es plano ni blanco. Usa:

1. fondo translúcido oscuro para integrarse con la cabecera azul
2. borde blanco semitransparente
3. forma de cápsula con `border-radius: 999px`
4. ligera elevación visual al hover

### Dropdown

El panel del menu no usa fondo sólido claro. Usa:

1. azul muy oscuro translúcido
2. borde suave blanco con baja opacidad
3. sombra larga para separarlo del header
4. esquinas amplias de `18px`

### Opciones

Cada opción debe sentirse ligera:

1. fondo transparente por defecto
2. hover con lavado blanco muy suave
3. sin borde visible
4. espaciado horizontal generoso

### Banderas

Las banderas no usan imágenes. Se dibujan con CSS puro:

1. España con gradiente horizontal por franjas
2. Reino Unido con varios gradientes superpuestos
3. Chequia con fondo bicolor y triángulo en `::before`

## Mapeo de idiomas a clases visuales

En el proyecto actual se usa este mapeo:

```javascript
const FLAG_CLASS_BY_LANGUAGE = {
  es: 'es',
  en: 'uk',
  cs: 'cz',
};
```

Y los alias de idioma son:

```javascript
const LANGUAGE_ALIASES = {
  es: 'es',
  en: 'en',
  cs: 'cs',
  cz: 'cs',
};
```

Conclusión práctica:

1. el idioma lógico es `cs`
2. la clase visual de bandera es `cz`
3. el inglés usa la clase `uk`, no `en`

## Comportamiento JS mínimo

Para replicar la interacción visual necesitas, como mínimo:

```javascript
function createLanguageSelector() {
  const wrapper = document.createElement('div');
  wrapper.className = 'language-switcher';
  wrapper.innerHTML = `
    <button class="language-switcher-trigger" type="button" aria-haspopup="true" aria-expanded="false" data-lang="es">
      <span class="flag-btn es" aria-hidden="true"></span>
      <span class="language-switcher-current-label">Español</span>
    </button>
    <div class="language-switcher-menu" role="menu">
      <button class="language-option is-active" type="button" role="menuitemradio" data-lang="es">
        <span class="flag-btn es" aria-hidden="true"></span>
        <span class="language-option-label">Español</span>
      </button>
      <button class="language-option" type="button" role="menuitemradio" data-lang="en">
        <span class="flag-btn uk" aria-hidden="true"></span>
        <span class="language-option-label">English</span>
      </button>
      <button class="language-option" type="button" role="menuitemradio" data-lang="cs">
        <span class="flag-btn cz" aria-hidden="true"></span>
        <span class="language-option-label">Čeština</span>
      </button>
    </div>
  `;

  const trigger = wrapper.querySelector('.language-switcher-trigger');
  const options = wrapper.querySelectorAll('.language-option');

  trigger.addEventListener('click', () => {
    const nextState = !wrapper.classList.contains('is-open');
    wrapper.classList.toggle('is-open', nextState);
    trigger.setAttribute('aria-expanded', nextState ? 'true' : 'false');
  });

  options.forEach((option) => {
    option.addEventListener('click', () => {
      wrapper.querySelectorAll('.language-option').forEach((node) => {
        node.classList.remove('is-active');
        node.setAttribute('aria-pressed', 'false');
      });

      option.classList.add('is-active');
      option.setAttribute('aria-pressed', 'true');
      wrapper.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    });
  });

  return wrapper;
}
```

## Cierre por click exterior y tecla Escape

Si quieres replicar la UX del repo, añade además:

1. cierre del menu al hacer click fuera
2. cierre del menu al pulsar `Escape`

Patrón mínimo:

```javascript
document.addEventListener('click', (event) => {
  if (!selector.contains(event.target)) {
    selector.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    selector.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }
});
```

## Accesibilidad mínima

Para no degradar el componente, mantén esto:

1. `aria-haspopup="true"` en el trigger
2. `aria-expanded="false|true"` sincronizado con el estado abierto
3. `role="menu"` en el dropdown
4. `role="menuitemradio"` en cada opción
5. `aria-hidden="true"` en las banderas decorativas

## Si quieres replicar solo las banderas

La base geométrica de España y Chequia está explicada también en:

1. `docs/BANDERAS_CSS_HTML.md`

Ese documento es útil si quieres extraer solo las flags para otro componente, pero no sustituye este archivo porque aquí está el contrato completo del selector visual.

## Errores típicos al portarlo

1. Usar imágenes para las banderas y perder consistencia con el estilo actual.
2. Montar el dropdown en un contenedor con `overflow: hidden` y cortar el panel.
3. Cambiar `cs` por clase `cs` y romper la bandera checa actual, que usa clase `cz`.
4. Usar fondo blanco para el menu y perder integración con el header.
5. No ocultar la etiqueta en móvil y dejar el trigger demasiado ancho.
6. Omitir el glow dorado del estado activo, que es parte clara del look.

## Checklist rápido de réplica visual

1. El trigger se ve como una pill oscura translúcida sobre la cabecera.
2. El dropdown aparece alineado a la derecha y no se corta.
3. Las opciones muestran banderas circulares de `40px`.
4. La opción activa resalta la bandera con borde dorado.
5. En móvil desaparece la etiqueta del idioma y quedan solo las flags.
6. El selector abre, cierra y sincroniza `aria-expanded` correctamente.