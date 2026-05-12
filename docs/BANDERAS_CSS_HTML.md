# Banderas de Espana y Republica Checa en HTML y CSS

Este documento deja ejemplos simples para replicar ambas banderas usando HTML y CSS puros.

## 1. Bandera de Espana

### Estructura
La bandera de Espana se puede representar con tres franjas horizontales:

- roja arriba
- amarilla en el centro, con doble altura
- roja abajo

Proporcion habitual: `3:2`.

### HTML
```html
<div class="flag flag-spain">
  <div class="stripe red"></div>
  <div class="stripe yellow"></div>
  <div class="stripe red"></div>
</div>
```

### CSS
```css
.flag {
  width: 300px;
  height: 200px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
}

.flag-spain {
  display: flex;
  flex-direction: column;
}

.flag-spain .stripe.red {
  flex: 1;
  background: #aa151b;
}

.flag-spain .stripe.yellow {
  flex: 2;
  background: #f1bf00;
}
```

## 2. Bandera de la Republica Checa

### Estructura
La bandera de la Republica Checa se puede construir con:

- mitad superior blanca
- mitad inferior roja
- triangulo azul desde el lateral izquierdo hacia el centro

Proporcion habitual: `3:2`.

### HTML
```html
<div class="flag flag-czech">
  <div class="top"></div>
  <div class="bottom"></div>
  <div class="triangle"></div>
</div>
```

### CSS
```css
.flag {
  width: 300px;
  height: 200px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
}

.flag-czech .top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: #ffffff;
}

.flag-czech .bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: #d7141a;
}

.flag-czech .triangle {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  border-top: 100px solid transparent;
  border-bottom: 100px solid transparent;
  border-left: 0 solid transparent;
  border-right: 150px solid #11457e;
}
```

## 3. Ejemplo completo en una sola pagina

### HTML
```html
<div class="flag flag-spain">
  <div class="stripe red"></div>
  <div class="stripe yellow"></div>
  <div class="stripe red"></div>
</div>

<div class="flag flag-czech">
  <div class="top"></div>
  <div class="bottom"></div>
  <div class="triangle"></div>
</div>
```

### CSS
```css
body {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding: 24px;
  background: #f3f4f6;
  font-family: sans-serif;
}

.flag {
  width: 300px;
  height: 200px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.flag-spain {
  display: flex;
  flex-direction: column;
}

.flag-spain .stripe.red {
  flex: 1;
  background: #aa151b;
}

.flag-spain .stripe.yellow {
  flex: 2;
  background: #f1bf00;
}

.flag-czech .top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: #ffffff;
}

.flag-czech .bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: #d7141a;
}

.flag-czech .triangle {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  border-top: 100px solid transparent;
  border-bottom: 100px solid transparent;
  border-right: 150px solid #11457e;
}
```

## 4. Nota rapida para hacerlo responsive

Si quieres que se adapten al contenedor, cambia:

```css
.flag {
  width: 100%;
  max-width: 300px;
  aspect-ratio: 3 / 2;
  height: auto;
}
```

En ese caso, para la bandera checa es mejor generar el triangulo con porcentajes o con `clip-path`:

```css
.flag-czech .triangle {
  position: absolute;
  inset: 0;
  background: #11457e;
  clip-path: polygon(0 0, 50% 50%, 0 100%);
}
```

Con `clip-path`, la bandera se escala mejor en disenos responsive.
