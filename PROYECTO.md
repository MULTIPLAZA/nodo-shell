# ERP Lite — Migración Desktop → Web (PWA)

Proyecto de migración del ERP Lite (Nodo Informatica, v1.0.109.0) de software desktop WinForms a una PWA moderna.

---

## Contexto

**Software original:**
- Nombre: **Nodo Informatica :: ERP Lite! - Sistema de Gestion Empresarial**
- Versión analizada: `1.0.109.0` (actualizado 20-02-2026, marcado Version BETA!)
- Tecnología probable: **.NET WinForms + DevExpress XtraBars / XtraGrid** (por el skin Office 2010 Blue y el layout del ribbon). Confirmar leyendo el binario o preguntando al desarrollador original.
- Base de datos: a confirmar (probablemente SQL Server o similar).
- Uso: ERP de gestión empresarial — inventario, ventas, compras, tesorería, contabilidad, RRHH, reportes.

**Objetivo de la migración:**
Recrear el ERP como PWA para que los usuarios actuales puedan usarlo desde cualquier PC con navegador, sin instalación, con la misma curva de aprendizaje cero (look & feel reconocible).

**Alcance en esta fase:**
- **Fase actual:** diseño del shell + mockups estáticos. NO backend, NO módulos completos aún.
- **Módulos:** se construirán a demanda, uno por uno, después de aprobar el shell.

---

## Análisis del Shell Desktop

