/* ============================================================
   Registro de módulos del ERP Lite Web
   Cada módulo es una función que recibe el container <section>
   y renderiza su contenido con eventos.
   ============================================================ */

window.MODULOS = window.MODULOS || {};

/* Iconos SVG reusables */
const I = {
  nuevo:    `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M7 1h2v6h6v2H9v6H7V9H1V7h6V1z"/></svg>`,
  editar:   `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11 1l4 4-9 9H2v-4l9-9zm-1 2L3 10v3h3l7-7-3-3z"/></svg>`,
  eliminar: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M6 1h4v1h4v2H2V2h4V1zm-3 4h10l-1 10H4L3 5zm2 1l.7 8h4.6L11 6H5z"/></svg>`,
  guardar:  `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h10l2 2v10H2V2zm2 2v3h6V4H4zm0 5v5h8V9H4z"/></svg>`,
  imprimir: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2h8v3H4V2zm-2 4h12v6h-2v2H4v-2H2V6zm2 2v4h8V8H4zm2 2h4v1H6v-1z"/></svg>`,
  excel:    `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h2v2H5V5zm3 0h2v2H8V5zm3 0h1v2h-1V5zM5 8h2v2H5V8zm3 0h2v2H8V8zm3 0h1v2h-1V8z"/></svg>`,
  pdf:      `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h7l3 3v11H3V1zm1 1v12h8V5H9V2H4zm1 6h2v1H5V8zm3 0h3v1H8V8zm-3 2h6v1H5v-1zm0 2h4v1H5v-1z"/></svg>`,
  refresh:  `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a6 6 0 015.7 4H12v1h3V4h-1v1.3A7 7 0 001 8h1A6 6 0 018 2zM14 8a6 6 0 01-11.7 2H4V9H1v3h1v-1.3A7 7 0 0015 8h-1z"/></svg>`,
  buscar:   `<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M11 11l4 4" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>`,
  filtro:   `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14v2L9 10v5L7 14V10L1 4V2z"/></svg>`,
  importar: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 14V7h2L8 3 6 7h2v7zM2 1h12v2H2V1z"/></svg>`,
  exportar: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M7 1h2v7h2L8 12 5 8h2V1zM2 13h12v2H2v-2z"/></svg>`,
};

/* Helpers */
function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/* ============================================================
   MÓDULO: Clientes
   Listado denso tipo XtraGrid con filtros, ordenamiento,
   selección, totales, paginación.
   ============================================================ */
