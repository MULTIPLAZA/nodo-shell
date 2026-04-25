# NODO Shell

Plataforma base para sistemas administrativos web — estilo **Office Ribbon**, instalable como PWA, offline-ready.

> Primera implementación: **ERP Lite** (migración del software desktop WinForms de Nodo Informatica). El mismo shell sirve para POS, sistema contable, gestión de stock, CRM, o cualquier app administrativa.

## Stack actual

- **HTML5 + CSS3 + JS vanilla** (sin frameworks, sin build)
- **PWA** (manifest + service worker, instalable en Chrome/Edge/Firefox)
- **Cloudflare Pages** para hosting estático con CDN global
- **GitHub** para versionado y auto-deploy en cada push

## Look & feel

- Clon fiel de **Office 2010 Blue** (gradientes plata/azul metálico, hover ámbar Office)
- **Desktop-first** (1366×768 / 1920×1080), aviso amable <1024px
- **Densidad alta** (labels 11-12px, filas grilla 26-28px)
- **Atajos de teclado** del desktop respetados (Alt+letra, Esc, Ctrl+Tab)

## Superpoderes incluidos en el template

Todo proyecto que arranca clonando este shell hereda automáticamente:

### 1. Sistema de temas (3 temas listos, fácil sumar más)
- **Office 2010 Blue** (default) — clásico Microsoft
- **Bloomberg Pro** — charcoal + dorado/cobre apagado, mismos gradientes
- **Slate Operational** — verde pizarra + gris frío, ideal logística/stock

Switcher en el QAT, persistencia en `localStorage`, anti-flash al cargar.

**Sumar tema nuevo:**
1. Bloque `[data-theme="miid"] { ... }` en `mockups/styles/themes.css` (override de variables + parches a gradientes hardcodeados)
2. Entry en el array `THEMES` de `mockups/js/theme.js` (`{ id, label, hint, swatch, dot }`)

### 2. Operación 100% por teclado
- **F1** → overlay de ayuda con TODOS los atajos (autodescubre las F-keys del DOM)
- **F2..F10** → módulos del cliente (vía `data-fkey="F2"` en el DOM, **agnóstico al shell**)
- **↑ ↓ Home End PgUp PgDn Enter** → navegan la grilla activa
- **Ctrl+F/N/E/S/P** y **Supr** → acciones del módulo activo (vía `data-act="..."`)
- **Tab** con `:focus-visible` reforzado (anillo del color del tema)

**Cablear F-key en un proyecto cliente** — solo agregar atributo en el HTML:
```html
<button data-open="dashboard" data-title="Tablero" data-fkey="F2">…</button>
<button data-open="clientes" data-title="Clientes" data-fkey="F3" data-fkey-focus-search="true">…</button>
```
F5/F11/F12 NO se interceptan (browser reload/fullscreen/devtools).

### 3. Componentes reusables (`styles/components.css`)
Patrones listos para cualquier ERP/POS/admin: KPI cards, dashboard panels, formularios densos, items-table editable con aprobación por checkbox, timeline horizontal de estados, summary box, side panel deslizante con backdrop, inner tabs, notes informativas, cashbox layout, config layout sidebar+main, receipt preview (ticket + A4), estados extendidos para workflows (pendiente/proceso/terminada/facturada/cobrada/anulada/abierta/cerrada/enviado/aprob-parc/...).

### 4. Biblioteca de componentes (`window.NodoComponents`)

Pequeña librería de componentes vanilla, tema-aware, listos para usar en cualquier sistema. **Probalos en vivo abriendo `F6` (módulo Biblioteca) en el ribbon → OPERATIVO.**

