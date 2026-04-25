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