window.MODULOS.clientes = function (container) {
  const data = (window.MOCK && window.MOCK.clientes) || [];
  const fmt = window.MOCK.fmt;

  const columns = [
    { key: "cod",      label: "Código",         className: "col-code", width: 90  },
    { key: "ruc",      label: "RUC",            className: "col-code", width: 100 },
    { key: "razon",    label: "Razón Social",   className: "",         width: 240 },
    { key: "fantasia", label: "Nombre Fantasía",className: "",         width: 170 },
    { key: "tipo",     label: "Tipo",           className: "col-center", width: 75 },
    { key: "ciudad",   label: "Ciudad",         className: "",         width: 130 },
    { key: "tel",      label: "Teléfono",       className: "col-code", width: 110 },
    { key: "email",    label: "Email",          className: "",         width: 200 },
    { key: "limite",   label: "Límite Crédito", className: "col-money",width: 120, format: (v) => fmt.gs(v) },
    { key: "saldo",    label: "Saldo Pendiente",className: "col-money",width: 120, format: (v) => fmt.gs(v) },
    { key: "estado",   label: "Estado",         className: "col-center", width: 80,
      render: (v) => `<span class="state state--${escapeHtml(v)}">${escapeHtml(v.charAt(0).toUpperCase() + v.slice(1))}</span>` }
  ];

  // Estado interno
  let filtered = [...data];
  let sortKey = null;
  let sortDir = 1;
  let selectedRow = null;
  const filters = {};

  container.innerHTML = `
    <div class="module">
      <!-- Toolbar -->
      <div class="module__toolbar">
        <button class="tb-btn tb-btn--primary" data-act="nuevo"><span class="tb-btn__icon">${I.nuevo}</span>Nuevo</button>
        <button class="tb-btn" data-act="editar"><span class="tb-btn__icon">${I.editar}</span>Editar</button>
        <button class="tb-btn" data-act="eliminar"><span class="tb-btn__icon">${I.eliminar}</span>Eliminar</button>
        <div class="module__toolbar-sep"></div>
        <button class="tb-btn" data-act="imprimir"><span class="tb-btn__icon">${I.imprimir}</span>Imprimir</button>
        <button class="tb-btn" data-act="excel"><span class="tb-btn__icon">${I.excel}</span>Exportar Excel</button>
        <button class="tb-btn" data-act="pdf"><span class="tb-btn__icon">${I.pdf}</span>PDF</button>
        <div class="module__toolbar-sep"></div>
        <button class="tb-btn" data-act="refresh"><span class="tb-btn__icon">${I.refresh}</span>Actualizar (F5)</button>
        <div class="module__toolbar-spacer"></div>
        <div class="tb-search">
          <span class="tb-search__icon">${I.buscar}</span>
          <input type="text" placeholder="Buscar en todos los campos..." data-role="search-global">
        </div>
      </div>

      <!-- Group bar (estilo XtraGrid) -->
      <div class="grid-groupbar">Arrastre un encabezado de columna acá para agrupar por esa columna.</div>

      <!-- Grid -->
      <div class="grid-wrap">
        <table class="grid">
          <thead>
            <tr id="thr"></tr>
            <tr id="tfr"></tr>
          </thead>
          <tbody id="tbd"></tbody>
          <tfoot>
            <tr id="tff"></tr>
          </tfoot>
        </table>
      </div>

      <!-- Status bar del grid -->
      <div class="grid-status">
        <span><strong id="grid-count">${filtered.length}</strong> de ${data.length} registros</span>
        <div class="module__toolbar-sep"></div>
        <span id="grid-selected">Sin selección</span>
        <div class="grid-status__spacer"></div>
        <span>Página</span>
        <button class="grid-status__btn" disabled>«</button>
        <button class="grid-status__btn" disabled>‹</button>
        <input class="grid-status__input" value="1 / 1" readonly>
        <button class="grid-status__btn" disabled>›</button>
        <button class="grid-status__btn" disabled>»</button>
      </div>
    </div>
  `;

  const thr = container.querySelector("#thr");
  const tfr = container.querySelector("#tfr");
  const tbd = container.querySelector("#tbd");
  const tff = container.querySelector("#tff");
  const countEl = container.querySelector("#grid-count");
  const selEl = container.querySelector("#grid-selected");

  // ---- Render encabezado ----
  thr.innerHTML = columns.map(c => `
    <th data-key="${c.key}" style="min-width:${c.width}px;width:${c.width}px;">${escapeHtml(c.label)}</th>
  `).join("");

  tfr.innerHTML = columns.map(c => `
    <th class="th-filter"><input type="text" data-fkey="${c.key}" placeholder=""></th>
  `).join("");

  // ---- Render fila de totales ----
  function renderFooter() {
    const totalLimite = filtered.reduce((s, r) => s + (r.limite || 0), 0);
    const totalSaldo  = filtered.reduce((s, r) => s + (r.saldo  || 0), 0);
    tff.innerHTML = columns.map((c, i) => {
      if (i === 0) return `<td><strong>TOTAL (${filtered.length})</strong></td>`;
      if (c.key === "limite") return `<td class="col-money">${fmt.gs(totalLimite)}</td>`;
      if (c.key === "saldo")  return `<td class="col-money">${fmt.gs(totalSaldo)}</td>`;
      return `<td></td>`;
    }).join("");
  }

  // ---- Render cuerpo ----
  function renderBody() {
    if (filtered.length === 0) {
      tbd.innerHTML = `<tr><td colspan="${columns.length}" style="text-align:center;padding:30px;color:var(--text-muted);font-style:italic;">Sin resultados</td></tr>`;
    } else {
      tbd.innerHTML = filtered.map((row, idx) => `
        <tr data-idx="${idx}" class="${selectedRow === idx ? 'is-selected' : ''}">
          ${columns.map(c => {
            const v = row[c.key];
            if (c.render) return `<td class="${c.className}">${c.render(v, row)}</td>`;
            if (c.format) return `<td class="${c.className}">${escapeHtml(c.format(v))}</td>`;
            return `<td class="${c.className}" title="${escapeHtml(String(v ?? ''))}">${escapeHtml(String(v ?? ''))}</td>`;
          }).join("")}
        </tr>
      `).join("");
    }
    countEl.textContent = filtered.length;
    renderFooter();
  }

  // ---- Filtrado ----
  function applyFilters(globalQuery) {
    const q = (globalQuery || "").toLowerCase().trim();
    filtered = data.filter(row => {
      // filtros por columna
      for (const k in filters) {
        const fv = filters[k].toLowerCase();
        if (!fv) continue;
        const rv = String(row[k] ?? "").toLowerCase();
        if (!rv.includes(fv)) return false;
      }
      // global
      if (q) {
        const hay = columns.some(c => String(row[c.key] ?? "").toLowerCase().includes(q));
        if (!hay) return false;
      }
      return true;
    });
    if (sortKey) sortRows(sortKey, sortDir, false);
    renderBody();
  }

  // ---- Ordenamiento ----
  function sortRows(key, dir, render = true) {
    sortKey = key; sortDir = dir;
    filtered.sort((a, b) => {
      const va = a[key], vb = b[key];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va ?? "").localeCompare(String(vb ?? ""), "es", { numeric: true }) * dir;
    });
    // marcar header
    thr.querySelectorAll("th").forEach(th => {
      th.classList.remove("th-sort-asc", "th-sort-desc");
      if (th.dataset.key === key) th.classList.add(dir === 1 ? "th-sort-asc" : "th-sort-desc");
    });
    if (render) renderBody();
  }

  // ---- Eventos ----
  thr.addEventListener("click", (e) => {
    const th = e.target.closest("th");
    if (!th) return;
    const key = th.dataset.key;
    const newDir = (sortKey === key && sortDir === 1) ? -1 : 1;
    sortRows(key, newDir);
  });

  tfr.addEventListener("input", (e) => {
    const inp = e.target.closest("input");
    if (!inp) return;
    filters[inp.dataset.fkey] = inp.value;
    selectedRow = null;
    selEl.textContent = "Sin selección";
    applyFilters(container.querySelector('[data-role="search-global"]').value);
  });

  container.querySelector('[data-role="search-global"]').addEventListener("input", (e) => {
    selectedRow = null;
    selEl.textContent = "Sin selección";
    applyFilters(e.target.value);
  });

  tbd.addEventListener("click", (e) => {
    const tr = e.target.closest("tr");
    if (!tr || !tr.dataset.idx) return;
    const idx = Number(tr.dataset.idx);
    selectedRow = idx;
    tbd.querySelectorAll("tr").forEach(r => r.classList.remove("is-selected"));
    tr.classList.add("is-selected");
    const row = filtered[idx];
    selEl.innerHTML = `Seleccionado: <strong>${escapeHtml(row.cod)}</strong> — ${escapeHtml(row.razon)}`;
  });

  tbd.addEventListener("dblclick", (e) => {
    const tr = e.target.closest("tr");
    if (!tr || !tr.dataset.idx) return;
    const row = filtered[Number(tr.dataset.idx)];
    alert(`Editar cliente:\n\n${row.cod} — ${row.razon}\nRUC: ${row.ruc}\n\n(Mockup — el formulario real abriría acá)`);
  });

  // Toolbar acciones (placeholders)
  container.querySelector(".module__toolbar").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "refresh") { applyFilters(container.querySelector('[data-role="search-global"]').value); return; }
    const sel = selectedRow !== null ? filtered[selectedRow] : null;
    if ((act === "editar" || act === "eliminar") && !sel) {
      alert("Seleccioná un cliente primero (click en una fila).");
      return;
    }
    const labels = { nuevo: "Nuevo cliente", editar: "Editar cliente", eliminar: "Eliminar cliente",
                     imprimir: "Imprimir listado", excel: "Exportar a Excel", pdf: "Exportar a PDF" };
    alert(`${labels[act]}${sel ? `\n\n${sel.cod} — ${sel.razon}` : ""}\n\n(Mockup — acción simulada)`);
  });

  // Render inicial
  renderBody();
};