| Paquete | Componentes / Métodos |
|---|---|
| **`NodoComponents.Inputs`** | `text` · `money` (Gs. PY con miles) · `ruc` (con dígito verificador SET) · `ci` · `phone` (0981-xxx-xxx) · `email` · `date` (popup calendario) · `dateRange` (con presets: hoy/semana/mes/año) · `select` (combobox searchable) · `switch` (toggle) · `textarea` (con contador). API uniforme: `getValue/setValue/validate/focus/destroy`. Helpers: `formatMoney`, `parseMoney`, `validateRUC`, `formatDate`, `parseDate`, `ymd`. |
| **`NodoComponents.Chart`** | `bar` (vertical u horizontal) · `line` (con `area`) · `pie` (con `donut`). SVG vanilla, **sin librerías externas**, leyenda y tooltips, paleta de 10 colores con cycling. Resize automático. |
| **`NodoComponents.Modal`** | `open({title, body, footer, kind, size})` · `alert({title, message, kind})` (Promise) · `confirm({title, message, kind})` (Promise<boolean>). Tipos: success / warning / danger. Tamaños: sm / md / lg. |
| **`NodoComponents.Toast`** | `success(msg)` · `warning(msg)` · `danger(msg)` · `info(msg)`. Stack automático arriba a la derecha, auto-dismiss configurable. |
| **`NodoComponents.DocumentViewer`** | `open({url, type, title})`. Tipos: `pdf` (iframe nativo) · `image` (con zoom 25%–400%) · `iframe` genérico. Botones de descargar e imprimir. |
| **`NodoComponents.Agenda`** | Calendario estilo Google Calendar. Vista Mes (grilla con chips) + Vista Agenda (lista cronológica). Eventos con título/fecha/hora/nota/color (6)/estado (4). Side panel para editar. Atajos: ↑↓←→ Enter N T M/A PgUp/PgDn. Storage configurable (localStorage por default, override con `loader`/`saver` async). |
| **`NodoComponents.Wizard`** | Stepper con N pasos, validación por paso, navegación libre a pasos completados. Each step define `render(panel, ctx)` y `validate(ctx)`. Callbacks `onComplete(ctx)` / `onCancel()`. |
| **`NodoComponents.Kanban`** | Board con columnas configurables y drag&drop HTML5 entre columnas. Cards con título/subtítulo/tag/color. Callbacks `onMove(card, fromCol, toCol)` y `onCardClick(card)`. API: `addCard`, `removeCard`, `moveCard`. |
| **`NodoComponents.TreeView`** | Árbol jerárquico expandible con icono y badge opcional por nodo. Selección con click. Callbacks `onSelect(node)` y `onExpand(node, isExpanded)`. API: `expandAll`, `collapseAll`, `select`. |
| **`NodoComponents.FileUpload`** | Dropzone con drag&drop + click. Preview de imágenes inline. Validación de `accept`, `maxSize`, `maxFiles`. API: `getFiles()`, `clear()`. |
| **`NodoComponents.DataExport`** | Helpers funcionales: `toCSV(rows, columns, filename)` (UTF-8 BOM + `;` Excel-friendly) · `toJSON(data, filename)` · `toPrintablePDF(rows, columns, {title, subtitle})` (abre ventana imprimible, browser ofrece "Guardar como PDF"). Botón con dropdown: `button({container, getRows, columns, formats})`. |

#### Ejemplos rápidos

```js
// Input money con validación
const monto = NodoComponents.Inputs.money({
  container: document.querySelector("#here"),
  label: "Monto", required: true, value: 1500000
});
monto.getValue(); // 1500000
NodoComponents.Inputs.formatMoney(1500000); // "Gs. 1.500.000"

// Gráfico de barras
NodoComponents.Chart.bar({
  container: el, title: "Ventas del mes",
  data: [{ label: "Efectivo", value: 4500000 }, { label: "Transf.", value: 3200000 }],
  valueFormatter: NodoComponents.Inputs.formatMoney
});

// Modal de confirmación
const ok = await NodoComponents.Modal.confirm({
  title: "¿Anular factura?",
  message: "Se emitirá una nota de crédito.",
  kind: "danger", confirmLabel: "Anular"
});

// Toast
NodoComponents.Toast.success("Factura emitida correctamente");

// Visor de PDF
NodoComponents.DocumentViewer.open({
  url: "/api/factura/1234.pdf", type: "pdf", title: "FACT-001-001-0001234"
});

// Agenda con backend custom
NodoComponents.Agenda.mount(container, {
  loader: async () => fetch("/api/eventos").then(r => r.json()),
  saver:  async (events) => fetch("/api/eventos", { method: "POST", body: JSON.stringify(events) })
});
```

