/* ============================================================
   NODO Shell — NodoComponents.Inputs
   ============================================================
   Inputs reusables con API consistente:
     const inst = NodoComponents.Inputs.text({ container, ...opts });
     inst.getValue() / .setValue(v) / .validate() / .focus() / .destroy()

   Tipos disponibles:
     text · money · ruc · ci · phone · email · date · dateRange
     select · switch · textarea

   Helpers utilitarios:
     Inputs.formatMoney(n)  → "Gs. 1.500.000"
     Inputs.parseMoney(s)   → 1500000
     Inputs.validateRUC(s)  → boolean (dígito verificador PY)
     Inputs.formatPhone(s)  → "0981-123-456"
     Inputs.formatDate(d)   → "25/04/2026"
     Inputs.parseDate(s)    → Date
   ============================================================ */

(function () {
  "use strict";

  window.NodoComponents = window.NodoComponents || {};

  /* ---------- Helpers ---------- */
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  function pad(n) { return String(n).padStart(2, "0"); }

  /* ---------- Format / parse ---------- */
  function formatMoney(n) {
    if (n === null || n === undefined || n === "") return "";
    const num = Number(n);
    if (isNaN(num)) return String(n);
    return "Gs. " + Math.round(num).toLocaleString("es-PY", { maximumFractionDigits: 0 });
  }
  function parseMoney(s) {
    if (s === null || s === undefined) return null;
    const clean = String(s).replace(/[^\d-]/g, "");
    if (!clean) return null;
    return Number(clean);
  }
  function formatPhone(s) {
    if (!s) return "";
    const d = String(s).replace(/\D/g, "");
    if (d.length === 10 && d.startsWith("0")) {
      return d.slice(0,4) + "-" + d.slice(4,7) + "-" + d.slice(7);
    }
    return s;
  }
  function formatRUC(s) {
    if (!s) return "";
    const d = String(s).replace(/\D/g, "");
    if (d.length < 2) return d;
    return d.slice(0, -1) + "-" + d.slice(-1);
  }
  function formatCI(s) {
    if (!s) return "";
    const d = String(s).replace(/\D/g, "");
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0,d.length-3) + "." + d.slice(-3);
    return d.slice(0,d.length-6) + "." + d.slice(-6,-3) + "." + d.slice(-3);
  }
  // Dígito verificador SET Paraguay (módulo 11)
  function validateRUC(ruc) {
    if (!ruc) return false;
    const clean = String(ruc).replace(/[^\d]/g, "");
    if (clean.length < 2 || clean.length > 9) return false;
    const num = clean.slice(0, -1);
    const dv  = Number(clean.slice(-1));
    let total = 0;
    let factor = 2;
    const base = "0123456789";
    for (let i = num.length - 1; i >= 0; i--) {
      const ch = base.indexOf(num[i]);
      if (ch < 0) return false;
      total += ch * factor;
      factor++;
      if (factor > 11) factor = 2;
    }
    let mod = 11 - (total % 11);
    if (mod === 11) mod = 0;
    if (mod === 10) mod = 1;
    return mod === dv;
  }
  function validateEmail(s) {
    if (!s) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }
  function formatDate(d) {
    if (!d) return "";
    if (typeof d === "string") d = parseDate(d);
    if (!d || isNaN(d)) return "";
    return pad(d.getDate()) + "/" + pad(d.getMonth()+1) + "/" + d.getFullYear();
  }
  function parseDate(s) {
    if (!s) return null;
    if (s instanceof Date) return s;
    s = String(s).trim();
    // dd/mm/yyyy
    let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
    // yyyy-mm-dd
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }
  function ymd(d) {
    if (!d) return "";
    if (typeof d === "string") return d.length === 10 ? d : "";
    return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate());
  }

  /* ============================================================
     TEXT-LIKE inputs (text, money, ruc, ci, phone, email)
     ============================================================ */
  function makeTextLike(opts, kind) {
    const container = opts.container;
    const label     = opts.label || "";
    const required  = !!opts.required;
    const readonly  = !!opts.readonly;
    const disabled  = !!opts.disabled;
    const placeholder = opts.placeholder || "";
    const hint      = opts.hint || "";
    const prefix    = opts.prefix || "";
    const suffix    = opts.suffix || "";
    let value       = opts.value !== undefined ? opts.value : "";

    const id = "ni-" + Math.random().toString(36).slice(2, 8);
    const wrap = el(`
      <div class="ni" data-kind="${kind}">
        ${label ? `<label class="ni__label" for="${id}">${esc(label)}${required ? ' <span class="ni__label-required">*</span>' : ''}</label>` : ''}
        <div class="ni__input ni__input--${kind} ${readonly?'ni__input--readonly':''} ${disabled?'ni__input--disabled':''}">
          ${prefix ? `<div class="ni__prefix">${esc(prefix)}</div>` : ''}
          <input id="${id}" type="text"
                 placeholder="${esc(placeholder)}"
                 ${readonly?'readonly':''}
                 ${disabled?'disabled':''}>
          ${suffix ? `<div class="ni__suffix">${suffix}</div>` : ''}
        </div>
        ${hint ? `<div class="ni__hint">${esc(hint)}</div>` : ''}
        <div class="ni__error"></div>
      </div>
    `);
    container.appendChild(wrap);
    const input = wrap.querySelector("input");
    const inputBox = wrap.querySelector(".ni__input");
    const errBox = wrap.querySelector(".ni__error");

    function setError(msg) {
      if (msg) {
        errBox.textContent = msg;
        inputBox.classList.add("ni__input--invalid");
      } else {
        errBox.textContent = "";
        inputBox.classList.remove("ni__input--invalid");
      }
    }

    function display(v) {
      switch (kind) {
        case "money": return v === "" || v === null || v === undefined ? "" : Number(v).toLocaleString("es-PY", { maximumFractionDigits: 0 });
        case "phone": return formatPhone(v);
        case "ruc":   return formatRUC(v);
        case "ci":    return formatCI(v);
        default:      return v == null ? "" : String(v);
      }
    }
    function rawValue() {
      if (kind === "money") return parseMoney(input.value);
      if (kind === "phone" || kind === "ruc" || kind === "ci") return String(input.value).replace(/\D/g, "");
      return input.value;
    }

    input.value = display(value);

    input.addEventListener("input", () => {
      // Reformat on the fly
      const caret = input.selectionStart;
      const prev  = input.value;
      const formatted = display(rawValue());
      if (formatted !== prev) {
        input.value = formatted;
        // intentar mantener caret cerca del fin
        const newPos = caret + (formatted.length - prev.length);
        try { input.setSelectionRange(newPos, newPos); } catch (e) {}
      }
      value = rawValue();
      setError("");
      if (opts.onChange) opts.onChange(value);
    });
    input.addEventListener("blur", () => {
      validate();
      if (opts.onBlur) opts.onBlur(value);
    });

    function validate() {
      const v = rawValue();
      if (required && (v === "" || v === null || v === undefined)) {
        setError("Requerido");
        return false;
      }
      if (v === "" || v === null || v === undefined) {
        setError("");
        return true;
      }
      if (kind === "ruc" && !validateRUC(input.value)) {
        setError("RUC inválido (verificá dígito verificador)");
        return false;
      }
      if (kind === "email" && !validateEmail(v)) {
        setError("Email inválido");
        return false;
      }
      if (kind === "phone" && String(v).length !== 10) {
        setError("Teléfono debe tener 10 dígitos (ej: 0981-123-456)");
        return false;
      }
      if (opts.validate) {
        const r = opts.validate(v);
        if (r !== true) { setError(r || "Inválido"); return false; }
      }
      setError("");
      return true;
    }

    return {
      el: wrap,
      getValue: () => rawValue(),
      setValue: (v) => { value = v; input.value = display(v); setError(""); },
      validate,
      setError,
      focus: () => input.focus(),
      destroy: () => wrap.remove()
    };
  }

  /* ============================================================
     TEXTAREA
     ============================================================ */
  function textarea(opts) {
    const container = opts.container;
    const wrap = el(`
      <div class="ni" data-kind="textarea">
        ${opts.label ? `<label class="ni__label">${esc(opts.label)}${opts.required ? ' <span class="ni__label-required">*</span>' : ''}</label>` : ''}
        <textarea class="ni__textarea" rows="${opts.rows||3}" placeholder="${esc(opts.placeholder||'')}"
          ${opts.readonly?'readonly':''} ${opts.disabled?'disabled':''}
          ${opts.maxlength ? `maxlength="${opts.maxlength}"` : ''}>${esc(opts.value||'')}</textarea>
        ${opts.maxlength ? `<div class="ni__textarea-counter"><span class="ni__counter">0</span>/${opts.maxlength}</div>` : ''}
        ${opts.hint ? `<div class="ni__hint">${esc(opts.hint)}</div>` : ''}
        <div class="ni__error"></div>
      </div>
    `);
    container.appendChild(wrap);
    const ta = wrap.querySelector("textarea");
    const counter = wrap.querySelector(".ni__counter");
    function updateCounter() { if (counter) counter.textContent = ta.value.length; }
    updateCounter();
    ta.addEventListener("input", () => {
      updateCounter();
      if (opts.onChange) opts.onChange(ta.value);
    });
    return {
      el: wrap,
      getValue: () => ta.value,
      setValue: (v) => { ta.value = v || ""; updateCounter(); },
      validate: () => {
        if (opts.required && !ta.value.trim()) {
          wrap.querySelector(".ni__error").textContent = "Requerido";
          return false;
        }
        wrap.querySelector(".ni__error").textContent = "";
        return true;
      },
      focus: () => ta.focus(),
      destroy: () => wrap.remove()
    };
  }

  /* ============================================================
     SWITCH (toggle on/off)
     ============================================================ */
  function makeSwitch(opts) {
    const wrap = el(`
      <label class="ni__switch" data-kind="switch">
        <input type="checkbox" ${opts.value ? "checked" : ""} ${opts.disabled?'disabled':''}>
        <span class="ni__switch-track"></span>
        ${opts.label ? `<span class="ni__switch-label">${esc(opts.label)}</span>` : ""}
      </label>
    `);
    opts.container.appendChild(wrap);
    const cb = wrap.querySelector("input");
    cb.addEventListener("change", () => {
      if (opts.onChange) opts.onChange(cb.checked);
    });
    return {
      el: wrap,
      getValue: () => cb.checked,
      setValue: (v) => { cb.checked = !!v; },
      focus: () => cb.focus(),
      destroy: () => wrap.remove(),
      validate: () => true
    };
  }

  /* ============================================================
     SELECT (combobox searchable)
     ============================================================ */
  function makeSelect(opts) {
    const container = opts.container;
    const items = (opts.items || []).map(it => typeof it === "string" ? { value: it, label: it } : it);
    let value = opts.value !== undefined ? opts.value : null;
    const placeholder = opts.placeholder || "-- Seleccionar --";
    const searchable = opts.searchable !== false;

    const wrap = el(`
      <div class="ni" data-kind="select">
        ${opts.label ? `<label class="ni__label">${esc(opts.label)}${opts.required ? ' <span class="ni__label-required">*</span>' : ''}</label>` : ''}
        <div class="ni__select" tabindex="0">
          <div class="ni__select-control">
            <span class="ni__select-value ni__select-value--placeholder">${esc(placeholder)}</span>
            <span class="ni__select-arrow"><svg viewBox="0 0 8 8"><path d="M0 2l4 4 4-4z" fill="currentColor"/></svg></span>
          </div>
          <div class="ni__select-menu">
            ${searchable ? `<div class="ni__select-search"><input type="text" placeholder="Buscar..."></div>` : ""}
            <div class="ni__select-options"></div>
          </div>
        </div>
        ${opts.hint ? `<div class="ni__hint">${esc(opts.hint)}</div>` : ''}
        <div class="ni__error"></div>
      </div>
    `);
    container.appendChild(wrap);

    const sel       = wrap.querySelector(".ni__select");
    const valueEl   = wrap.querySelector(".ni__select-value");
    const menuEl    = wrap.querySelector(".ni__select-menu");
    const optsEl    = wrap.querySelector(".ni__select-options");
    const searchEl  = wrap.querySelector(".ni__select-search input");

    let filtered = items.slice();
    let focusedIdx = -1;

    function renderOptions() {
      if (filtered.length === 0) {
        optsEl.innerHTML = `<div class="ni__select-empty">Sin resultados</div>`;
        return;
      }
      optsEl.innerHTML = filtered.map((it, i) => `
        <div class="ni__select-opt ${i === focusedIdx ? 'ni__select-opt--focused' : ''}"
             aria-selected="${value === it.value ? 'true' : 'false'}"
             data-i="${i}">
          ${it.icon ? esc(it.icon) + " " : ""}${esc(it.label)}
        </div>
      `).join("");
    }
    function refreshDisplay() {
      const it = items.find(x => x.value === value);
      if (it) {
        valueEl.textContent = it.label;
        valueEl.classList.remove("ni__select-value--placeholder");
      } else {
        valueEl.textContent = placeholder;
        valueEl.classList.add("ni__select-value--placeholder");
      }
    }

    function open() {
      sel.classList.add("ni__select--open");
      filtered = items.slice();
      focusedIdx = items.findIndex(x => x.value === value);
      renderOptions();
      if (searchEl) {
        searchEl.value = "";
        setTimeout(() => searchEl.focus(), 50);
      }
    }
    function close() { sel.classList.remove("ni__select--open"); }

    sel.querySelector(".ni__select-control").addEventListener("click", () => {
      if (sel.classList.contains("ni__select--open")) close(); else open();
    });
    optsEl.addEventListener("click", e => {
      const o = e.target.closest(".ni__select-opt");
      if (!o) return;
      const i = Number(o.dataset.i);
      value = filtered[i].value;
      refreshDisplay();
      close();
      if (opts.onChange) opts.onChange(value);
    });
    if (searchEl) {
      searchEl.addEventListener("input", () => {
        const q = searchEl.value.toLowerCase();
        filtered = items.filter(it => String(it.label).toLowerCase().includes(q));
        focusedIdx = filtered.length > 0 ? 0 : -1;
        renderOptions();
      });
      searchEl.addEventListener("keydown", e => {
        if (e.key === "ArrowDown") { e.preventDefault(); focusedIdx = Math.min(filtered.length-1, focusedIdx+1); renderOptions(); }
        else if (e.key === "ArrowUp")   { e.preventDefault(); focusedIdx = Math.max(0, focusedIdx-1); renderOptions(); }
        else if (e.key === "Enter")     { e.preventDefault(); if (filtered[focusedIdx]) { value = filtered[focusedIdx].value; refreshDisplay(); close(); if (opts.onChange) opts.onChange(value); } }
        else if (e.key === "Escape")    { e.preventDefault(); close(); sel.focus(); }
      });
    }
    document.addEventListener("click", e => { if (!wrap.contains(e.target)) close(); });

    refreshDisplay();

    return {
      el: wrap,
      getValue: () => value,
      setValue: (v) => { value = v; refreshDisplay(); },
      setItems: (newItems) => { items.splice(0, items.length, ...newItems.map(it => typeof it === "string" ? { value: it, label: it } : it)); filtered = items.slice(); refreshDisplay(); renderOptions(); },
      focus: () => sel.focus(),
      destroy: () => wrap.remove(),
      validate: () => {
        if (opts.required && (value === null || value === undefined || value === "")) {
          wrap.querySelector(".ni__error").textContent = "Requerido";
          return false;
        }
        wrap.querySelector(".ni__error").textContent = "";
        return true;
      }
    };
  }

  /* ============================================================
     DATE picker (popup calendario)
     ============================================================ */
  function makeDate(opts) {
    const container = opts.container;
    let value = opts.value ? parseDate(opts.value) : null;
    const id = "ni-d-" + Math.random().toString(36).slice(2, 8);

    const wrap = el(`
      <div class="ni" data-kind="date">
        ${opts.label ? `<label class="ni__label">${esc(opts.label)}${opts.required ? ' <span class="ni__label-required">*</span>' : ''}</label>` : ''}
        <div class="ni__input ni__input--date">
          <input id="${id}" type="text" placeholder="dd/mm/yyyy" value="${value ? formatDate(value) : ''}" maxlength="10">
          <div class="ni__suffix" data-role="open">
            <svg viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="12" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M2 6h12M5 1v3M11 1v3" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
          </div>
        </div>
        <div class="ni__datepicker"></div>
        ${opts.hint ? `<div class="ni__hint">${esc(opts.hint)}</div>` : ''}
        <div class="ni__error"></div>
      </div>
    `);
    container.appendChild(wrap);

    const input = wrap.querySelector("input");
    const dp    = wrap.querySelector(".ni__datepicker");
    let viewMonth = value || new Date();
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);

    const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const DIAS_C = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

    function renderDP() {
      const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
      let off = first.getDay() - 1;
      if (off < 0) off = 6;
      const start = new Date(first);
      start.setDate(start.getDate() - off);
      let html = `
        <div class="ni__datepicker-header">
          <button class="ni__datepicker-nav" data-act="prev" title="Mes anterior">‹</button>
          <div class="ni__datepicker-title">${MESES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}</div>
          <button class="ni__datepicker-nav" data-act="next" title="Mes siguiente">›</button>
        </div>
        <div class="ni__datepicker-grid">
          ${DIAS_C.map(d => `<div class="ni__dp-dow">${d}</div>`).join("")}
      `;
      const today = new Date();
      const todayKey = ymd(today);
      const valKey = value ? ymd(value) : null;
      for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const isOther = d.getMonth() !== viewMonth.getMonth();
        const k = ymd(d);
        const isToday = k === todayKey;
        const isSel = k === valKey;
        const cls = ["ni__dp-cell", isOther && "ni__dp-cell--other", isToday && "ni__dp-cell--today", isSel && "ni__dp-cell--selected"].filter(Boolean).join(" ");
        html += `<div class="${cls}" data-d="${k}">${d.getDate()}</div>`;
      }
      html += `</div>
        <div class="ni__datepicker-footer">
          <button class="ni__datepicker-quick" data-quick="today">Hoy</button>
          <button class="ni__datepicker-quick" data-quick="clear">Limpiar</button>
        </div>
      `;
      dp.innerHTML = html;
    }

    function open() {
      renderDP();
      dp.classList.add("ni__datepicker--open");
    }
    function close() { dp.classList.remove("ni__datepicker--open"); }

    wrap.querySelector('[data-role="open"]').addEventListener("click", () => {
      if (dp.classList.contains("ni__datepicker--open")) close(); else open();
    });
    input.addEventListener("focus", () => {
      const v = parseDate(input.value);
      if (v) { value = v; viewMonth = new Date(v.getFullYear(), v.getMonth(), 1); }
      open();
    });
    input.addEventListener("input", () => {
      // permitir escribir manualmente, validar al blur
    });
    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (!wrap.contains(document.activeElement)) close();
      }, 150);
    });
    dp.addEventListener("click", e => {
      const cell = e.target.closest(".ni__dp-cell");
      if (cell) {
        value = parseDate(cell.dataset.d);
        input.value = formatDate(value);
        if (opts.onChange) opts.onChange(ymd(value));
        close();
        return;
      }
      const nav = e.target.closest(".ni__datepicker-nav");
      if (nav) {
        viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + (nav.dataset.act === "next" ? 1 : -1), 1);
        renderDP();
        return;
      }
      const quick = e.target.closest("[data-quick]");
      if (quick) {
        if (quick.dataset.quick === "today") {
          value = new Date();
          input.value = formatDate(value);
          if (opts.onChange) opts.onChange(ymd(value));
        } else {
          value = null;
          input.value = "";
          if (opts.onChange) opts.onChange(null);
        }
        close();
      }
    });
    document.addEventListener("click", e => { if (!wrap.contains(e.target)) close(); });

    return {
      el: wrap,
      getValue: () => value ? ymd(value) : null,
      getDate: () => value,
      setValue: (v) => { value = parseDate(v); input.value = value ? formatDate(value) : ""; },
      focus: () => input.focus(),
      destroy: () => wrap.remove(),
      validate: () => {
        if (opts.required && !value) { wrap.querySelector(".ni__error").textContent = "Requerido"; return false; }
        wrap.querySelector(".ni__error").textContent = "";
        return true;
      }
    };
  }

  /* ============================================================
     DATE RANGE (desde/hasta)
     ============================================================ */
  function makeDateRange(opts) {
    const container = opts.container;
    const wrap = el(`
      <div class="ni" data-kind="dateRange">
        ${opts.label ? `<label class="ni__label">${esc(opts.label)}${opts.required ? ' <span class="ni__label-required">*</span>' : ''}</label>` : ''}
        <div class="ni__daterange">
          <div data-role="from"></div>
          <span class="ni__daterange-sep">→</span>
          <div data-role="to"></div>
        </div>
        ${opts.presets ? `<div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap;">
          ${opts.presets.map(p => `<button type="button" class="ni__datepicker-quick" data-preset="${esc(p.id)}">${esc(p.label)}</button>`).join("")}
        </div>` : ''}
        ${opts.hint ? `<div class="ni__hint">${esc(opts.hint)}</div>` : ''}
        <div class="ni__error"></div>
      </div>
    `);
    container.appendChild(wrap);
    const fromInst = makeDate({
      container: wrap.querySelector('[data-role="from"]'),
      value: opts.from,
      onChange: () => fireChange()
    });
    const toInst = makeDate({
      container: wrap.querySelector('[data-role="to"]'),
      value: opts.to,
      onChange: () => fireChange()
    });
    function fireChange() {
      if (opts.onChange) opts.onChange({ from: fromInst.getValue(), to: toInst.getValue() });
    }
    if (opts.presets) {
      wrap.addEventListener("click", e => {
        const b = e.target.closest("[data-preset]");
        if (!b) return;
        const id = b.dataset.preset;
        const today = new Date();
        let from = today, to = today;
        if (id === "today")     { from = today; to = today; }
        else if (id === "yesterday") { from = new Date(today); from.setDate(from.getDate()-1); to = from; }
        else if (id === "week") { from = new Date(today); from.setDate(from.getDate()-6); to = today; }
        else if (id === "month"){ from = new Date(today.getFullYear(), today.getMonth(), 1); to = today; }
        else if (id === "year") { from = new Date(today.getFullYear(), 0, 1); to = today; }
        else if (id === "30d")  { from = new Date(today); from.setDate(from.getDate()-29); to = today; }
        fromInst.setValue(from);
        toInst.setValue(to);
        fireChange();
      });
    }
    return {
      el: wrap,
      getValue: () => ({ from: fromInst.getValue(), to: toInst.getValue() }),
      setValue: (v) => { fromInst.setValue(v && v.from); toInst.setValue(v && v.to); },
      destroy: () => wrap.remove(),
      validate: () => {
        const ok1 = fromInst.validate(), ok2 = toInst.validate();
        return ok1 && ok2;
      },
      focus: () => fromInst.focus()
    };
  }

  /* ============================================================
     EXPORT API
     ============================================================ */
  window.NodoComponents.Inputs = {
    text:      (o) => makeTextLike(o, "text"),
    money:     (o) => makeTextLike(o, "money"),
    ruc:       (o) => makeTextLike(o, "ruc"),
    ci:        (o) => makeTextLike(o, "ci"),
    phone:     (o) => makeTextLike(o, "phone"),
    email:     (o) => makeTextLike(o, "email"),
    textarea:  textarea,
    select:    makeSelect,
    switch:    makeSwitch,
    date:      makeDate,
    dateRange: makeDateRange,

    // utilidades
    formatMoney, parseMoney,
    formatPhone, formatRUC, formatCI,
    validateRUC, validateEmail,
    formatDate, parseDate, ymd
  };

  console.log("[NODO Shell] NodoComponents.Inputs cargado.");
})();
