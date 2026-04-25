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
          <div class="form__section-title">📊 Chart.bar · line · pie/donut</div>
          <div style="padding:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;" data-demo="charts">
            <div style="height:280px;border:1px solid var(--border);background:#fff;" data-chart="bar"></div>
            <div style="height:280px;border:1px solid var(--border);background:#fff;" data-chart="line"></div>
            <div style="height:280px;border:1px solid var(--border);background:#fff;" data-chart="pie"></div>
          </div>
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

  /* ---------- Charts ---------- */
  NC.Chart.bar({
    container: container.querySelector('[data-chart="bar"]'),
    title: "Ventas por método de pago (mes)",
    data: [
      { label: "Efectivo", value: 4520000 },
      { label: "Transferencia", value: 3180000 },
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
      { name: "Ventas", data: [
        { x: 0, y: 850000 }, { x: 1, y: 1240000 }, { x: 2, y: 380000 },
        { x: 3, y: 1450000 }, { x: 4, y: 1820000 }, { x: 5, y: 2100000 }, { x: 6, y: 1680000 }
      ]}
    ],
    area: true,
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
};