/* ============================================================
   MÓDULO: Agenda (demo del componente NodoComponents.Agenda)
   ============================================================
   Cualquier proyecto cliente puede registrar su agenda así:

     window.MODULOS.miAgenda = function (container) {
       window.NodoComponents.Agenda.mount(container, {
         storageKey: "miApp.agenda",
         loader: async () => myBackend.fetchEvents(),
         saver:  async (events) => myBackend.saveEvents(events),
         initialEvents: [...]
       });
     };
   ============================================================ */
window.MODULOS.agenda = function (container) {
  // Mock data inicial — solo si localStorage está vacío
  const today = new Date();
  function ymd(d) {
    const p = n => String(n).padStart(2,"0");
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  }
  function add(d, n) { const r = new Date(d); r.setDate(r.getDate()+n); return r; }

  const initialEvents = [
    { id: "ev-demo-1", fecha: ymd(today),         horaInicio: "09:00", horaFin: "10:00", titulo: "Reunión con cliente",        nota: "Revisar avance del proyecto", color: "info",    estado: "pendiente" },
    { id: "ev-demo-2", fecha: ymd(today),         todoElDia: true,     titulo: "Vencimiento IVA mensual",     nota: "Presentar antes de las 18:00", color: "warning", estado: "pendiente" },
    { id: "ev-demo-3", fecha: ymd(add(today,1)),  horaInicio: "14:30", horaFin: "15:00", titulo: "Llamar a proveedor Bosch",   color: "default", estado: "pendiente" },
    { id: "ev-demo-4", fecha: ymd(add(today,2)),  horaInicio: "11:00", titulo: "Entrega de mercadería",       nota: "Local 3 — pedido #4521", color: "success", estado: "pendiente" },
    { id: "ev-demo-5", fecha: ymd(add(today,3)),  todoElDia: true,     titulo: "Capacitación equipo",         color: "purple",  estado: "pendiente" },
    { id: "ev-demo-6", fecha: ymd(add(today,7)),  horaInicio: "16:00", titulo: "Cierre de mes",                color: "danger",  estado: "pendiente" },
    { id: "ev-demo-7", fecha: ymd(add(today,-2)), horaInicio: "10:00", horaFin: "11:30", titulo: "Reunión semanal equipo",     color: "teal",    estado: "hecho" },
    { id: "ev-demo-8", fecha: ymd(add(today,-1)), todoElDia: true,     titulo: "Pagar servicios",              color: "warning", estado: "hecho" },
    { id: "ev-demo-9", fecha: ymd(add(today,5)),  horaInicio: "08:30", horaFin: "09:30", titulo: "Desayuno con socio",         nota: "Café Martínez", color: "default", estado: "pendiente" },
    { id: "ev-demo-10", fecha: ymd(add(today,10)), todoElDia: true,    titulo: "Feriado provincial",           color: "danger",  estado: "pendiente" }
  ];

  window.NodoComponents.Agenda.mount(container, {
    storageKey: "nodo-shell-demo.agenda",
    initialEvents,
    initialView: "month"
  });
};


/* ============================================================
   MÓDULO: Biblioteca de componentes (showcase / demo)
   ============================================================
   Muestra todos los NodoComponents en acción para que cualquier
   desarrollador o agente vea cómo usarlos.
   ============================================================ */
