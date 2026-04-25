/* ============================================================
   NODO Shell — Component: NodoAgenda
   ============================================================
   Componente de agenda/calendario reusable para llevar tareas o
   eventos sobre cualquier sistema NODO Shell.

   Uso básico:
     window.NodoComponents.Agenda.mount(container, {
       storageKey: "miApp.agenda",  // localStorage key (opcional)
       initialEvents: [...],         // si no hay nada en storage
       initialView: "month",         // "month" | "list"
       loader:  async () => [...],   // opcional, override storage
       saver:   async (events) => {},// opcional, override storage
       onChange: (events) => {},     // callback cuando hay cambio
       colorMap: { ... }             // mapping color → label visible
     });

   Modelo de evento:
     {
       id: "uuid-or-number",
       fecha: "2026-04-25",        // YYYY-MM-DD
       todoElDia: false,           // si true, ignora horas
       horaInicio: "09:00",        // HH:MM (opcional)
       horaFin:    "10:00",        // HH:MM (opcional)
       titulo: "Reunión con cliente",
       nota: "Discutir lote inyectores",
       color: "info",              // default|info|success|warning|danger|purple|teal
       estado: "pendiente"         // pendiente | proceso | hecho | cancelado
     }
   ============================================================ */

(function () {
  "use strict";

  window.NodoComponents = window.NodoComponents || {};

  const COLORS = [
    { id: "default", label: "Azul",     hex: "#1e6bb0" },
    { id: "success", label: "Verde",    hex: "#4a7d28" },
    { id: "warning", label: "Ámbar",    hex: "#d4a106" },
    { id: "danger",  label: "Rojo",     hex: "#a40000" },
    { id: "purple",  label: "Violeta",  hex: "#6b3fa0" },
    { id: "teal",    label: "Turquesa", hex: "#2d8a8a" }
  ];

  const ESTADOS = [
    { id: "pendiente", label: "Pendiente" },
    { id: "proceso",   label: "En proceso" },
    { id: "hecho",     label: "Hecho" },
    { id: "cancelado", label: "Cancelado" }
  ];

  const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const DIAS_CORTOS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  /* ---------- Helpers de fecha ---------- */
  function pad(n) { return String(n).padStart(2, "0"); }
  function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
  function parseYMD(s) {
    const [y,m,d] = s.split("-").map(Number);
    return new Date(y, m-1, d);
  }
  function sameDay(a, b) { return ymd(a) === ymd(b); }
  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth()+n, 1); }
  function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  // Devuelve los 35-42 días que se ven en una grilla de mes (lunes a domingo)
  function monthGridDays(viewDate) {
    const first = startOfMonth(viewDate);
    // Lunes = 0 (en es-PY: getDay() devuelve 0=Domingo, 1=Lunes...)
    let offset = first.getDay() - 1;
    if (offset < 0) offset = 6; // domingo
    const start = addDays(first, -offset);
    const days = [];
    // 6 filas de 7 días = 42, pero recortamos a 5 si el último día queda fuera
    for (let i = 0; i < 42; i++) days.push(addDays(start, i));
    // Si la última fila completa está fuera del mes, recortamos
    const last = days[days.length - 1];
    const lastVisible = days[days.length - 8]; // un día antes de la última fila
    if (last.getMonth() !== viewDate.getMonth() && lastVisible.getMonth() !== viewDate.getMonth()) {
      return days.slice(0, 35);
    }
    return days;
  }

  function fmtRelativeDay(d, today) {
    const diff = Math.floor((d - today) / (1000*60*60*24));
    if (diff === 0)  return "hoy";
    if (diff === 1)  return "mañana";
    if (diff === -1) return "ayer";
    if (diff > 1 && diff <= 7) return `en ${diff} días`;
    if (diff < -1 && diff >= -7) return `hace ${-diff} días`;
    return "";
  }

  function fmtDayHeader(d) {
    return `${DIAS[(d.getDay()+6)%7]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
  }

  /* ---------- HTML escape ---------- */
  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function uuid() {
    return "ev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  /* ---------- Storage default (localStorage) ---------- */
  function defaultLoader(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function defaultSaver(key, events) {
    try { localStorage.setItem(key, JSON.stringify(events)); } catch (e) {}
  }

  /* ============================================================
     Mount: NodoComponents.Agenda.mount(container, options)
     ============================================================ */
  function mount(container, options) {
    options = options || {};
    const storageKey  = options.storageKey || "nodo-shell.agenda";
    const loader      = options.loader || (() => defaultLoader(storageKey));
    const saver       = options.saver  || ((events) => defaultSaver(storageKey, events));
    const onChange    = options.onChange || function () {};

    const state = {
      view: options.initialView || "month",   // "month" | "list"
      viewDate: new Date(),                   // mes que se muestra
      selectedDate: ymd(new Date()),          // día seleccionado por teclado
      selectedEventId: null,                  // evento seleccionado (vista lista)
      events: [],
      filter: ""
    };

    // Cargar eventos
    const stored = loader();
    if (stored && Array.isArray(stored)) {
      state.events = stored;
    } else if (options.initialEvents) {
      state.events = options.initialEvents.slice();
      saver(state.events);
    }

    function persist() { saver(state.events); onChange(state.events); }

    /* ---------- Render principal ---------- */
    function render() {
      container.innerHTML = `
        <div class="agenda" tabindex="0">
          <div class="agenda__toolbar">
            <div class="agenda__nav">
              <button class="btn" data-act="today" title="Ir a hoy (T)">Hoy</button>
              <button class="btn" data-act="prev" title="Mes anterior (PgUp)">‹</button>
              <button class="btn" data-act="next" title="Mes siguiente (PgDn)">›</button>
            </div>
            <h2 class="agenda__title">${MESES[state.viewDate.getMonth()]} ${state.viewDate.getFullYear()}</h2>
            <div class="agenda__viewswitch" role="tablist">
              <button data-view="month" aria-selected="${state.view==='month'?'true':'false'}" title="Vista mes (M)">Mes</button>
              <button data-view="list"  aria-selected="${state.view==='list'?'true':'false'}"  title="Vista agenda (A)">Agenda</button>
            </div>
            <div class="agenda__spacer"></div>
            <div class="agenda__search">
              <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M11 11l4 4" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>
              <input type="text" placeholder="Buscar evento..." data-role="search" value="${esc(state.filter)}">
            </div>
            <button class="btn btn--primary" data-act="new" title="Nuevo evento (N o Ctrl+N)">+ Nuevo</button>
          </div>

          ${state.view === "month" ? renderMonth() : renderList()}

          <div class="agenda__status">
            <span><strong>${state.events.length}</strong> evento(s) totales</span>
            <span style="margin-left:auto;">
              ↑↓←→ navegar · Enter abrir · N nuevo · T hoy · M/A vista · PgUp/PgDn mes
            </span>
          </div>
        </div>
      `;
      bindToolbar();
      if (state.view === "month") bindMonth();
      else bindList();
    }

    /* ---------- Vista MES ---------- */
    function renderMonth() {
      const days = monthGridDays(state.viewDate);
      const todayKey = ymd(new Date());
      const monthIdx = state.viewDate.getMonth();
      const filterLow = state.filter.toLowerCase();

      // Index de eventos por fecha
      const byDay = {};
      state.events.forEach(ev => {
        if (filterLow && !(ev.titulo + " " + (ev.nota||"")).toLowerCase().includes(filterLow)) return;
        (byDay[ev.fecha] = byDay[ev.fecha] || []).push(ev);
      });
      // Ordenar eventos del día por hora
      Object.values(byDay).forEach(arr => arr.sort((a,b) => {
        if (a.todoElDia && !b.todoElDia) return -1;
        if (!a.todoElDia && b.todoElDia) return 1;
        return (a.horaInicio || "").localeCompare(b.horaInicio || "");
      }));

      let html = `
        <div class="agenda__weekdays">
          ${DIAS_CORTOS.map(d => `<div>${d}</div>`).join("")}
        </div>
        <div class="agenda__grid" data-role="month-grid">
      `;
      const MAX_VISIBLE = 4;
      days.forEach(d => {
        const key = ymd(d);
        const isOther = d.getMonth() !== monthIdx;
        const isToday = key === todayKey;
        const isSelected = key === state.selectedDate;
        const dow = (d.getDay()+6)%7;
        const isWeekend = dow >= 5;
        const evs = byDay[key] || [];
        const visible = evs.slice(0, MAX_VISIBLE);
        const more = evs.length - visible.length;
        const cls = [
          "agenda__day",
          isOther && "agenda__day--other",
          isToday && "agenda__day--today",
          isSelected && "agenda__day--selected",
          isWeekend && "agenda__day--weekend"
        ].filter(Boolean).join(" ");

        html += `
          <div class="${cls}" data-date="${key}" tabindex="-1">
            <div class="agenda__day-num">${d.getDate()}</div>
            <div class="agenda__events">
              ${visible.map(ev => renderChip(ev)).join("")}
              ${more > 0 ? `<div class="agenda__chip-more" data-more="${key}">+${more} más…</div>` : ""}
            </div>
          </div>
        `;
      });
      html += `</div>`;
      return html;
    }

    function renderChip(ev) {
      const color = ev.color || "default";
      const done = ev.estado === "hecho";
      const cancelled = ev.estado === "cancelado";
      const cls = [
        "agenda__chip",
        `agenda__chip--${esc(color)}`,
        done && "agenda__chip--done",
        ev.todoElDia && "agenda__chip--allday"
      ].filter(Boolean).join(" ");
      const time = !ev.todoElDia && ev.horaInicio
        ? `<span class="agenda__chip-time">${esc(ev.horaInicio)}</span>`
        : (ev.todoElDia ? `<span class="agenda__chip-time">●</span>` : "");
      return `
        <div class="${cls}" data-event-id="${esc(ev.id)}" title="${esc(ev.titulo)}${ev.nota?'\n'+esc(ev.nota):''}" style="${cancelled?'opacity:0.4;':''}">
          ${time}
          <span class="agenda__chip-title">${esc(ev.titulo)}</span>
        </div>
      `;
    }

    /* ---------- Vista LISTA ---------- */
    function renderList() {
      const today = new Date();
      const todayDate = startOfMonth(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
      todayDate.setDate(today.getDate());

      const filterLow = state.filter.toLowerCase();
      // Mostrar eventos del mes visible + 1 mes extra
      const monthStart = startOfMonth(state.viewDate);
      const monthEnd = addMonths(monthStart, 2);

      const visibleEvs = state.events.filter(ev => {
        const d = parseYMD(ev.fecha);
        if (d < monthStart || d >= monthEnd) return false;
        if (filterLow && !(ev.titulo + " " + (ev.nota||"")).toLowerCase().includes(filterLow)) return false;
        return true;
      }).sort((a,b) => {
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
        if (a.todoElDia && !b.todoElDia) return -1;
        if (!a.todoElDia && b.todoElDia) return 1;
        return (a.horaInicio || "").localeCompare(b.horaInicio || "");
      });

      if (visibleEvs.length === 0) {
        return `<div class="agenda__list"><div class="agenda__empty">
          <strong>Sin eventos en este período</strong>
          Probá con otro mes (PgUp / PgDn) o creá uno nuevo (N).
        </div></div>`;
      }

      // Agrupar por fecha
      const groups = [];
      let currentDate = null;
      visibleEvs.forEach(ev => {
        if (ev.fecha !== currentDate) {
          currentDate = ev.fecha;
          groups.push({ fecha: currentDate, items: [] });
        }
        groups[groups.length - 1].items.push(ev);
      });

      const todayKey = ymd(new Date());

      return `
        <div class="agenda__list" data-role="list">
          ${groups.map(g => {
            const d = parseYMD(g.fecha);
            const isToday = g.fecha === todayKey;
            const rel = fmtRelativeDay(d, parseYMD(todayKey));
            return `
              <div class="agenda__list-day">
                <div class="agenda__list-day-header ${isToday?'is-today':''}">
                  <span>${esc(fmtDayHeader(d))}</span>
                  ${rel ? `<span class="agenda__list-day-relative">· ${esc(rel)}</span>` : ""}
                </div>
                ${g.items.map(ev => renderListItem(ev)).join("")}
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    function renderListItem(ev) {
      const color = COLORS.find(c => c.id === (ev.color || "default")) || COLORS[0];
      const time = ev.todoElDia
        ? "Todo el día"
        : (ev.horaInicio ? (ev.horaInicio + (ev.horaFin ? " – " + ev.horaFin : "")) : "—");
      const isDone = ev.estado === "hecho";
      const stateLabel = (ESTADOS.find(s => s.id === ev.estado) || {}).label || "";
      const cls = ["agenda__list-event", isDone && "agenda__list-event--done"].filter(Boolean).join(" ");
      const sel = state.selectedEventId === ev.id ? 'aria-selected="true"' : '';
      return `
        <div class="${cls}" data-event-id="${esc(ev.id)}" ${sel}>
          <span class="agenda__list-event-dot" style="background:${color.hex};border-color:${color.hex};"></span>
          <span class="agenda__list-event-time">${esc(time)}</span>
          <div class="agenda__list-event-title">
            <strong>${esc(ev.titulo)}</strong>
            ${ev.nota ? `<div class="agenda__list-event-note">${esc(ev.nota)}</div>` : ""}
          </div>
          ${stateLabel && ev.estado !== "pendiente" ? `<span class="state state--${esc(ev.estado === 'hecho' ? 'terminada' : ev.estado === 'cancelado' ? 'cancelada' : 'proceso')}">${esc(stateLabel)}</span>` : ""}
        </div>
      `;
    }

    /* ---------- Bindings ---------- */
    function bindToolbar() {
      container.querySelector('[data-act="today"]').onclick = () => {
        state.viewDate = new Date();
        state.selectedDate = ymd(new Date());
        render();
      };
      container.querySelector('[data-act="prev"]').onclick = () => {
        state.viewDate = addMonths(state.viewDate, -1); render();
      };
      container.querySelector('[data-act="next"]').onclick = () => {
        state.viewDate = addMonths(state.viewDate, 1); render();
      };
      container.querySelector('[data-act="new"]').onclick = () => {
        openEventEditor(null, state.selectedDate || ymd(new Date()));
      };
      container.querySelectorAll('[data-view]').forEach(b => {
        b.onclick = () => { state.view = b.dataset.view; render(); };
      });
      const search = container.querySelector('[data-role="search"]');
      search.oninput = () => { state.filter = search.value; render(); };
    }

    function bindMonth() {
      const grid = container.querySelector('[data-role="month-grid"]');
      grid.querySelectorAll('[data-date]').forEach(cell => {
        cell.addEventListener("click", e => {
          if (e.target.closest('[data-event-id]')) return;
          if (e.target.closest('[data-more]')) return;
          state.selectedDate = cell.dataset.date;
          render();
        });
        cell.addEventListener("dblclick", e => {
          if (e.target.closest('[data-event-id]')) return;
          if (e.target.closest('[data-more]')) return;
          openEventEditor(null, cell.dataset.date);
        });
      });
      grid.querySelectorAll('[data-event-id]').forEach(chip => {
        chip.addEventListener("click", e => {
          e.stopPropagation();
          const ev = state.events.find(x => x.id === chip.dataset.eventId);
          if (ev) openEventEditor(ev);
        });
      });
      grid.querySelectorAll('[data-more]').forEach(m => {
        m.addEventListener("click", e => {
          e.stopPropagation();
          state.view = "list";
          state.viewDate = parseYMD(m.dataset.more);
          render();
        });
      });
    }

    function bindList() {
      const list = container.querySelector('[data-role="list"]');
      if (!list) return;
      list.querySelectorAll('[data-event-id]').forEach(item => {
        item.addEventListener("click", () => {
          state.selectedEventId = item.dataset.eventId;
          const ev = state.events.find(x => x.id === item.dataset.eventId);
          if (ev) openEventEditor(ev);
        });
      });
    }

    /* ---------- Editor de evento (side panel) ---------- */
    function openEventEditor(ev, defaultDate) {
      const isNew = !ev;
      const data = ev ? Object.assign({}, ev) : {
        id: uuid(),
        fecha: defaultDate || ymd(new Date()),
        todoElDia: false,
        horaInicio: "09:00",
        horaFin: "10:00",
        titulo: "",
        nota: "",
        color: "default",
        estado: "pendiente"
      };

      const html = `
        <form class="agenda-form" id="agenda-form">
          <div class="agenda-form__row">
            <label>Título</label>
            <input type="text" name="titulo" value="${esc(data.titulo)}" required autofocus>
          </div>
          <div class="agenda-form__row agenda-form__row--checkbox">
            <label>Todo el día</label>
            <label style="display:inline-flex;gap:6px;align-items:center;font-size:12px;cursor:pointer;">
              <input type="checkbox" name="todoElDia" ${data.todoElDia?'checked':''}>
              Sin hora específica (todo el día)
            </label>
          </div>
          <div class="agenda-form__row">
            <label>Fecha</label>
            <input type="date" name="fecha" value="${esc(data.fecha)}" required>
          </div>
          <div class="agenda-form__row" data-row="hora" ${data.todoElDia?'style="display:none;"':''}>
            <label>Hora</label>
            <div class="agenda-form__time-pair">
              <input type="time" name="horaInicio" value="${esc(data.horaInicio||'')}">
              <span style="color:var(--text-muted);">–</span>
              <input type="time" name="horaFin"    value="${esc(data.horaFin||'')}">
            </div>
          </div>
          <div class="agenda-form__row">
            <label>Color</label>
            <div class="agenda-form__color-picker">
              ${COLORS.map(c => `
                <button type="button" class="agenda-form__color-swatch" data-color="${c.id}"
                  aria-selected="${data.color === c.id ? 'true' : 'false'}"
                  style="background:${c.hex};" title="${esc(c.label)}"></button>
              `).join("")}
            </div>
          </div>
          <div class="agenda-form__row">
            <label>Estado</label>
            <select name="estado">
              ${ESTADOS.map(s => `<option value="${s.id}" ${data.estado===s.id?'selected':''}>${s.label}</option>`).join("")}
            </select>
          </div>
          <div class="agenda-form__row">
            <label>Nota</label>
            <textarea name="nota" rows="3">${esc(data.nota||'')}</textarea>
          </div>
          <div class="agenda-form__actions">
            ${!isNew ? `<button type="button" class="btn" data-act="del" style="color:var(--danger);">Eliminar</button>` : ''}
            <div style="flex:1;"></div>
            <button type="button" class="btn" data-act="cancel">Cancelar</button>
            <button type="submit" class="btn btn--primary">${isNew?'Crear':'Guardar'}</button>
          </div>
        </form>
      `;

      // Usar el side panel del shell
      if (window.H && typeof window.H.openPanel === "function") {
        window.H.openPanel(isNew ? "Nuevo evento" : "Editar evento", html);
      } else {
        // Fallback: side panel directo si H no está cargado (template puro)
        openSimpleSidePanel(isNew ? "Nuevo evento" : "Editar evento", html);
      }

      // Cablear el form en el panel ya inyectado
      const panel = document.getElementById("side-panel-body");
      if (!panel) return;
      const form = panel.querySelector("#agenda-form");
      const colorPicker = form.querySelector(".agenda-form__color-picker");
      let chosenColor = data.color;
      colorPicker.addEventListener("click", e => {
        const sw = e.target.closest("[data-color]");
        if (!sw) return;
        chosenColor = sw.dataset.color;
        colorPicker.querySelectorAll("[data-color]").forEach(s =>
          s.setAttribute("aria-selected", s.dataset.color === chosenColor ? "true" : "false")
        );
      });
      const cbAllDay = form.querySelector('[name="todoElDia"]');
      cbAllDay.addEventListener("change", () => {
        form.querySelector('[data-row="hora"]').style.display = cbAllDay.checked ? "none" : "";
      });
      form.addEventListener("submit", e => {
        e.preventDefault();
        const fd = new FormData(form);
        const ev2 = {
          id: data.id,
          fecha: fd.get("fecha"),
          todoElDia: !!fd.get("todoElDia"),
          horaInicio: fd.get("todoElDia") ? null : fd.get("horaInicio") || null,
          horaFin:    fd.get("todoElDia") ? null : fd.get("horaFin")    || null,
          titulo: fd.get("titulo").trim(),
          nota: fd.get("nota").trim(),
          color: chosenColor,
          estado: fd.get("estado")
        };
        if (!ev2.titulo) { alert("El título es obligatorio."); return; }
        if (isNew) state.events.push(ev2);
        else {
          const idx = state.events.findIndex(x => x.id === data.id);
          if (idx >= 0) state.events[idx] = ev2;
        }
        persist();
        if (window.H && window.H.closePanel) window.H.closePanel();
        else closeSimpleSidePanel();
        render();
      });
      form.querySelector('[data-act="cancel"]').onclick = () => {
        if (window.H && window.H.closePanel) window.H.closePanel();
        else closeSimpleSidePanel();
      };
      const btnDel = form.querySelector('[data-act="del"]');
      if (btnDel) btnDel.onclick = () => {
        if (!confirm("¿Eliminar este evento?")) return;
        state.events = state.events.filter(x => x.id !== data.id);
        persist();
        if (window.H && window.H.closePanel) window.H.closePanel();
        else closeSimpleSidePanel();
        render();
      };
    }

    /* ---------- Side panel fallback (si helpers.js no está) ---------- */
    function openSimpleSidePanel(title, html) {
      const panel = document.getElementById("side-panel");
      const backdrop = document.getElementById("side-panel-backdrop");
      const body = document.getElementById("side-panel-body");
      const titleEl = document.getElementById("side-panel-title");
      if (!panel || !backdrop || !body) {
        // No hay side panel en el shell: usar prompt simple
        alert("Editor de evento (mockup):\n\n" + title);
        return;
      }
      titleEl.textContent = title;
      body.innerHTML = html;
      panel.setAttribute("data-open", "true");
      backdrop.setAttribute("data-open", "true");
      backdrop.onclick = closeSimpleSidePanel;
      const closeBtn = document.getElementById("side-panel-close");
      if (closeBtn) closeBtn.onclick = closeSimpleSidePanel;
    }
    function closeSimpleSidePanel() {
      const panel = document.getElementById("side-panel");
      const backdrop = document.getElementById("side-panel-backdrop");
      if (panel) panel.removeAttribute("data-open");
      if (backdrop) backdrop.removeAttribute("data-open");
    }

    /* ---------- Atajos de teclado del componente ---------- */
    container.addEventListener("keydown", e => {
      // No interceptar si estamos editando un input
      const t = e.target;
      const tag = (t.tagName || "").toUpperCase();
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      // No interceptar si el side panel está abierto
      const sp = document.getElementById("side-panel");
      if (sp && sp.getAttribute("data-open") === "true") return;

      if (!inInput) {
        if (e.key === "t" || e.key === "T") { e.preventDefault(); state.viewDate = new Date(); state.selectedDate = ymd(new Date()); render(); return; }
        if (e.key === "m" || e.key === "M") { e.preventDefault(); state.view = "month"; render(); return; }
        if (e.key === "a" || e.key === "A") { e.preventDefault(); state.view = "list"; render(); return; }
        if (e.key === "n" || e.key === "N") { e.preventDefault(); openEventEditor(null, state.selectedDate); return; }
        if (e.key === "PageUp")   { e.preventDefault(); state.viewDate = addMonths(state.viewDate, -1); render(); return; }
        if (e.key === "PageDown") { e.preventDefault(); state.viewDate = addMonths(state.viewDate,  1); render(); return; }

        if (state.view === "month") {
          let delta = 0;
          if (e.key === "ArrowLeft")  delta = -1;
          if (e.key === "ArrowRight") delta = +1;
          if (e.key === "ArrowUp")    delta = -7;
          if (e.key === "ArrowDown")  delta = +7;
          if (delta !== 0) {
            e.preventDefault();
            const cur = parseYMD(state.selectedDate);
            const next = addDays(cur, delta);
            state.selectedDate = ymd(next);
            // Si nos fuimos a otro mes, mover viewDate
            if (next.getMonth() !== state.viewDate.getMonth() || next.getFullYear() !== state.viewDate.getFullYear()) {
              state.viewDate = startOfMonth(next);
            }
            render();
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            // Si el día tiene 1 evento → abrirlo. Si no, abrir nuevo en ese día.
            const evs = state.events.filter(x => x.fecha === state.selectedDate);
            if (evs.length === 1) openEventEditor(evs[0]);
            else openEventEditor(null, state.selectedDate);
            return;
          }
        } else { // vista list
          // ↑↓ recorre eventos
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const items = container.querySelectorAll('[data-role="list"] [data-event-id]');
            if (!items.length) return;
            const ids = Array.from(items).map(i => i.dataset.eventId);
            let i = state.selectedEventId ? ids.indexOf(state.selectedEventId) : -1;
            if (i === -1) i = 0;
            else i = Math.max(0, Math.min(ids.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
            state.selectedEventId = ids[i];
            // Refrescar selección sin re-renderizar todo
            container.querySelectorAll('[data-event-id]').forEach(x => x.removeAttribute("aria-selected"));
            const newItem = items[i];
            newItem.setAttribute("aria-selected", "true");
            newItem.scrollIntoView({ block: "nearest" });
            return;
          }
          if (e.key === "Enter" && state.selectedEventId) {
            e.preventDefault();
            const ev = state.events.find(x => x.id === state.selectedEventId);
            if (ev) openEventEditor(ev);
            return;
          }
        }
      }
    });

    // Foco inicial en el contenedor
    setTimeout(() => {
      const a = container.querySelector(".agenda");
      if (a) a.focus();
    }, 50);

    render();

    // API pública del instance
    return {
      refresh: render,
      getState: () => ({ ...state, events: state.events.slice() }),
      addEvent: (ev) => { ev.id = ev.id || uuid(); state.events.push(ev); persist(); render(); },
      removeEvent: (id) => { state.events = state.events.filter(x => x.id !== id); persist(); render(); },
      goTo: (date) => { state.viewDate = parseYMD(date); state.selectedDate = date; render(); }
    };
  }

  window.NodoComponents.Agenda = { mount };
  console.log("[NODO Shell] NodoComponents.Agenda cargado.");
})();