### 4. PWA + Cloudflare Pages
- Manifest, service worker (cache offline), `_headers` con cache rules
- Auto-deploy en cada push a `main`

## Cómo correr local

### Opción 1 — Doble click
- Abrir `mockups/index.html` en navegador (funciona con `file://`)

### Opción 2 — Server local
```bash
node mockups/server.js
# http://localhost:8000
```

### Opción 3 — `.bat` (Windows)
- Doble click a `mockups/server.bat`

## Estructura

```
nodo-shell/
├── README.md
├── PROYECTO.md                  análisis del desktop original + mapa patrones UI
├── docs/                        screenshots de referencia del desktop
└── mockups/                     ROOT del deploy (Cloudflare apunta acá)
    ├── index.html               shell completo: ribbon + MDI + status bar
    ├── manifest.json            PWA manifest
    ├── service-worker.js        cache offline + estrategia network-first HTML
    ├── _headers                 cache rules para Cloudflare Pages
    ├── _redirects               redirects (vacío por ahora)
    ├── server.js                static server local (Node)
    ├── server.bat               atajo para Windows
    ├── styles/
    │   ├── tokens.css           paleta Office 2010 + tipografía + spacing
    │   ├── reset.css            reset minimal + scrollbar Windows
    │   ├── shell.css            título + QAT + status bar
    │   ├── ribbon.css           ribbon: tabs + grupos + botones
    │   ├── workspace.css        MDI emulado con tabs cerrables
    │   ├── patterns.css         botones, badges, placeholders
    │   ├── grid.css             grilla densa tipo XtraGrid (reusable)
    │   ├── components.css       KPIs, forms, items-table, side panel,
    │   │                        timeline, summary, notes, etc (reusable)
    │   ├── components-inputs.css   inputs (text, money, ruc, date, select, switch...)
    │   ├── components-chart.css    gráficos SVG vanilla
    │   ├── components-overlay.css  modal, toast, document viewer
    │   ├── components-data.css     wizard, kanban, treeview
    │   ├── components-files.css    file upload (data export sin css propio)
    │   ├── components-agenda.css   calendario / agenda (vista mes + lista)
    │   ├── themes.css              sistema de temas (Office Blue/Bloomberg/Slate)
    │   └── keyboard.css            focus visible, badges F#, overlay F1
    ├── js/
    │   ├── app.js                  shell controller, atajos, registro SW
    │   ├── theme.js                theme switcher con dropdown en QAT
    │   ├── keyboard-nav.js         F-keys + flechas grilla + Ctrl combos
    │   ├── components-inputs.js    NodoComponents.Inputs (paquete completo)
    │   ├── components-chart.js     NodoComponents.Chart (bar / line / pie)
    │   ├── components-overlay.js   NodoComponents.Modal / Toast / DocumentViewer
    │   ├── components-data.js      NodoComponents.Wizard / Kanban / TreeView
    │   ├── components-files.js     NodoComponents.FileUpload / DataExport
    │   ├── components-agenda.js    NodoComponents.Agenda
    │   ├── mock-data.js            datos PY de ejemplo
    │   └── modulos.js              registry de módulos (clientes, agenda, biblioteca...)
    ├── assets/
    │   └── icons/icon.svg       icono SVG NODO (favicon + PWA + maskable)
    └── modulos/                 mockups por módulo (a demanda)
```

## Deploy en Cloudflare Pages

Configuración:

