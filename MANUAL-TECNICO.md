# Manual técnico — NODO Shell

> **Documento complementario al MANUAL-Y-MODELO-NEGOCIO.md.**
> Mientras aquel define **qué es** el shell estratégicamente,
> este define **cómo está construido** y **cómo se usa** para
> levantar un sistema vertical nuevo.
>
> **Versión cubierta:** v0.7 (commit `a807da5`).
> **Repo:** https://github.com/MULTIPLAZA/nodo-shell

---

## Tabla de contenidos

1. [Visión general](#1-visión-general)
2. [Stack técnico](#2-stack-técnico)
3. [Estructura de carpetas y archivos](#3-estructura-de-carpetas-y-archivos)
4. [Arquitectura en capas (orden de carga)](#4-arquitectura-en-capas-orden-de-carga)
5. [Sistema de temas](#5-sistema-de-temas)
6. [Sistema de teclado](#6-sistema-de-teclado)
7. [MDI: registry y ciclo de vida de un módulo](#7-mdi-registry-y-ciclo-de-vida-de-un-módulo)
8. [Catálogo completo de `NodoComponents`](#8-catálogo-completo-de-nodocomponents)
9. [Configuración por aplicación](#9-configuración-por-aplicación)
10. [Cómo arrancar un proyecto a medida nuevo](#10-cómo-arrancar-un-proyecto-a-medida-nuevo)
11. [Convenciones de código](#11-convenciones-de-código)
12. [PWA y deploy](#12-pwa-y-deploy)
13. [Changelog resumido](#13-changelog-resumido)
14. [Reglas que NO se tocan](#14-reglas-que-no-se-tocan)

---

## 1. Visión general

NODO Shell es una **plataforma de aplicaciones** (no un producto end-user) construida en HTML/CSS/JS vanilla que provee:

- **Shell visual** estilo Office 2010 / DevExpress WinForms: titlebar + QAT + ribbon expandible + MDI emulado + status bar.
- **Biblioteca de componentes** (`window.NodoComponents.*`) con 13 paquetes y ~30 controles distintos.
- **Sistema de temas** con 3 esquemas listos (Office Blue / Bloomberg Pro / Slate Operational) y mecánica para sumar más.
- **Operación 100% por teclado** estilo desktop legacy (F-keys, flechas en grilla, Ctrl combos, Tab focus visible).
- **PWA** instalable, offline-ready, con cache rules para Cloudflare Pages.

El template **NO se usa solo** — siempre se clona como base de un sistema vertical (Sistema Taller Jordan, ERP de distribución, etc.).

---

## 2. Stack técnico

| Capa | Tecnología | Por qué |
|---|---|---|
| Markup | HTML5 semántico | Sin frameworks, máxima portabilidad |
| Estilos | CSS3 + custom properties (variables CSS) | Tema-aware sin recompilar; 0 build step |
| Scripts | JavaScript vanilla ES6+ (sin transpilación) | Carga directa desde CDN/static, debug nativo en browser |
| PWA | Service Worker + Manifest | Cache offline, instalable como app de escritorio |
| Hosting | Cloudflare Pages (recomendado) | CDN global, deploy en push, gratis |
| Versionado | Git + GitHub | Repo público MULTIPLAZA/nodo-shell |

**No hay:** webpack, vite, npm install, package.json, transpilers, frameworks. Es una decisión deliberada — el shell debe poder editarse y extenderse abriendo un `.html` en VS Code y dándole F5 al navegador.

---

## 3. Estructura de carpetas y archivos

```
nodo-shell/
├── README.md                       descripción + cómo correr
├── MANUAL-Y-MODELO-NEGOCIO.md      documento estratégico (qué es, modelo de negocio, principios)
├── MANUAL-TECNICO.md               este archivo — referencia de implementación
├── PROYECTO.md                     análisis del desktop original + mapa patrones UI
├── docs/                           screenshots de referencia del ERP Lite WinForms
└── mockups/                        ROOT del deploy (Cloudflare apunta acá)
    ├── index.html                  shell base (titlebar/qat/ribbon/workspace/statusbar)
    ├── manifest.json               PWA manifest
    ├── service-worker.js           cache offline
    ├── _headers                    cache rules para Cloudflare Pages
    ├── _redirects                  redirects (vacío por ahora)
    ├── server.js                   static server local (Node)
    ├── server.bat                  atajo Windows
    ├── styles/
    │   ├── reset.css                  reset minimal + scrollbar Windows
    │   ├── tokens.css                 variables CSS: paleta + tipografía + spacing
    │   ├── shell.css                  titlebar + QAT + status bar
    │   ├── ribbon.css                 ribbon: tabs + grupos + botones grandes/chicos
    │   ├── workspace.css              MDI emulado con tabs cerrables
    │   ├── patterns.css               botones, badges, placeholders genéricos
    │   ├── grid.css                   grilla densa tipo XtraGrid (XtraGrid clone)
    │   ├── components.css             KPIs, forms, items-table, side panel,
    │   │                              timeline, summary, notes, cashbox, etc.
    │   ├── components-inputs.css      11 inputs (text/money/ruc/date/...)
    │   ├── components-chart.css       11 gráficos SVG + dynamic
    │   ├── components-overlay.css     modal, toast, document viewer
    │   ├── components-data.css        wizard, kanban, treeview
    │   ├── components-files.css       file upload (data export sin css propio)
    │   ├── components-devexpress.css  navbar, treelist, alert, waitform, vgrid, layout
    │   ├── components-agenda.css      calendario / agenda (vista mes + lista)
    │   ├── themes.css                 sistema de temas (Office/Bloomberg/Slate)
    │   └── keyboard.css               focus visible, badges F#, overlay F1
    ├── js/
    │   ├── app.js                     shell controller, ribbon, MDI, atajos, SW
    │   ├── theme.js                   theme switcher con dropdown en QAT
    │   ├── keyboard-nav.js            F-keys + flechas grilla + Ctrl combos
    │   ├── components-inputs.js       NodoComponents.Inputs
    │   ├── components-chart.js        NodoComponents.Chart (11 tipos + dynamic)
    │   ├── components-overlay.js      NodoComponents.Modal / Toast / DocumentViewer
    │   ├── components-data.js         NodoComponents.Wizard / Kanban / TreeView
    │   ├── components-files.js        NodoComponents.FileUpload / DataExport
    │   ├── components-devexpress.js   NodoComponents.NavBar / TreeList / Alert / WaitForm / VerticalGrid / Layout
    │   ├── components-agenda.js       NodoComponents.Agenda
    │   ├── mock-data.js               datos PY de ejemplo (clientes, etc.)
    │   └── modulos.js                 registry window.MODULOS — lo que cada cliente reemplaza
    └── assets/
        └── icons/icon.svg             icono SVG NODO (favicon + PWA + maskable)
```

**Total v0.7:** 18 CSS + 12 JS + 1 HTML + manifest + SW. ~200 kb sin minificar.

---

## 4. Arquitectura en capas (orden de carga)

El `index.html` carga los archivos en este orden, **respetar siempre**:

### CSS (en orden de cascada)

```html
1. reset.css           ← reset minimal
2. tokens.css          ← variables CSS (la base de TODO)
3. shell.css           ← titlebar + QAT + status bar
4. ribbon.css          ← ribbon: tabs + grupos + botones
5. workspace.css       ← MDI con tabs cerrables
6. patterns.css        ← botones, badges genéricos
7. grid.css            ← XtraGrid clone (la grilla densa)
8. components.css      ← KPIs, forms, items-table, side panel, ...
9. components-inputs.css      ┐
10. components-chart.css      │
11. components-overlay.css    │ paquetes especializados
12. components-data.css       │ (cada uno autocontenido)
13. components-files.css      │
14. components-devexpress.css │
15. components-agenda.css     ┘
16. themes.css         ← OVERRIDES por [data-theme="X"] (cargar AL FINAL)
17. keyboard.css       ← focus visible, badges F#, overlay help
```

**Regla:** el orden importa porque `themes.css` debe poder sobreescribir cualquier estilo anterior por especificidad (`[data-theme="X"] .selector` gana sobre `.selector`).

### Script inline en `<head>` (anti-flash)

Antes que cualquier script, hay un script inline que aplica `data-theme="X"` al `<html>` leyendo de `localStorage`. Esto evita el flash de tema incorrecto al cargar.

```html
<script>
  (function () {
    try {
      var key = (window.NODO_SHELL_CONFIG && window.NODO_SHELL_CONFIG.themeStorageKey) || "nodo-shell.theme";
      var t = localStorage.getItem(key) || "office2010";
      document.documentElement.setAttribute("data-theme", t);
    } catch (e) {}
  })();
</script>
```

### JS (en orden de dependencia)

```html
1. theme.js              ← debe cargar antes que componentes (event themechange)
2. mock-data.js          ← datos del cliente (cada vertical lo reemplaza)
3. components-inputs.js
4. components-chart.js   ← depende de Inputs (formatters)
5. components-overlay.js ← provee Modal usado por otros (Wizard, etc.)
6. components-data.js
7. components-files.js
8. components-devexpress.js
9. components-agenda.js
10. modulos.js           ← registry de módulos (lo reemplaza el cliente)
11. app.js               ← shell controller (debe cargar después de MODULOS)
12. keyboard-nav.js      ← último (depende del DOM ya inicializado)
```

---

## 5. Sistema de temas

### Mecánica

Cada tema es un bloque CSS:

```css
[data-theme="bloomberg"] {
  --ofc-blue-700: #d4a76a;
  --bg-app: #2a2a2a;
  /* ...override de TODAS las variables relevantes... */
}
[data-theme="bloomberg"] .titlebar { background: linear-gradient(...); }
/* ...overrides puntuales sobre selectores específicos... */
```

`theme.js` aplica `data-theme="X"` al `<html>` y persiste en `localStorage`. Cuando cambia, dispara `window.dispatchEvent(new CustomEvent("themechange"))` para que componentes que renderizan canvas/SVG (como `Chart`) se re-rendericen.

### Temas registrados

| ID | Nombre | Descripción |
|---|---|---|
| `office2010` | Office 2010 Blue | Default. Gradientes plata/azul Microsoft. |
| `bloomberg` | Bloomberg Pro | Charcoal + dorado/cobre apagado, mismos gradientes. |
| `slate` | Slate Operational | Verde pizarra + gris frío, ideal logística/stock. |

### Sumar un tema nuevo

**Paso 1** — Bloque en `mockups/styles/themes.css`:

```css
[data-theme="miid"] {
  --ofc-blue-900: #...;   /* color principal oscuro (hover/active) */
  --ofc-blue-700: #...;   /* color principal medio (texto/borde) */
  --ofc-blue-500: #...;   /* color principal claro */
  --ofc-blue-100: #...;   /* highlight selección */
  --bg-app: #...;
  --bg-title: linear-gradient(...);
  --bg-status: linear-gradient(...);
  /* etc, ver el bloque bloomberg como referencia completa */
}

[data-theme="miid"] .titlebar { background: ...; }
[data-theme="miid"] .ribbon-tabs { ... }
[data-theme="miid"] .grid thead th { ... }
/* ...continuar con todos los selectores que necesiten override */
```

**Paso 2** — Entry en `mockups/js/theme.js` array `THEMES`:

```js
{
  id: "miid",
  label: "Mi Tema",
  hint: "Descripción corta",
  swatch: "linear-gradient(90deg, #...0%, #...100%)",  // gradient para el dropdown
  dot: "#..."                                            // color sólido del indicador
}
```

Listo. El switcher del QAT lo muestra automáticamente.

---

## 6. Sistema de teclado

### F-keys (`keyboard-nav.js`)

- **F1** → overlay de ayuda con TODOS los atajos detectados
- **F2..F10** → buscan `[data-fkey="F2"]` en el DOM y disparan `click()`
- F5/F11/F12 NO se interceptan (browser reload/fullscreen/devtools)

Cada cliente solo agrega `data-fkey="F2"` a sus botones del ribbon — el shell es agnóstico:

```html
<button data-open="dashboard" data-title="Tablero" data-fkey="F2">…</button>
<button data-open="clientes"  data-title="Clientes" data-fkey="F3" data-fkey-focus-search="true">…</button>
```

`data-fkey-focus-search="true"` hace que después de abrir el módulo, el foco caiga automáticamente en el buscador.

### Navegación de tablas

Cuando hay una `.grid tbody` activa en el panel del workspace activo:

| Tecla | Acción |
|---|---|
| `↑` / `↓` | Fila anterior / siguiente |
| `PgUp` / `PgDn` | ±10 filas |
| `Home` / `End` | Primera / última fila |
| `Enter` o `Espacio` | Abrir detalle (= doble click sobre la fila) |
| `Supr` | Click sobre `[data-act="eliminar"]` o `"anular"` |

### Ctrl combos

Buscan elementos con `data-act` en el panel activo y disparan click:

| Atajo | Selector buscado |
|---|---|
| `Ctrl+F` | `[data-role^="search"]` o `.tb-search input` (foco) |
| `Ctrl+N` | `[data-act="nuevo"]` o `[data-act="nueva"]` |
| `Ctrl+E` | `[data-act="editar"]` o `[data-act="ver"]` |
| `Ctrl+S` | `[data-act="guardar"]` o `.btn--primary` |
| `Ctrl+P` | `[data-act="imprimir"]` o `[data-act="imprimir-int"]` |

### Navegación general (`app.js`)

| Atajo | Acción |
|---|---|
| `Alt+letra` | Cambiar tab del ribbon (busca el botón con `<span class="ribbon-tab__key">letra</span>`) |
| `Ctrl+Tab` / `Ctrl+Shift+Tab` | Ciclar entre tabs abiertos del MDI |
| `Esc` | Cierra overlay → side panel → tab activo del workspace |
| `Tab` / `Shift+Tab` | Foco al siguiente/anterior elemento (con anillo `:focus-visible` reforzado) |

---

## 7. MDI: registry y ciclo de vida de un módulo

### Registro

Cada módulo es una función registrada en `window.MODULOS`:

```js
window.MODULOS = window.MODULOS || {};

window.MODULOS.miModulo = function (container, data) {
  // container: <section class="ws-panel ws-panel--full"> donde renderizar
  // data: opcional, lo que el llamador pase como segundo arg de openModule
  container.innerHTML = `<div>...</div>`;
  // bind eventos, montar componentes, etc.
};
```

### Apertura desde el ribbon

Botones del ribbon con `data-open="miModulo"`:

```html
<button class="rb-btn-lg" data-open="miModulo" data-title="Mi Módulo">
  <div class="rb-btn-lg__icon">...</div>
  <div class="rb-btn-lg__label">Mi Módulo</div>
</button>
```

Al click:
1. `app.js` toma `data-open` y lo pasa a `openModule(id, source, data)`.
2. Si el módulo ya está abierto → solo activa su tab.
3. Si no → crea tab MDI cerrable + panel `<section class="ws-panel">`, e invoca `window.MODULOS[id](panel)`.

### Apertura programática (desde otros módulos)

```js
// Helper expuesto en window.H
H.openModule("ot-detalle", { id: 1234 });

// O directo
window.__shell.openModule("clientes", null, { filter: "B2B" });
```

### Labels de tabs MDI dinámicos

Para módulos que no están en el ribbon (ej: "ot-detalle"), `app.js` tiene un mapa `DYN_LABELS`:

```js
const DYN_LABELS = {
  "presupuesto-detalle": "Presupuesto",
  "ot-detalle":          "Orden de Trabajo",
  "venta-detalle":       "Venta",
  // ... agregá los tuyos acá
};
```

### Cierre

El usuario puede cerrar con `✕` en la tab, `Esc`, o programáticamente:

```js
window.__shell.closeModule("miModulo");
```

---

## 8. Catálogo completo de `NodoComponents`

13 paquetes, ~30 controles. **Todos comparten estos principios:**

- Constructor: `Component.create({ container, ...opts })` → devuelve `instance`
- Instance API: `getValue/setValue/validate/focus/destroy/refresh` (cuando aplica)
- Cero dependencias externas
- Tema-aware (se adapta a Office/Bloomberg/Slate sin configurar)
- Eventos pasan datos de dominio, no DOM events

### Inputs (`window.NodoComponents.Inputs`)

```js
const i = NodoComponents.Inputs.text({
  container, label: "Nombre", required: true, value: "...",
  placeholder: "...", hint: "...", prefix: "Gs.", suffix: svgIcon,
  readonly: false, disabled: false,
  onChange: (val) => {...},
  onBlur: (val) => {...},
  validate: (val) => true | "mensaje de error"
});
i.getValue(); i.setValue(v); i.validate(); i.focus();
```

**Tipos:** `text` · `money` (Gs. PY) · `ruc` (con dígito verificador SET) · `ci` · `phone` (0981-xxx-xxx) · `email` · `date` (popup calendario) · `dateRange` (con `presets: [{id,label}]` hoy/semana/mes/año) · `select` (combobox searchable) · `switch` · `textarea`.

**Helpers utilitarios:**
- `formatMoney(n)` → `"Gs. 1.500.000"`
- `parseMoney(s)` → `1500000`
- `validateRUC(s)` → boolean (módulo 11 SET Paraguay)
- `validateEmail(s)` → boolean
- `formatPhone(s)` / `formatRUC(s)` / `formatCI(s)`
- `formatDate(d)` → `"25/04/2026"` / `parseDate(s)` → `Date`
- `ymd(d)` → `"2026-04-25"`

### Chart (`window.NodoComponents.Chart`)

11 tipos SVG vanilla con paleta tema-aware y gradientes:

- `bar({ container, title, data, valueFormatter, horizontal, onClick })` — barras con gradiente vertical
- `line({ container, title, series, xLabels, valueFormatter })` — línea con curva Bezier suave + dots
- `area({ ... })` — área con gradiente vertical (opacidad 55→5%)
- `pie({ container, title, data, donut, valueFormatter })` — pie/donut con porcentajes
- `stackedBar({ xLabels, series, valueFormatter })` — barras apiladas
- `groupedBar({ xLabels, series, valueFormatter })` — barras agrupadas
- `sparkline({ container, data, color, large })` — mini gráfico inline
- `gauge({ container, value, min, max, label, valueFormatter, color })` — medidor radial
- `funnel({ container, data, showPercent, valueFormatter })` — embudo con conversion %
- `heatmap({ container, rows, cols, values, color, valueFormatter })` — matriz tipo GitHub

**Componente compuesto:**
```js
NodoComponents.Chart.dynamic({
  container, title,
  data: rawRows,
  valueField: "total",
  group:  { field: "fecha",  by: "month" },   // day|week|month|year
  series: { field: "metodo" },
  filters: [
    { id, label, type: "select"|"multiselect"|"dateRange", field, options, presets }
  ],
  metrics: [
    { id, label, agg: "sum"|"count"|"avg"|"min"|"max", field, formatter }
  ],
  chartTypes: ["bar","stackedBar","groupedBar","line","area","pie","funnel"],
  defaultType: "stackedBar",
  valueFormatter
});
```

Re-renderiza automáticamente cuando cambia un filtro o el tipo.

### Modal (`window.NodoComponents.Modal`)

```js
NodoComponents.Modal.open({
  title, body: "<html>" | HTMLElement,
  footer: "<html>",
  kind: "success"|"warning"|"danger"|undefined,
  size: "sm"|"lg"|undefined,
  onClose
}); // → { el, close, footer, body }

await NodoComponents.Modal.alert({ title, message, kind });   // Promise<true>
await NodoComponents.Modal.confirm({ title, message, kind, confirmLabel }); // Promise<boolean>
```

### Toast (`window.NodoComponents.Toast`)

```js
NodoComponents.Toast.success("Mensaje");
NodoComponents.Toast.warning("Mensaje", { title: "Atención" });
NodoComponents.Toast.danger("Error...");
NodoComponents.Toast.info("Info");
NodoComponents.Toast.show({ kind, title, message, duration: 4000 });
```

### DocumentViewer (`window.NodoComponents.DocumentViewer`)

```js
NodoComponents.DocumentViewer.open({
  url: "/api/factura.pdf",
  type: "pdf"|"image"|"iframe",
  title: "FACT-001"
});
```

Modal lg con toolbar de zoom (25-400%), descargar, imprimir.

### Agenda (`window.NodoComponents.Agenda`)

```js
NodoComponents.Agenda.mount(container, {
  storageKey: "miApp.agenda",
  initialEvents: [{ id, fecha, todoElDia, horaInicio, horaFin, titulo, nota, color, estado }],
  initialView: "month"|"list",
  loader: async () => events,         // override storage default localStorage
  saver:  async (events) => {...},
  onChange: (events) => {...}
});
```

Atajos propios: `↑↓←→` días · `Enter` abrir · `N` nuevo · `T` hoy · `M`/`A` vista · `PgUp`/`PgDn` mes.

### Wizard (`window.NodoComponents.Wizard`)

```js
NodoComponents.Wizard.create({
  container,
  data: {},
  steps: [
    { id, label, sub,
      render(panel, ctx) { ... },
      validate(ctx) { return true | "mensaje de error"; }
    }
  ],
  onComplete(ctx),
  onCancel()
});
```

### Kanban (`window.NodoComponents.Kanban`)

```js
NodoComponents.Kanban.create({
  container, title,
  columns: [{ id, title, color }],
  cards: [{ id, columnId, title, subtitle, color, tag, meta }],
  onMove: (card, fromCol, toCol) => {...},
  onCardClick: (card) => {...}
});
// instance: addCard, removeCard, moveCard, setCards, getCards
```

### TreeView (`window.NodoComponents.TreeView`)

Árbol simple jerárquico, sin columnas:

```js
NodoComponents.TreeView.create({
  container,
  nodes: [{ id, label, icon: svgString, badge, expanded, children: [...] }],
  onSelect: (node) => {...},
  onExpand: (node, isExpanded) => {...}
});
// instance: expandAll, collapseAll, select, getSelected, setNodes
```

### TreeList (`window.NodoComponents.TreeList`)

XtraTreeList — árbol **con columnas**:

```js
NodoComponents.TreeList.create({
  container,
  columns: [{ key, label, width, type: "text"|"num"|"money"|"center", format: (v,row) => ... }],
  data: [
    { id, parentId, ...campos },         // forma plana
    { id, ...campos, children: [...] }   // forma anidada
  ],
  expandColumn: "label",  // qué columna lleva el indent + toggle
  icon: (node) => svgString,
  onSelect: (node) => {...}
});
```

### NavBar (`window.NodoComponents.NavBar`)

XtraNavBar / Outlook bar — sidebar con grupos colapsables:

```js
NodoComponents.NavBar.create({
  container, title,
  groups: [
    { id, title, icon: svgString, expanded: true,
      items: [{ id, label, icon, badge, onClick }]
    }
  ],
  onSelect: (item) => {...}
});
// instance: select(id), setBadge(id, n)
```

### Alert (`window.NodoComponents.Alert`)

AlertControl — notificación esquinera con thumbnail + acciones:

```js
NodoComponents.Alert.show({
  title, message,
  kind: "success"|"warning"|"danger"|undefined,
  thumbnail: "url" | "<svg>...",
  duration: 6000,
  position: "bottom-right"|"top-right",
  actions: [{ label, primary, onClick }]
});

NodoComponents.Alert.success(title, message, opts);
NodoComponents.Alert.warning(title, message, opts);
NodoComponents.Alert.danger(title, message, opts);
NodoComponents.Alert.info(title, message, opts);
```

### WaitForm (`window.NodoComponents.WaitForm`)

XtraWaitForm — overlay loading con spinner:

```js
const w = NodoComponents.WaitForm.show({
  title: "Procesando…",
  message: "Conectando con SIFEN",
  container: undefined  // si pasás container, modo inline; sino fullscreen
});
w.update({ title, message }); // actualizar progreso
w.close();
```

### VerticalGrid / PropertyGrid (`window.NodoComponents.VerticalGrid`)

XtraVerticalGrid — campos como filas:

```js
NodoComponents.VerticalGrid.create({
  container,
  headers: ["Propiedad", "Valor"],
  fields: [
    { type: "category", label: "Datos generales" },   // separador
    { key, label, type: "text"|"number"|"money"|"date"|"select"|"switch"|"textarea"|"password",
      value, options, readonly, required, placeholder }
  ],
  data: { campo1: valor1, ... },   // alternativa a value en field
  editable: true,
  onChange: (key, value) => {...}
});
// instance: getData()
```

### Layout (`window.NodoComponents.Layout`)

XtraLayoutControl — form denso con grupos:

```js
NodoComponents.Layout.create({
  container,
  data: {},
  groups: [
    { title, collapsed: false, columns: 1|2|3|4,
      items: [
        { type: "separator" },
        { type: "text"|"number"|"money"|"date"|"select"|"textarea"|"switch"|"static",
          key, label, value, options, span: 1|2|3, full: false,
          readonly, required, placeholder, rows }
      ]
    }
  ],
  editable: true,
  onChange: (key, value) => {...}
});
// instance: getData()
```

### FileUpload (`window.NodoComponents.FileUpload`)

```js
NodoComponents.FileUpload.create({
  container,
  accept: ".pdf,.png,image/*",
  multiple: true,
  maxSize: 5 * 1024 * 1024,   // bytes
  maxFiles: 5,
  onChange: (files) => {...}
});
// instance: getFiles(), clear()
```

### DataExport (`window.NodoComponents.DataExport`)

Helpers funcionales:

```js
NodoComponents.DataExport.toCSV(rows, columns, filename);    // Excel-friendly: BOM + ;
NodoComponents.DataExport.toJSON(data, filename);
NodoComponents.DataExport.toPrintablePDF(rows, columns, { title, subtitle, footerRow });

// Botón con dropdown:
NodoComponents.DataExport.button({
  container,
  getRows: () => rows,   // o rows: [...]
  columns: [{ key, label, formatter: (v, row) => ... }],
  filename: "ventas",
  title: "Reporte de Ventas",
  subtitle: "Período: ...",
  formats: ["csv", "json", "pdf"]
});
```

### Helpers globales (`window.H`)

Provistos por `js/helpers.js` cuando está incluido (lo carga el sistema cliente, no el template). Si tu sistema no lo trae, usá `NodoComponents.Modal.open(...)` directo:

- `H.openPanel(title, html, iconSVG)` — abre el side panel global
- `H.closePanel()` — cierra el side panel
- `H.confirm(msg)` — wrapper de `confirm()` nativo
- `H.openModule(id, data)` — atajo a `__shell.openModule`
- `H.esc(s)` — escape HTML
- `H.el(html)` — crear elemento desde HTML string
- `H.I` — set de iconos SVG reusables

---

## 9. Configuración por aplicación

Cada cliente puede personalizar el shell inyectando `window.NODO_SHELL_CONFIG` **antes** de cargar `theme.js`:

```html
<script>
  window.NODO_SHELL_CONFIG = {
    // Para que la preferencia de tema sea por-aplicación
    // (no comparta con otros sistemas en el mismo browser)
    themeStorageKey: "taller-jordan.theme",

    // Hints custom para el overlay de F-keys (F1)
    fkeyHints: {
      F2: "Tablero del día",
      F3: "Clientes",
      F4: "Nuevo Presupuesto"
    }
  };
</script>
<script src="js/theme.js"></script>
```

---

## 10. Cómo arrancar un proyecto a medida nuevo

### Paso 1: Clonar

```bash
git clone https://github.com/MULTIPLAZA/nodo-shell.git mi-cliente-sistema
cd mi-cliente-sistema
rm -rf .git                          # iniciar git nuevo
git init
git add . && git commit -m "Base NODO Shell v0.7"
```

### Paso 2: Personalizar `mockups/index.html`

**Titlebar:** cambiar nombre del cliente, RUC, sucursal:

```html
<div class="titlebar__title">
  Mi Cliente :: <strong>Sistema de Gestión</strong> - RUC 80000000-0
</div>
```

**Status bar:** datos contextuales del usuario y la sesión.

**Ribbon:** redefinir tabs + grupos + botones:

```html
<div class="ribbon-tab" data-tab="inicio" aria-selected="true">
  <span class="ribbon-tab__key">I</span>NICIO
</div>
<div class="ribbon-tab" data-tab="ventas">
  <span class="ribbon-tab__key">V</span>ENTAS
</div>
...

<div class="ribbon-panel" data-panel="ventas">
  <div class="rb-group">
    <div class="rb-group__content">
      <button class="rb-btn-lg" data-open="ventas-listado"
              data-title="Ventas" data-fkey="F3"
              data-fkey-focus-search="true">
        <div class="rb-btn-lg__icon">...</div>
        <div class="rb-btn-lg__label">Listado Ventas</div>
      </button>
    </div>
    <div class="rb-group__label">Comprobantes</div>
  </div>
</div>
```

### Paso 3: Crear módulos en `mockups/js/modulos.js`

Borrar el demo y registrar los del cliente:

```js
window.MODULOS = {};

window.MODULOS["ventas-listado"] = function (container, data) {
  // ... renderizar la grilla de ventas usando NodoComponents
  const search = NodoComponents.Inputs.text({...});
  // ... etc.
};
```

### Paso 4: Inyectar `NODO_SHELL_CONFIG` (opcional)

Antes de los `<script>` en `index.html`:

```html
<script>
  window.NODO_SHELL_CONFIG = {
    themeStorageKey: "mi-cliente.theme",
    fkeyHints: { F3: "Ventas", F4: "Nuevo presupuesto" }
  };
</script>
```

### Paso 5: Levantar local

```bash
node mockups/server.js
# http://localhost:8000
```

### Paso 6: Deploy

Push a un repo nuevo de GitHub y conectar con Cloudflare Pages (build output: `mockups`, sin build command).

**Caso real validado:** ver `proyectos-medida/taller-autos/sistema-mockup/` (Sistema Taller Jordan, 13 módulos completos sobre este shell).

---

## 11. Convenciones de código

### Prefijos de clases CSS

| Prefijo | Pertenece a | Ejemplo |
|---|---|---|
| `titlebar__`, `qat__`, `ribbon-`, `rb-`, `ws-` | Shell | `.ribbon-tab`, `.ws-empty` |
| `grid`, `grid-` | XtraGrid clone | `.grid thead`, `.grid-status` |
| `module__`, `tb-` | Toolbar de módulo | `.module__toolbar`, `.tb-btn` |
| `kpi`, `dash`, `form`, `summary-box`, `timeline`, `note`, `subgrid`, `items-table`, `inner-tab`, `cashbox`, `config-`, `receipt-` | components.css genéricos | `.kpi__value`, `.form__section` |
| `state--X` | Badge de estado | `.state--activo`, `.state--mora` |
| `kbd-help` | Overlay F1 | `.kbd-help__panel` |
| `theme-switcher__` | Dropdown de temas | `.theme-switcher__option` |
| `ni__`, `ni-` | Componentes Inputs | `.ni__input`, `.ni__datepicker` |
| `nc-` | Componentes Chart | `.nc-chart`, `.nc-spark` |
| `no-X__` | Otros componentes | `.no-modal__`, `.no-toast`, `.no-wait`, `.no-tl`, `.no-vg`, `.no-lay`, `.no-nav`, `.no-fu`, `.no-kan`, `.no-tree`, `.no-wiz`, `.no-alert`, `.no-docviewer`, `.agenda__` |
| `data-theme="X"` | Selector raíz de tema | `[data-theme="bloomberg"] .selector` |

### Estructura JS de un componente

```js
(function () {
  "use strict";
  window.NodoComponents = window.NodoComponents || {};

  function helperFn() { ... }

  function componentCreate(opts) {
    const wrap = document.createElement("div");
    wrap.className = "no-mycomp";
    wrap.innerHTML = `...`;
    opts.container.appendChild(wrap);

    function render() { ... }
    function bind()   { ... }

    render();
    bind();

    return {
      el: wrap,
      refresh: render,
      destroy: () => wrap.remove(),
      // ... métodos públicos
    };
  }

  window.NodoComponents.MyComp = { create: componentCreate };
  console.log("[NODO Shell] MyComp cargado.");
})();
```

### Naming de archivos

- `mockups/styles/components-X.css` — estilos del paquete X
- `mockups/js/components-X.js` — JS del paquete X (un archivo por paquete, cohesivo)
- Componentes pequeños relacionados pueden compartir archivo (ej: Modal+Toast+DocumentViewer en `components-overlay`)

### Reglas de tema

Cada componente nuevo debe incluir su override de tema en su CSS:

```css
/* default */
.no-mycomp { background: var(--bg-ribbon); color: var(--text); ... }

/* tema overrides */
[data-theme="bloomberg"] .no-mycomp { background: #232323; ... }
[data-theme="slate"]     .no-mycomp { ... }
```

Si usás solo `var(--xxx)` sin gradientes hardcoded, el tema se hereda automático.

---

## 12. PWA y deploy

### Manifest (`mockups/manifest.json`)

Define nombre, ícono, colores, modo standalone. Cada cliente reemplaza:
- `name`, `short_name`
- `theme_color`, `background_color`
- `icons` (apuntar al SVG del cliente)

### Service Worker (`mockups/service-worker.js`)

- Cache-first para assets (`.css`, `.js`, `.svg`, fuentes)
- Network-first para HTML (siempre fresh)

### Cloudflare Pages

Configuración:

| Campo | Valor |
|---|---|
| Framework preset | None |
| Build command | *(vacío)* |
| Build output directory | `mockups` |
| Root directory | `/` |
| Branch | `main` |

`mockups/_headers` define cache rules:
- `/service-worker.js` → no-cache
- `/index.html` → no-cache
- `/styles/*` y `/js/*` → cache 1 año, immutable

Auto-deploy en cada `git push origin main`.

---

## 13. Changelog resumido

| Versión | Commit | Aporte |
|---|---|---|
| **v0.1** | `c083e2f` | Shell base: titlebar + QAT + ribbon (10 tabs) + MDI + status bar. Módulo Clientes funcional. PWA. |
| **v0.2** | `1277c93` | Sistema de temas (Office/Bloomberg/Slate), navegación 100% por teclado, components.css con patrones reusables. |
| **v0.3** | `85b94be` | Componente Agenda (calendario tipo Google Calendar con vista mes + lista). |
| **v0.4** | `4d49f1d` | Biblioteca: Inputs (11 tipos PY), Chart (3 tipos), Modal/Toast/DocumentViewer. |
| **v0.5** | `4028d0f` | +5 componentes: Wizard, Kanban, TreeView, FileUpload, DataExport. |
| **v0.6** | `3731b35` | Charts refactor: paleta tema-aware + gradientes + 6 tipos nuevos (area, stackedBar, groupedBar, sparkline, gauge, funnel, heatmap) + `Chart.dynamic` con filtros y KPIs. |
| **v0.7** | `a807da5` | DevExpress WinForms: NavBar (Outlook bar), TreeList, AlertControl, WaitForm, VerticalGrid (PropertyGrid), LayoutControl. + MANUAL-Y-MODELO-NEGOCIO.md |

---

## 14. Reglas que NO se tocan

Son las **3 reglas de oro** del manual estratégico:

### 1. Anti-fork

Cualquier vertical (Sistema Taller Jordan, ERP de distribución, etc.) **clona el shell pero NO modifica los archivos del shell**. Si necesitás algo nuevo:

- ✅ **SI** está en `NodoComponents.*` o en componentes reusables → usalo
- ✅ **SI** falta un componente genérico → propón sumarlo al shell (PR al template)
- ❌ **NO** edites `tokens.css`, `shell.css`, `ribbon.css`, `grid.css`, etc.
- ❌ **NO** uses overrides `!important` para luchar con el shell — significa que estás haciendo algo mal
- ✅ **SI** necesitás algo MUY específico de tu vertical → ponelo en `your-system.css` o `taller.css` extendiendo selectores propios sin chocar

### 2. No especulación

No agregar features al shell "por si acaso". Cada componente nuevo debe responder a una necesidad real validada en al menos un proyecto cliente.

### 3. Identidad sagrada

El lenguaje visual DevExpress / Office 2010 **es la identidad de NODO**. No modernizar a flat/material/glassmorphism. Si un cliente lo pide, explicarle que es la diferenciación: software de oficina serio, no app de fintech. Los que valoran modernidad por la modernidad no son nuestro segmento.

---

## Apéndice A: cheatsheet ultra-rápido

### Crear un input con validación
```js
const ruc = NodoComponents.Inputs.ruc({
  container: document.getElementById("here"),
  label: "RUC", required: true
});
if (!ruc.validate()) return;
console.log(ruc.getValue());
```

### Mostrar un gráfico de ventas
```js
NodoComponents.Chart.bar({
  container: el,
  title: "Ventas por método",
  data: [
    { label: "Efectivo", value: 4500000 },
    { label: "Transf.",  value: 3200000 }
  ],
  valueFormatter: NodoComponents.Inputs.formatMoney
});
```

### Confirmar antes de borrar
```js
const ok = await NodoComponents.Modal.confirm({
  title: "¿Eliminar?",
  message: "Esta acción no se puede deshacer.",
  kind: "danger",
  confirmLabel: "Sí, eliminar"
});
if (ok) NodoComponents.Toast.warning("Eliminado");
```

### Toast de éxito
```js
NodoComponents.Toast.success("Factura emitida correctamente");
```

### Alert esquinero con acción
```js
NodoComponents.Alert.warning("Certificado por vencer", "Vence en 14 días", {
  actions: [
    { label: "Renovar", primary: true, onClick: () => {...} },
    { label: "Después" }
  ]
});
```

### Loading mientras se procesa algo
```js
const w = NodoComponents.WaitForm.show({ title: "Conectando con SIFEN…" });
try {
  await fetch(...);
  w.close();
  NodoComponents.Toast.success("OK");
} catch (e) {
  w.close();
  NodoComponents.Toast.danger("Error");
}
```

### Sidebar con módulos del sistema
```js
NodoComponents.NavBar.create({
  container: document.getElementById("sidebar"),
  title: "Sistema",
  groups: [
    { id: "ventas", title: "Ventas", icon: "<svg>...</svg>", expanded: true,
      items: [
        { id: "fact", label: "Facturas", icon: "<svg>...</svg>", badge: 12 },
        { id: "nc",   label: "Notas crédito" }
      ]
    }
  ],
  onSelect: (item) => window.__shell.openModule(item.id)
});
```

### Calendario de vencimientos
```js
NodoComponents.Agenda.mount(container, {
  storageKey: "vencimientos",
  initialEvents: [
    { id: 1, fecha: "2026-05-15", todoElDia: true,
      titulo: "Vencimiento IVA", color: "warning" }
  ]
});
```

### Exportar grilla a Excel
```js
NodoComponents.DataExport.toCSV(rows, [
  { key: "fecha",   label: "Fecha" },
  { key: "cliente", label: "Cliente" },
  { key: "total",   label: "Total", formatter: v => NodoComponents.Inputs.formatMoney(v) }
], "ventas-abril.csv");
```

---

**Fin del manual técnico.**

Para preguntas estratégicas (modelo de negocio, principios, pricing, decisiones de producto): ver `MANUAL-Y-MODELO-NEGOCIO.md`.

Para análisis del software desktop original: ver `PROYECTO.md`.

Mantenedor: **Emiliano Vitale** · NODO · Paraguay