Basado en las 3 capturas de `C:\Users\Administrador\Desktop\ERP LITE\`:

### 1. Barra de título Windows
Texto: `Nodo Informatica :: ERP Lite! - Sistema de Gestion Empresarial - Version: 1.0.109.0 - Actualizado: 20-02-2026 - Version BETA!`
Botones estándar: minimizar, maximizar, cerrar + candado (bloqueo) + ayuda.

### 2. Quick Access Toolbar (QAT)
Arriba a la izquierda, antes de los tabs del ribbon. Iconos chicos (~16×16):
- Nodo (logo)
- Imprimir
- Descargar
- Alerta / notificación
- Iconos adicionales (documento, copiar, etc.)
- Botón `×` (¿cerrar?)
- Dropdown de más opciones

### 3. Ribbon Bar — 10 Tabs
Orden exacto (respetar en la web):

| # | Tab | Grupos identificados |
|---|---|---|
| 1 | **INICIO** | Mi Empresa · Definiciones (Sucursales, Depósitos, Tipos de Depósitos, Operaciones, Comprobantes, Impuestos, Proyectos, Monedas, Configuraciones, Fechas de Operaciones, Formulario de Impresion) · Herramientas (Actualizar Datos, Descargar Registros, Notificacion, Importar Datos) · Sesion (Usuario, Licencia, Acerca de, Minimizar, Version Beta!, Cerrar Sesion, Salir) |
| 2 | **INVENTARIO** | Productos (grande) · Productos (Tipos de Productos, Clasificacion 1/2/3, Uni. de Medida, Lista de Precios, Precios de Venta) · Movimiento de Stock (Entrada, Salida, Transferencia) · Reportes (Listado de Productos, Extracto de Movimientos, Existencia Valorizada, Existencia en Deposito, Lista de Precio, Movimientos, Inventario, Reparar Stock) |
| 3 | **PROVEEDORES** | *(a relevar — no hay captura aún)* |
| 4 | **CLIENTES** | Clientes (grande) · Clientes (Tipos de Clientes, Clasificacion, Localidad, Vendedores) · Comprobantes (TPV, Presupuestos, Pedidos, Venta, Notas de Credito, Administrar Venta, Facturacion Electronica, Administrar Cajas, Serie de Comprobantes, Motivos de Anulacion) · Planes (Remision, Documentos Recurrentes, Planes de Venta) · Reportes |
| 5 | **OPERATIVO** | *(a relevar)* |
| 6 | **TESORERIA** | *(a relevar)* |
| 7 | **CONTABILIDAD** | *(a relevar)* |
| 8 | **SEGURIDAD** | *(a relevar)* |
| 9 | **R.R.H.H.** | *(a relevar — recursos humanos)* |
| 10 | **REPORTES** | *(a relevar)* |

Botón "File/Archivo" azul a la izquierda de los tabs (menú tipo Office con "Nuevo / Abrir / Guardar / Salir").

### 4. MDI Container
Área central gris-azulada donde se abren los formularios. Vacía cuando no hay nada abierto. En el desktop esto soporta tener **múltiples ventanas abiertas a la vez** (MDI = Multiple Document Interface).

### 5. Status Bar inferior
Información de contexto del usuario logueado:
- `Licencia otorgada a: CARLOS CARDOZO PINTOS - RUC: 3778760-8`
- `Sucursal: NODO SUC2`
- `Deposito: SUC2`
- `Terminal: EMILIANO`
- `Usuario: admin - Administrador`
- `Imagen de Fondo` (toggle/link)

Cada item tiene su icono chiquito a la izquierda.

---

## Decisiones de diseño

### Estética: **Opción B — Modernizada fiel**
- Misma estructura del desktop (ribbon, MDI, status bar, tabs, grupos, iconos)
- Paleta plana moderna estilo **Fluent Design / Office 365** (azules planos, sin gradientes metálicos)
- Tipografía **Segoe UI** (igual que el desktop) con fallback a Inter
- Densidad alta mantenida (labels 11-12px, filas de tabla 26-28px)
- Iconografía reconocible con SVG modernos (Fluent UI Icons / Lucide / Tabler)

### Stack

**Fase Mockups (actual):**
- HTML5 + CSS3 + JS vanilla
- Sin librerías (ni Tailwind, ni Bootstrap)
- CSS con custom properties
- Se sirve con `python -m http.server`

**Fase Producción (futura):**
- **React + Vite + Tailwind + TanStack Router + TanStack Table**
- **PWA** (manifest.json + service worker, instalable)
- **Desktop-first**, pantallas base 1366×768 y 1920×1080
- Degradación amable <1024px ("Usá una notebook o PC")
- Backend a definir (probablemente API REST sobre la base SQL Server existente, o un agente local tipo SQLtoWEB)

### MDI → Tabs cerrables
El MDI del desktop (múltiples ventanas apiladas) se reemplaza por **tabs cerrables arriba del workspace**:
- Cada módulo abierto = 1 tab
- Usuario puede tener 5+ módulos abiertos en paralelo
- Tab activo muestra su contenido; resto se mantiene en memoria
- Asterisco `*` si hay cambios sin guardar
- Botón `×` en el tab para cerrar
- Click derecho en tab → menú contextual (cerrar, cerrar otros, cerrar todos)

### Atajos de teclado (respetar del desktop)
- `F1` ayuda
- `F2` editar campo/celda activo
- `F5` refrescar
- `Esc` cerrar tab activo (o cancelar acción en curso)
- `Ctrl+S` guardar
- `Ctrl+N` nuevo
- `Alt+letra` navegar a tab del ribbon (ej: `Alt+I` = INICIO, `Alt+V` = INVENTARIO)
- `Ctrl+Tab` / `Ctrl+Shift+Tab` moverse entre tabs del workspace

---

## Mapa de Patrones UI

Cada patrón se define una vez y se reusa. Cuando aparezca un módulo con patrón nuevo, se agrega acá.

| Patrón | Dónde vive | Estado |
|---|---|---|
| Shell (QAT + título + ribbon + MDI + status bar) | `mockups/index.html` | ✅ implementado en v0.1 |
| Ribbon tab con grupos | `mockups/styles/ribbon.css` | ✅ v0.1 |
| Workspace con tabs cerrables | `mockups/styles/workspace.css` | ✅ v0.1 |
| Status bar con iconos | `mockups/styles/shell.css` | ✅ v0.1 |
| Formulario maestro-detalle | `mockups/styles/patterns.css` (TODO) | ⏳ pendiente |
| Grilla tipo XtraGrid (densa, edición inline) | `mockups/styles/patterns.css` (TODO) | ⏳ pendiente |
| Lookup (combo con búsqueda F4) | TODO | ⏳ pendiente |
| Search box con resultados | TODO | ⏳ pendiente |
| Treeview (sucursales/depósitos) | TODO | ⏳ pendiente |
| Side panel (en vez de modal anidado) | TODO | ⏳ pendiente |
| Wizard multi-step | TODO | ⏳ pendiente |
| Report viewer (PDF preview + toolbar) | TODO | ⏳ pendiente |
| Toast notification | TODO | ⏳ pendiente |

---

## Mapping Desktop → Web

| Desktop (WinForms / DevExpress) | Web (PWA) |
|---|---|
| Ribbon bar con tabs | Ribbon HTML/CSS con tabs clickeables + tab content expandido |
| QAT | Barra flex arriba izquierda, botones 24×24 con tooltip |
| MDI Container | `<main class="workspace">` con tabs cerrables arriba |
| XtraGrid (grilla densa) | `<table>` con clase `.grid-dense` + JS edición inline (React: TanStack Table) |
| Lookup (F4) | Input con dropdown autocomplete + modal si hace falta |
| Treeview | `<ul>` anidado con flechas ▶/▼ expandibles |
| Dialog modal | `<dialog>` nativo o overlay CSS |
| Side panel | `<aside>` deslizable desde la derecha |
| Report viewer | iframe con PDF.js o canvas con preview |
| Status bar | `<footer class="statusbar">` fija abajo |

---

## Próximos pasos

1. ✅ **Shell v0.1** — `mockups/index.html` con ribbon (10 tabs, 3 con contenido real: INICIO/INVENTARIO/CLIENTES) + MDI + status bar. Listo para servir y revisar.
2. ⏳ **Relevamiento de tabs faltantes** — obtener capturas de PROVEEDORES, OPERATIVO, TESORERIA, CONTABILIDAD, SEGURIDAD, R.R.H.H., REPORTES para completar el ribbon.
3. ⏳ **Primer módulo: TPV o Productos** — decidir cuál es el más crítico y arrancar con ese.
4. ⏳ **Mockup de grilla tipo XtraGrid** — componente clave reutilizable para casi todos los módulos (listados).
5. ⏳ **Mockup de formulario maestro-detalle** — componente clave para ventas/compras/movimientos.
6. ⏳ **Login screen** — pantalla previa al shell, con logo Nodo + campos usuario/password + selector de sucursal/terminal.
7. ⏳ **Manifest PWA + service worker** — una vez aprobado el shell.

---

## Cómo correr los mockups

```bash
cd C:/Users/Administrador/Documents/GitHub/erp-lite-web/mockups
python -m http.server 8000
```

Abrir en navegador: `http://localhost:8000`

---

## Equipo / Agentes

- **ErpLiteUX** (sonnet) — diseñador UI/UX. Genera mockups HTML/CSS, mantiene este documento, propone patrones.
- *(futuros)* ErpLiteArquitecto (stack React + backend), ErpLiteBackend (API + integración con BD), ErpLiteProducto (reglas de negocio por módulo).