window.MODULOS.biblioteca = function (container) {
  const NC = window.NodoComponents;
  const I = NC.Inputs;

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;background:var(--bg-app);overflow:auto;">
      <div style="background:linear-gradient(180deg,#eef2f7 0%, #dce3ec 100%);border-bottom:1px solid var(--border-strong);padding:8px 14px;">
        <h2 style="margin:0;color:var(--ofc-blue-900);font-size:16px;">📚 Biblioteca de componentes — NODO Shell</h2>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
          Todos los <code>window.NodoComponents</code> en acción. Click en cada botón para probar. Ver código en
          <code>mockups/js/components-*.js</code>.
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px;">

        <!-- ===== INPUTS ===== -->
        <div class="form__section">
          <div class="form__section-title">📝 Inputs.text · email · phone</div>
          <div style="padding:10px;display:flex;flex-direction:column;gap:8px;" data-demo="inputs-basic"></div>
        </div>

        <div class="form__section">
          <div class="form__section-title">💰 Inputs.money · ruc · ci (PY)</div>
          <div style="padding:10px;display:flex;flex-direction:column;gap:8px;" data-demo="inputs-py"></div>
        </div>

        <div class="form__section">
          <div class="form__section-title">📅 Inputs.date · dateRange (con presets)</div>
          <div style="padding:10px;display:flex;flex-direction:column;gap:8px;" data-demo="inputs-date"></div>
        </div>

        <div class="form__section">
          <div class="form__section-title">⬇️ Inputs.select · switch · textarea</div>
          <div style="padding:10px;display:flex;flex-direction:column;gap:8px;" data-demo="inputs-select"></div>
        </div>

        <!-- ===== CHARTS ===== -->
        <div class="form__section" style="grid-column:span 2;">
          <div class="form__section-title">📊 Chart — bar / line / area / pie (con gradientes, paleta tema-aware)</div>
          <div style="padding:10px;display:grid;grid-template-columns:1fr 1fr;gap:10px;" data-demo="charts">
            <div style="height:240px;border:1px solid var(--border);background:#fff;" data-chart="bar"></div>
            <div style="height:240px;border:1px solid var(--border);background:#fff;" data-chart="line"></div>
            <div style="height:240px;border:1px solid var(--border);background:#fff;" data-chart="area"></div>
            <div style="height:240px;border:1px solid var(--border);background:#fff;" data-chart="pie"></div>
          </div>
        </div>

        <div class="form__section" style="grid-column:span 2;">
          <div class="form__section-title">📊 Chart avanzados — stackedBar · groupedBar · funnel · heatmap</div>
          <div style="padding:10px;display:grid;grid-template-columns:1fr 1fr;gap:10px;" data-demo="charts2">
            <div style="height:260px;border:1px solid var(--border);background:#fff;" data-chart="stackedBar"></div>
            <div style="height:260px;border:1px solid var(--border);background:#fff;" data-chart="groupedBar"></div>
            <div style="height:260px;border:1px solid var(--border);background:#fff;" data-chart="funnel"></div>
            <div style="height:260px;border:1px solid var(--border);background:#fff;" data-chart="heatmap"></div>
          </div>
        </div>

        <div class="form__section">
          <div class="form__section-title">⏱ Chart.gauge — medidor radial</div>
          <div style="padding:10px;display:grid;grid-template-columns:1fr 1fr;gap:10px;" data-demo="gauges">
            <div style="height:160px;border:1px solid var(--border);background:#fff;" data-chart="gauge1"></div>
            <div style="height:160px;border:1px solid var(--border);background:#fff;" data-chart="gauge2"></div>
          </div>
        </div>

        <div class="form__section">
          <div class="form__section-title">📈 Chart.sparkline — mini gráficos inline</div>
          <div style="padding:10px;font-size:13px;" data-demo="sparks">
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead><tr style="background:#eef3fa;border-bottom:1px solid var(--border);">
                <th style="padding:5px 8px;text-align:left;">Cliente</th>
                <th style="padding:5px 8px;text-align:right;">Mes actual</th>
                <th style="padding:5px 8px;text-align:left;">Tendencia 7 días</th>
              </tr></thead>
              <tbody data-role="spark-rows"></tbody>
            </table>
          </div>
        </div>

        <div class="form__section" style="grid-column:span 2;">
          <div class="form__section-title">📊 Chart.dynamic — dashboard interactivo (filtros + KPIs + selector tipo)</div>
          <div style="padding:10px;height:480px;" data-demo="dynamic"></div>
        </div>

        <!-- ===== OVERLAYS ===== -->
        <div class="form__section">
          <div class="form__section-title">💬 Modal · Confirm · Alert</div>
          <div style="padding:10px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;" data-demo="modals">
            <button class="btn" data-act="modal-info">Modal informativo</button>
            <button class="btn" data-act="modal-form">Modal con formulario</button>
            <button class="btn" data-act="alert-success">Alert success</button>
            <button class="btn" data-act="confirm-danger">Confirm destructivo</button>
          </div>
        </div>

        <div class="form__section">
          <div class="form__section-title">🔔 Toast (success / warning / danger / info)</div>
          <div style="padding:10px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;" data-demo="toasts">
            <button class="btn tb-btn--success" data-act="toast-success">✓ Toast Success</button>
            <button class="btn tb-btn--warning" data-act="toast-warning">⚠ Toast Warning</button>
            <button class="btn tb-btn--danger"  data-act="toast-danger">✕ Toast Danger</button>
            <button class="btn"                 data-act="toast-info">ℹ Toast Info</button>
          </div>
        </div>

        <div class="form__section" style="grid-column:span 2;">
          <div class="form__section-title">📄 DocumentViewer (PDF / imagen)</div>
          <div style="padding:10px;display:flex;gap:8px;align-items:flex-start;" data-demo="docs">
            <button class="btn" data-act="doc-pdf">📄 Ver PDF de ejemplo</button>
            <button class="btn" data-act="doc-img">🖼 Ver imagen de ejemplo</button>
            <span style="color:var(--text-muted);font-size:11px;align-self:center;">
              Soporta zoom, descarga, impresión.
            </span>
          </div>
        </div>

        <!-- ===== WIZARD ===== -->
        <div class="form__section" style="grid-column:span 2;">
          <div class="form__section-title">🪜 Wizard / Stepper (con validación por paso)</div>
          <div style="padding:10px;height:380px;" data-demo="wizard"></div>
        </div>

        <!-- ===== KANBAN ===== -->
        <div class="form__section" style="grid-column:span 2;">
          <div class="form__section-title">📋 Kanban (drag & drop entre columnas)</div>
          <div style="padding:10px;height:340px;" data-demo="kanban"></div>
        </div>

        <!-- ===== TREEVIEW ===== -->
        <div class="form__section">
          <div class="form__section-title">🌳 TreeView (jerárquico)</div>
          <div style="padding:10px;height:360px;overflow:auto;" data-demo="tree"></div>
        </div>

        <!-- ===== FILE UPLOAD ===== -->
        <div class="form__section">
          <div class="form__section-title">📤 FileUpload (dropzone + preview)</div>
          <div style="padding:10px;" data-demo="fileupload"></div>
        </div>

        <!-- ===== DATA EXPORT ===== -->
        <div class="form__section" style="grid-column:span 2;">
          <div class="form__section-title">⤓ DataExport (CSV / JSON / PDF imprimible)</div>
          <div style="padding:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;" data-demo="export">
            <span style="color:var(--text-muted);font-size:12px;">5 ventas mock:</span>
            <span data-role="export-direct" style="display:inline-flex;gap:4px;flex-wrap:wrap;"></span>
            <span style="color:var(--text-muted);font-size:11px;">o usá el botón con dropdown:</span>
            <span data-role="export-button"></span>
          </div>
        </div>

        <!-- ===== AGENDA reference ===== -->
        <div class="form__section" style="grid-column:span 2;">
          <div class="form__section-title">🗓 Agenda</div>
          <div style="padding:10px;color:var(--text-muted);font-size:12px;">
            Componente completo con vista Mes + Agenda lista. Probalo en <kbd>F4</kbd>
            o desde el ribbon → OPERATIVO → Agenda. Documentación en
            <code>mockups/js/components-agenda.js</code>.
          </div>
        </div>

      </div>
    </div>
  `;

  /* ---------- Inputs básicos ---------- */
  const c1 = container.querySelector('[data-demo="inputs-basic"]');
  I.text({  container: c1, label: "Nombre completo", required: true, placeholder: "Ej: Carlos Pérez" });
  I.email({ container: c1, label: "Email",           placeholder: "alguien@ejemplo.com" });
  I.phone({ container: c1, label: "Teléfono",        placeholder: "0981-123-456", hint: "Formato 0981-xxx-xxx" });

  /* ---------- Inputs paraguayos ---------- */
  const c2 = container.querySelector('[data-demo="inputs-py"]');
  I.money({ container: c2, label: "Monto (Gs.)", value: 1500000, prefix: "Gs.", required: true });
  I.ruc({   container: c2, label: "RUC", placeholder: "80012345-6", hint: "Validación con dígito verificador SET" });
  I.ci({    container: c2, label: "Cédula",  placeholder: "3.456.789" });

  /* ---------- Date / DateRange ---------- */
  const c3 = container.querySelector('[data-demo="inputs-date"]');
  I.date({ container: c3, label: "Fecha de operación", value: new Date() });
  I.dateRange({
    container: c3,
    label: "Rango de fechas (reportes)",
    presets: [
      { id: "today",     label: "Hoy" },
      { id: "yesterday", label: "Ayer" },
      { id: "week",      label: "Últ. 7 días" },
      { id: "30d",       label: "Últ. 30 días" },
      { id: "month",     label: "Mes actual" },
      { id: "year",      label: "Año actual" }
    ]
  });

  /* ---------- Select / Switch / Textarea ---------- */
  const c4 = container.querySelector('[data-demo="inputs-select"]');
  I.select({
    container: c4,
    label: "Cliente (searchable)",
    placeholder: "Buscá por nombre...",
    items: [
      { value: 1, label: "Lomitería Tres Hermanos S.A. (Asunción)" },
      { value: 2, label: "Patricia Rojas de Mendoza" },
      { value: 3, label: "Pizzería Don Vito SRL" },
      { value: 4, label: "Carlos Benítez Ojeda" },
      { value: 5, label: "Supermercado La Familia SRL" },
      { value: 6, label: "Ferretería El Constructor S.A." },
      { value: 7, label: "Clínica Santa Lucia SRL" }
    ]
  });
  I.switch({   container: c4, label: "Cliente VIP",       value: true });
  I.switch({   container: c4, label: "Notificar por mail" });
  I.textarea({ container: c4, label: "Observaciones", rows: 3, maxlength: 200, placeholder: "Notas internas..." });

  /* ---------- Charts básicos ---------- */
  NC.Chart.bar({
    container: container.querySelector('[data-chart="bar"]'),
    title: "Ventas por método de pago (mes)",
    data: [
      { label: "Efectivo", value: 4520000 },
      { label: "Transf.",  value: 3180000 },
      { label: "POS",      value: 1850000 },
      { label: "A cuenta", value: 920000 }
    ],
    valueFormatter: I.formatMoney
  });
  NC.Chart.line({
    container: container.querySelector('[data-chart="line"]'),
    title: "Ventas diarias últimos 7 días",
    xLabels: ["Vie","Sáb","Dom","Lun","Mar","Mié","Jue"],
    series: [
      { name: "Ventas",   data: [{x:0,y:850000},{x:1,y:1240000},{x:2,y:380000},{x:3,y:1450000},{x:4,y:1820000},{x:5,y:2100000},{x:6,y:1680000}]},
      { name: "Cobranzas",data: [{x:0,y:320000},{x:1,y:560000}, {x:2,y:0},     {x:3,y:780000}, {x:4,y:920000}, {x:5,y:1100000},{x:6,y:540000}]}
    ],
    valueFormatter: I.formatMoney
  });
  NC.Chart.area({
    container: container.querySelector('[data-chart="area"]'),
    title: "Facturado vs cobrado (mes)",
    xLabels: ["Sem 1","Sem 2","Sem 3","Sem 4"],
    series: [
      { name: "Facturado", data: [{x:0,y:8400000},{x:1,y:9200000},{x:2,y:7600000},{x:3,y:10300000}]},
      { name: "Cobrado",   data: [{x:0,y:6100000},{x:1,y:7800000},{x:2,y:6900000},{x:3,y:8200000}]}
    ],
    valueFormatter: I.formatMoney
  });
  NC.Chart.pie({
    container: container.querySelector('[data-chart="pie"]'),
    title: "OT por estado",
    donut: true,
    data: [
      { label: "Pendientes", value: 8 },
      { label: "En proceso", value: 12 },
      { label: "Terminadas", value: 23 },
      { label: "Facturadas", value: 18 },
      { label: "Entregadas", value: 47 }
    ]
  });

  /* ---------- Charts avanzados ---------- */
  NC.Chart.stackedBar({
    container: container.querySelector('[data-chart="stackedBar"]'),
    title: "Ventas por método/mes (apilado)",
    xLabels: ["Ene","Feb","Mar","Abr"],
    series: [
      { name: "Efectivo",      data: [3200000, 3800000, 3400000, 4520000] },
      { name: "Transferencia", data: [2100000, 2600000, 2800000, 3180000] },
      { name: "POS",           data: [1100000, 1300000, 1500000, 1850000] }
    ],
    valueFormatter: I.formatMoney
  });
  NC.Chart.groupedBar({
    container: container.querySelector('[data-chart="groupedBar"]'),
    title: "Compras vs Ventas por trimestre",
    xLabels: ["Q1","Q2","Q3","Q4"],
    series: [
      { name: "Ventas",  data: [10500000, 12300000, 11800000, 14200000] },
      { name: "Compras", data: [4200000,   5100000,  4800000,  6300000] },
      { name: "Margen",  data: [6300000,   7200000,  7000000,  7900000] }
    ],
    valueFormatter: I.formatMoney
  });
  NC.Chart.funnel({
    container: container.querySelector('[data-chart="funnel"]'),
    title: "Pipeline comercial",
    data: [
      { label: "Leads",        value: 240 },
      { label: "Calificados",  value: 145 },
      { label: "Demos",        value: 78 },
      { label: "Cotizaciones", value: 42 },
      { label: "Cerrados",     value: 18 }
    ]
  });
  // Heatmap: ventas por día/hora
  NC.Chart.heatmap({
    container: container.querySelector('[data-chart="heatmap"]'),
    title: "Ventas por día y hora (más oscuro = más ventas)",
    rows: ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"],
    cols: ["08","10","12","14","16","18","20"],
    values: [
      [ 2, 4, 8,12, 9, 6, 1],
      [ 3, 5, 9,14,11, 7, 2],
      [ 2, 4, 7,10, 8, 5, 1],
      [ 4, 6,10,15,12, 8, 3],
      [ 5, 8,13,18,16,11, 5],
      [ 8,12,16,20,18,14, 9],
      [ 1, 2, 4, 6, 5, 3, 0]
    ]
  });

  /* ---------- Gauges ---------- */
  NC.Chart.gauge({
    container: container.querySelector('[data-chart="gauge1"]'),
    title: "Meta del mes",
    value: 72,
    min: 0, max: 100,
    label: "% cumplido",
    valueFormatter: v => Math.round(v) + "%"
  });
  NC.Chart.gauge({
    container: container.querySelector('[data-chart="gauge2"]'),
    title: "Ocupación de caja",
    value: 4520000,
    min: 0, max: 6000000,
    label: "Saldo actual",
    valueFormatter: I.formatMoney
  });

  /* ---------- Sparklines ---------- */
  const sparkRows = container.querySelector('[data-role="spark-rows"]');
  const sparkData = [
    { cli: "Don Nelson",     mes: 4520000, trend: [3,5,4,7,6,8,9] },
    { cli: "Luis González",  mes: 3180000, trend: [6,4,5,3,5,4,3] },
    { cli: "Mecánica Asu.",  mes: 1850000, trend: [2,3,3,4,5,6,7] },
    { cli: "Taller Rápido",  mes:  920000, trend: [5,5,4,3,2,2,1] },
    { cli: "El Águila",      mes: 2400000, trend: [4,6,5,7,8,7,9] }
  ];
  sparkData.forEach(r => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #edeff2";
    tr.innerHTML = `
      <td style="padding:5px 8px;">${r.cli}</td>
      <td style="padding:5px 8px;text-align:right;font-family:var(--font-mono);">${I.formatMoney(r.mes)}</td>
      <td style="padding:5px 8px;" data-spark></td>
    `;
    sparkRows.appendChild(tr);
    NC.Chart.sparkline({ container: tr.querySelector('[data-spark]'), data: r.trend });
  });

  /* ---------- DYNAMIC dashboard ---------- */
  // Dataset mock: ventas con fecha, método, vendedor, monto
  const ventasMock2 = [];
  const metodos = ["efectivo","transferencia","pos","a-cuenta"];
  const vendedores = ["Darío","Sofía","Luis"];
  for (let m = 0; m < 4; m++) {
    for (let d = 1; d <= 28; d++) {
      const cant = 1 + Math.floor(Math.random() * 5);
      for (let v = 0; v < cant; v++) {
        ventasMock2.push({
          fecha: `2026-0${m+1}-${String(d).padStart(2,"0")}`,
          metodo: metodos[Math.floor(Math.random()*metodos.length)],
          vendedor: vendedores[Math.floor(Math.random()*vendedores.length)],
          total: Math.floor(50000 + Math.random() * 950000)
        });
      }
    }
  }
  NC.Chart.dynamic({
    container: container.querySelector('[data-demo="dynamic"]'),
    title: "Ventas — vista interactiva",
    data: ventasMock2,
    valueField: "total",
    group:  { field: "fecha",  by: "month" },
    series: { field: "metodo" },
    filters: [
      { id: "metodo",   label: "Método",    type: "select", field: "metodo",
        options: [{value:"",label:"Todos"},{value:"efectivo",label:"Efectivo"},{value:"transferencia",label:"Transferencia"},{value:"pos",label:"POS"},{value:"a-cuenta",label:"A cuenta"}] },
      { id: "vendedor", label: "Vendedor",  type: "select", field: "vendedor",
        options: [{value:"",label:"Todos"},{value:"Darío",label:"Darío"},{value:"Sofía",label:"Sofía"},{value:"Luis",label:"Luis"}] },
      { id: "fecha",    label: "Período",   type: "dateRange", field: "fecha",
        presets: [{id:"month",label:"Mes actual"},{id:"30d",label:"Últ. 30d"},{id:"year",label:"Año"}] }
    ],
    metrics: [
      { id: "total",  label: "Total facturado", agg: "sum", field: "total", formatter: I.formatMoney },
      { id: "count",  label: "Cantidad ventas", agg: "count" },
      { id: "avg",    label: "Ticket promedio", agg: "avg", field: "total", formatter: I.formatMoney },
      { id: "max",    label: "Venta máxima",    agg: "max", field: "total", formatter: I.formatMoney }
    ],
    chartTypes: ["bar","stackedBar","groupedBar","line","area","pie"],
    defaultType: "stackedBar",
    valueFormatter: I.formatMoney
  });

  /* ---------- Modals ---------- */
  const cm = container.querySelector('[data-demo="modals"]');
  cm.querySelector('[data-act="modal-info"]').onclick = () => {
    NC.Modal.open({
      title: "Modal genérico",
      body: `<p>Este es un modal de uso libre. Podés meter cualquier HTML acá adentro: formularios, tablas, gráficos, lo que necesites.</p>
             <p style="color:var(--text-muted);font-size:11px;">Cerrá con <kbd>Esc</kbd>, click afuera, o el botón ✕.</p>`,
      footer: `<button class="btn btn--primary" onclick="NodoComponents.Modal.close()">Entendido</button>`
    });
  };
  cm.querySelector('[data-act="modal-form"]').onclick = () => {
    const body = document.createElement("div");
    body.innerHTML = `<div data-fld></div>`;
    const m = NC.Modal.open({
      title: "Nuevo cliente rápido",
      body,
      footer: `<button class="btn" data-act="cancel">Cancelar</button>
               <button class="btn btn--primary" data-act="save">Guardar</button>`,
      size: "lg"
    });
    const fld = body.querySelector('[data-fld]');
    const nombre = I.text({ container: fld, label: "Nombre", required: true });
    const ruc    = I.ruc({  container: fld, label: "RUC" });
    const email  = I.email({container: fld, label: "Email" });
    m.footer.querySelector('[data-act="cancel"]').onclick = () => m.close();
    m.footer.querySelector('[data-act="save"]').onclick = () => {
      if (!nombre.validate() || !email.validate() || !ruc.validate()) return;
      m.close();
      NC.Toast.success("Cliente creado: " + nombre.getValue());
    };
  };
  cm.querySelector('[data-act="alert-success"]').onclick = async () => {
    await NC.Modal.alert({ title: "Operación exitosa", message: "Los cambios fueron guardados correctamente.", kind: "success" });
  };
  cm.querySelector('[data-act="confirm-danger"]').onclick = async () => {
    const ok = await NC.Modal.confirm({
      title: "¿Eliminar registro?",
      message: "Esta acción no se puede deshacer. ¿Estás seguro?",
      kind: "danger",
      confirmLabel: "Sí, eliminar"
    });
    if (ok) NC.Toast.warning("Registro eliminado (mockup)");
    else    NC.Toast.info("Eliminación cancelada");
  };

  /* ---------- Toasts ---------- */
  const ct = container.querySelector('[data-demo="toasts"]');
  ct.querySelector('[data-act="toast-success"]').onclick = () => NC.Toast.success("Factura emitida correctamente · CDC generado");
  ct.querySelector('[data-act="toast-warning"]').onclick = () => NC.Toast.warning("Tu sesión expira en 5 minutos");
  ct.querySelector('[data-act="toast-danger"]').onclick  = () => NC.Toast.danger("Error al conectar con SIFEN. Reintentá en unos segundos.", { title: "Conexión fallida" });
  ct.querySelector('[data-act="toast-info"]').onclick    = () => NC.Toast.info("Hay 3 actualizaciones disponibles del sistema");

  /* ---------- DocumentViewer ---------- */
  const cd = container.querySelector('[data-demo="docs"]');
  cd.querySelector('[data-act="doc-pdf"]').onclick = () => {
    NC.DocumentViewer.open({
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      type: "pdf",
      title: "Comprobante de ejemplo (PDF)"
    });
  };
  cd.querySelector('[data-act="doc-img"]').onclick = () => {
    NC.DocumentViewer.open({
      url: "assets/icons/icon.svg",
      type: "image",
      title: "Imagen de ejemplo"
    });
  };

  /* ---------- Wizard ---------- */
  const wContainer = container.querySelector('[data-demo="wizard"]');
  let wRefs = {};
  NC.Wizard.create({
    container: wContainer,
    data: {},
    steps: [
      {
        id: "datos",
        label: "Datos del cliente",
        sub: "Razón social y RUC",
        render(panel, ctx) {
          panel.innerHTML = `<p style="margin:0 0 8px;color:var(--text-muted);font-size:12px;">Paso 1 de 3 — Datos básicos.</p><div data-fld></div>`;
          const f = panel.querySelector('[data-fld]');
          wRefs.razon = I.text({ container: f, label: "Razón social", required: true, value: ctx.razon || "" });
          wRefs.ruc   = I.ruc({  container: f, label: "RUC",          required: true, value: ctx.ruc   || "" });
        },
        validate(ctx) {
          const ok1 = wRefs.razon.validate(), ok2 = wRefs.ruc.validate();
          if (!ok1 || !ok2) return "Completá los campos obligatorios";
          ctx.razon = wRefs.razon.getValue();
          ctx.ruc   = wRefs.ruc.getValue();
          return true;
        }
      },
      {
        id: "contacto",
        label: "Contacto",
        sub: "Teléfono, email, dirección",
        render(panel, ctx) {
          panel.innerHTML = `<p style="margin:0 0 8px;color:var(--text-muted);font-size:12px;">Paso 2 de 3 — Cómo contactar al cliente.</p><div data-fld></div>`;
          const f = panel.querySelector('[data-fld]');
          wRefs.tel   = I.phone({ container: f, label: "Teléfono",      required: true, value: ctx.tel   || "" });
          wRefs.email = I.email({ container: f, label: "Email",                          value: ctx.email || "" });
          wRefs.dir   = I.text({  container: f, label: "Dirección",                      value: ctx.dir   || "" });
        },
        validate(ctx) {
          const ok = wRefs.tel.validate() && wRefs.email.validate();
          if (!ok) return "Revisá teléfono y email";
          ctx.tel = wRefs.tel.getValue(); ctx.email = wRefs.email.getValue(); ctx.dir = wRefs.dir.getValue();
          return true;
        }
      },
      {
        id: "confirmar",
        label: "Confirmación",
        sub: "Revisá y guardá",
        render(panel, ctx) {
          panel.innerHTML = `
            <p style="margin:0 0 12px;color:var(--text-muted);font-size:12px;">Paso 3 de 3 — Verificá los datos y confirmá.</p>
            <table style="width:100%;font-size:12px;border-collapse:collapse;">
              <tr><td style="padding:6px 8px;color:var(--text-muted);width:140px;">Razón social</td><td style="padding:6px 8px;font-weight:600;">${(ctx.razon || "—")}</td></tr>
              <tr><td style="padding:6px 8px;color:var(--text-muted);">RUC</td><td style="padding:6px 8px;font-family:var(--font-mono);">${(ctx.ruc || "—")}</td></tr>
              <tr><td style="padding:6px 8px;color:var(--text-muted);">Teléfono</td><td style="padding:6px 8px;font-family:var(--font-mono);">${I.formatPhone(ctx.tel || "")}</td></tr>
              <tr><td style="padding:6px 8px;color:var(--text-muted);">Email</td><td style="padding:6px 8px;">${(ctx.email || "—")}</td></tr>
              <tr><td style="padding:6px 8px;color:var(--text-muted);">Dirección</td><td style="padding:6px 8px;">${(ctx.dir || "—")}</td></tr>
            </table>
          `;
        }
      }
    ],
    onComplete(ctx) {
      NC.Toast.success("Cliente creado: " + (ctx.razon || "(sin nombre)"), { title: "Wizard completado" });
    },
    onCancel() {
      NC.Toast.info("Wizard cancelado");
    }
  });

  /* ---------- Kanban ---------- */
  NC.Kanban.create({
    container: container.querySelector('[data-demo="kanban"]'),
    title: "Tablero de OT en taller (arrastrá las cards entre columnas)",
    columns: [
      { id: "pendiente", title: "Pendientes",  color: "#999" },
      { id: "proceso",   title: "En proceso",  color: "#1e6bb0" },
      { id: "terminada", title: "Terminadas",  color: "#4a7d28" },
      { id: "facturada", title: "Facturadas",  color: "#d4a106" },
      { id: "entregada", title: "Entregadas",  color: "#2f7d2f" }
    ],
    cards: [
      { id: "ot-1", columnId: "pendiente", title: "OT-2026-00091", subtitle: "Cliente: Don Nelson · Hilux 2015", tag: "B2B", color: "#1e6bb0" },
      { id: "ot-2", columnId: "pendiente", title: "OT-2026-00092", subtitle: "María Vázquez · Frontier",         meta: "ingresó hoy" },
      { id: "ot-3", columnId: "proceso",   title: "OT-2026-00088", subtitle: "Taller Rápido · Bomba Bosch",      tag: "URGENTE", color: "#a40000" },
      { id: "ot-4", columnId: "proceso",   title: "OT-2026-00085", subtitle: "Sergio Martínez · Diagnóstico",     meta: "2 días" },
      { id: "ot-5", columnId: "terminada", title: "OT-2026-00089", subtitle: "Don Nelson · 4 inyectores",         tag: "B2B" },
      { id: "ot-6", columnId: "terminada", title: "OT-2026-00084", subtitle: "Carlos Ramírez · Limpieza C2" },
      { id: "ot-7", columnId: "facturada", title: "OT-2026-00086", subtitle: "Luis González · Iveco common-rail", tag: "B2B" },
      { id: "ot-8", columnId: "entregada", title: "OT-2026-00087", subtitle: "El Águila · Lote 6 inyectores",     color: "#4a7d28" }
    ],
    onMove: (card, from, to) => {
      NC.Toast.info(card.title + " movida a " + to);
    },
    onCardClick: (card) => {
      NC.Modal.open({
        title: card.title,
        body: `<p><strong>${card.subtitle || ""}</strong></p><p style="color:var(--text-muted);font-size:11px;">Estado actual: <code>${card.columnId}</code></p>`,
        footer: `<button class="btn btn--primary" onclick="NodoComponents.Modal.close()">Cerrar</button>`,
        size: "sm"
      });
    }
  });

  /* ---------- TreeView ---------- */
  const folderIcon = `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 4l1-2h5l2 2h6v9H1V4z"/></svg>`;
  const fileIcon   = `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h7l3 3v11H3V1zm1 1v12h8V5H9V2H4z"/></svg>`;
  NC.TreeView.create({
    container: container.querySelector('[data-demo="tree"]'),
    nodes: [
      { id: "1", label: "Plan de cuentas", icon: folderIcon, badge: 4, expanded: true, children: [
        { id: "1.1", label: "1. Activo", icon: folderIcon, badge: 3, expanded: true, children: [
          { id: "1.1.1", label: "1.1.01 Caja", icon: fileIcon },
          { id: "1.1.2", label: "1.1.02 Banco Continental", icon: fileIcon },
          { id: "1.1.3", label: "1.1.03 Cuentas a cobrar", icon: fileIcon }
        ]},
        { id: "1.2", label: "2. Pasivo", icon: folderIcon, children: [
          { id: "1.2.1", label: "2.1.01 Proveedores", icon: fileIcon },
          { id: "1.2.2", label: "2.1.02 IVA débito fiscal", icon: fileIcon }
        ]},
        { id: "1.3", label: "3. Patrimonio Neto", icon: folderIcon, children: [
          { id: "1.3.1", label: "3.1.01 Capital", icon: fileIcon }
        ]},
        { id: "1.4", label: "4. Resultados", icon: folderIcon, children: [
          { id: "1.4.1", label: "4.1.01 Ventas", icon: fileIcon },
          { id: "1.4.2", label: "4.2.01 Costo de ventas", icon: fileIcon }
        ]}
      ]}
    ],
    onSelect: (node) => {
      // muestra qué se seleccionó en un toast pequeño
      if (node.icon === fileIcon) NC.Toast.info("Cuenta: " + node.label, { duration: 2000 });
    }
  });

  /* ---------- FileUpload ---------- */
  NC.FileUpload.create({
    container: container.querySelector('[data-demo="fileupload"]'),
    accept: ".pdf,.png,.jpg,.jpeg,image/*",
    multiple: true,
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    onChange: (files) => {
      // El cliente puede llamar a su API acá
      console.log("Archivos seleccionados:", files);
    }
  });

  /* ---------- DataExport ---------- */
  const ventasMock = [
    { nro: "FACT-001-001-0000134", fecha: "2026-04-19", cliente: "Autoservicio El Águila", tipo: "Factura A4", metodo: "Efectivo", total: 1080000 },
    { nro: "FACT-001-001-0000135", fecha: "2026-04-23", cliente: "Luis González SA",       tipo: "Factura A4", metodo: "A cuenta",  total: 510000 },
    { nro: "TICK-0000201",         fecha: "2026-04-23", cliente: "Juan Pablo Ayala",       tipo: "Ticket",     metodo: "Efectivo",  total: 250000 },
    { nro: "FACT-001-001-0000133", fecha: "2026-04-22", cliente: "Mecánica Integral SRL",  tipo: "Factura A4", metodo: "Mixto",     total: 700000 },
    { nro: "FACT-001-001-0000132", fecha: "2026-04-21", cliente: "Don Nelson",              tipo: "Factura A4", metodo: "Transf.",   total: 920000 }
  ];
  const ventasCols = [
    { key: "nro",     label: "Comprobante" },
    { key: "fecha",   label: "Fecha" },
    { key: "cliente", label: "Cliente" },
    { key: "tipo",    label: "Tipo" },
    { key: "metodo",  label: "Método" },
    { key: "total",   label: "Total (Gs.)", formatter: v => I.formatMoney(v) }
  ];
  // Botones directos
  const ed = container.querySelector('[data-role="export-direct"]');
  ["csv","json","pdf"].forEach(fmt => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = fmt === "csv" ? "📊 CSV" : fmt === "json" ? "📦 JSON" : "🖨 PDF";
    b.onclick = () => {
      if (fmt === "csv")  NC.DataExport.toCSV(ventasMock, ventasCols, "ventas-demo.csv");
      if (fmt === "json") NC.DataExport.toJSON(ventasMock, "ventas-demo.json");
      if (fmt === "pdf")  NC.DataExport.toPrintablePDF(ventasMock, ventasCols, { title: "Ventas del día (demo)", subtitle: "Generado desde la Biblioteca de componentes NODO Shell" });
    };
    ed.appendChild(b);
  });
  // Botón con dropdown
  NC.DataExport.button({
    container: container.querySelector('[data-role="export-button"]'),
    getRows: () => ventasMock,
    columns: ventasCols,
    filename: "ventas",
    title: "Reporte de Ventas",
    subtitle: "Período: abril 2026"
  });
};
