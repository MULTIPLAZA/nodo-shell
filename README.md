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
    │   └── grid.css             grilla densa tipo XtraGrid (reusable)
    ├── js/
    │   ├── app.js               shell controller, atajos, registro SW
    │   ├── mock-data.js         datos PY de ejemplo
    │   └── modulos.js           registry de módulos (clientes, productos, ...)
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
| `Alt` (mantener) | Resalta letras de acceso en tabs del ribbon |
| `Alt+I` | Tab INICIO |
| `Alt+V` | Tab INVENTARIO |
| `Alt+C` | Tab CLIENTES |
| `Alt+P/O/T/B/S/H/R` | Resto de tabs |
| `Esc` | Cerrar tab activo del workspace |
| `Ctrl+Tab` / `Ctrl+Shift+Tab` | Cambiar entre tabs abiertos |

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