| Campo | Valor |
|---|---|
| **Framework preset** | None |
| **Build command** | *(vacío)* |
| **Build output directory** | `mockups` |
| **Root directory** | `/` |
| **Branch** | `main` |

Auto-deploy en cada `git push origin main`.

## Atajos de teclado

| Atajo | Acción |
|---|---|
| `F1` | Overlay de ayuda con TODOS los atajos disponibles |
| `F2..F10` | Abrir módulos (cada cliente lo cablea con `data-fkey="F2"` en el ribbon) |
| `↑ ↓` | Fila anterior / siguiente en la grilla activa |
| `Home / End` | Primera / última fila |
| `PgUp / PgDn` | ±10 filas |
| `Enter` o `Espacio` | Abrir detalle (= doble click en la fila) |
| `Supr` | Eliminar / Anular el seleccionado |
| `Ctrl+F` | Foco en el buscador del módulo activo |
| `Ctrl+N` | Nuevo registro |
| `Ctrl+E` | Editar seleccionado |
| `Ctrl+S` | Guardar |
| `Ctrl+P` | Imprimir |
| `Tab` / `Shift+Tab` | Navegar foco entre controles (con anillo visible) |
| `Alt` (mantener) | Resalta letras de acceso en tabs del ribbon |
| `Alt+I/V/C/P/O/T/B/S/H/R` | Cambiar tab del ribbon (la letra subrayada) |
| `Esc` | Cerrar overlay → side panel → tab activo del workspace |
| `Ctrl+Tab` / `Ctrl+Shift+Tab` | Cambiar entre tabs abiertos del MDI |

## Cómo arrancar un proyecto a medida nuevo

1. **Clonar este repo** a una carpeta nueva del cliente, ej: `proyectos-medida/cliente-x/sistema/`
2. **Personalizar `mockups/index.html`:**
   - Titlebar: nombre del cliente + RUC + sucursal
   - Ribbon: definir tus tabs y botones (`data-open="miModulo"` + `data-fkey="F2"`)
   - Status bar: usuario, terminal, datos contextuales
3. **Crear módulos** en `mockups/js/modulos-*.js` y registrarlos en `window.MODULOS`
4. **(Opcional) Override del `STORAGE_KEY` del tema** para que no comparta preferencia con otros sistemas:
   ```html
   <script>window.NODO_SHELL_CONFIG = { themeStorageKey: "cliente-x.theme" };</script>
   ```
5. **(Opcional) Hints de F-keys** para el overlay de ayuda:
   ```js
   window.NODO_SHELL_CONFIG = { fkeyHints: { F2: "Tablero del día", F3: "Clientes" } };
   ```
6. Listo — tu sistema hereda los 3 temas, navegación por teclado, side panel, componentes, PWA, deploy.

**Caso real:** ver `Documents/proyectos-medida/taller-autos/sistema-mockup/` (Sistema Taller Jordan, 13 módulos completos sobre este shell).

## Roadmap

### v0.1 (actual)
- Shell completo (ribbon + MDI + status bar)
- Tabs INICIO + INVENTARIO + CLIENTES con contenido real
- Módulo Clientes funcional con grilla densa, filtros, ordenamiento, búsqueda
- 20 clientes paraguayos pre-cargados
- PWA instalable + offline-ready

### v0.2 (próximo)
- Módulo Productos (grilla similar)
- Formulario maestro-detalle (Cliente / Producto edición)
- Login screen

### v1.0 (refactor "plataforma")
- Configuración del shell (tabs, grupos, branding) por **JSON**
- Módulos como **plugins** registrables
- Multi-tenant: cada cliente con su propio JSON config
- Migración a React + Vite + TanStack manteniendo el look & feel actual

## Agente asistente

**ErpLiteUX** (sonnet) — diseñador UI/UX especializado en este shell.
Definido en `~/.claude/agents/erp-lite-ux.md`.

## Licencia

Privado — Nodo Informatica · Emiliano Vitale
