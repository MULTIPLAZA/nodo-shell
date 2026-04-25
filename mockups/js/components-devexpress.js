/* ============================================================
   NODO Shell — DevExpress WinForms-style components
   ============================================================
   Mantiene la identidad visual del shell aplicativo: densidad alta,
   gradientes Office, triggers a la derecha, sidebars Outlook.

     NodoComponents.NavBar.create        → XtraNavBar
     NodoComponents.TreeList.create      → XtraTreeList
     NodoComponents.Alert.show           → AlertControl
     NodoComponents.WaitForm.show        → WaitForm / Splash
     NodoComponents.VerticalGrid.create  → XtraVerticalGrid (PropertyGrid)
     NodoComponents.Layout.create        → XtraLayoutControl
   ============================================================ */

(function () {
  "use strict";

  window.NodoComponents = window.NodoComponents || {};

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

  /* ============================================================
     NAVBAR
     ============================================================
     opts:
       container, title?,
       groups: [{ id, title, icon?, expanded?, items: [
         { id, label, icon?, badge?, onClick? }
       ]}],
       onSelect(item)
     ============================================================ */
  function navBarCreate(opts) {
    const groups = (opts.groups || []).slice();
    let selectedId = null;

    const wrap = document.createElement("div");
    wrap.className = "no-nav";
    if (opts.title) {
      const h = document.createElement("div");
      h.className = "no-nav__header";
      h.textContent = opts.title;
      wrap.appendChild(h);
    }
    const inner = document.createElement("div");
    inner.className = "no-nav__groups";
    wrap.appendChild(inner);
    opts.container.appendChild(wrap);

    function render() {
      inner.innerHTML = groups.map((g, gi) => `
        <div class="no-nav__group ${g.expanded !== false ? 'no-nav__group--expanded' : ''}" data-g="${gi}">
          <div class="no-nav__group-header">
            ${g.icon ? `<span class="no-nav__group-icon">${g.icon}</span>` : ''}
            <span class="no-nav__group-title">${esc(g.title)}</span>
            <span class="no-nav__group-toggle">▾</span>
          </div>
          <div class="no-nav__group-body">
            ${(g.items || []).map(it => `
              <div class="no-nav__item" data-id="${esc(it.id)}" aria-selected="${selectedId === it.id ? 'true' : 'false'}">
                ${it.icon ? `<span class="no-nav__item-icon">${it.icon}</span>` : '<span class="no-nav__item-icon"></span>'}
                <span class="no-nav__item-label">${esc(it.label)}</span>
                ${it.badge !== undefined ? `<span class="no-nav__item-badge">${esc(it.badge)}</span>` : ''}
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");

      inner.querySelectorAll(".no-nav__group-header").forEach(h => {
        h.onclick = () => {
          const g = h.parentElement;
          const gi = Number(g.dataset.g);
          groups[gi].expanded = !groups[gi].expanded;
          // toggleamos sin re-render entero para preservar focus
          g.classList.toggle("no-nav__group--expanded");
        };
      });
      inner.querySelectorAll(".no-nav__item").forEach(it => {
        it.onclick = () => {
          selectedId = it.dataset.id;
          inner.querySelectorAll(".no-nav__item").forEach(x => x.setAttribute("aria-selected", x.dataset.id === selectedId ? "true" : "false"));
          // Buscar item original
          let item = null;
          for (const g of groups) {
            const f = (g.items || []).find(i => String(i.id) === selectedId);
            if (f) { item = f; break; }
          }
          if (item && item.onClick) item.onClick(item);
          if (opts.onSelect) opts.onSelect(item);
        };
      });
    }
    render();

    return {
      el: wrap,
      refresh: render,
      select: (id) => {
        selectedId = id;
        inner.querySelectorAll(".no-nav__item").forEach(x =>
          x.setAttribute("aria-selected", x.dataset.id === selectedId ? "true" : "false")
        );
      },
      setBadge: (id, badge) => {
        groups.forEach(g => (g.items||[]).forEach(it => { if (String(it.id) === String(id)) it.badge = badge; }));
        render();
      },
      destroy: () => wrap.remove()
    };
  }

  /* ============================================================
     TREELIST — tree + grid
     ============================================================
     opts:
       container,
       columns: [{ key, label, width?, type?, format? }]
                  type: text|num|money|center
       data: [{ id, parentId?, ...campos, children?: [...] }]
       expandColumn?: "key"  (qué columna lleva la indentación + toggle)
       icon?: function(node) → svg string
       onSelect(node)
     ============================================================ */
  function treeListCreate(opts) {
    const columns = (opts.columns || []).slice();
    const expandKey = opts.expandColumn || (columns[0] && columns[0].key);
    let selectedId = null;

    // Normalizar data: si vienen con parentId planos, transformar a árbol
    function buildTree(rows) {
      // Si tienen children ya, retornar
      if (rows.length === 0 || rows[0].children !== undefined) return rows;
      const byId = {};
      rows.forEach(r => { byId[r.id] = Object.assign({}, r, { children: [] }); });
      const roots = [];
      rows.forEach(r => {
        const node = byId[r.id];
        if (r.parentId && byId[r.parentId]) byId[r.parentId].children.push(node);
        else roots.push(node);
      });
      return roots;
    }
    const tree = buildTree(opts.data || []);

    const wrap = document.createElement("div");
    wrap.className = "no-tl";
    wrap.innerHTML = `
      <div class="no-tl__header">
        ${columns.map(c => `<div class="no-tl__col ${c.type === 'num' || c.type === 'money' ? 'no-tl__col--num' : ''} ${c.type === 'center' ? 'no-tl__col--center' : ''}" style="${c.width ? 'flex:0 0 '+c.width+'px;' : 'flex:1;'}">${esc(c.label)}</div>`).join("")}
      </div>
      <div class="no-tl__body" data-role="body"></div>
    `;
    opts.container.appendChild(wrap);
    const body = wrap.querySelector('[data-role="body"]');

    function expandedIds() {
      // mantenemos estado en cada node (.expanded)
      // por default todos colapsados excepto raíces de 1er nivel
      return null;
    }

    function render() {
      body.innerHTML = "";
      const ix = (n, level) => {
        const hasKids = n.children && n.children.length > 0;
        const expanded = !!n.expanded;
        const row = document.createElement("div");
        row.className = "no-tl__row";
        if (selectedId === n.id) row.setAttribute("aria-selected", "true");
        if (hasKids) row.setAttribute("aria-expanded", String(expanded));
        row.dataset.id = n.id;

        columns.forEach(c => {
          const cell = document.createElement("div");
          cell.className = "no-tl__row-cell" + (c.type === 'num' || c.type === 'money' ? ' no-tl__row-cell--num' : '');
          if (c.width) cell.style.flex = "0 0 " + c.width + "px";
          else cell.style.flex = "1";
          // Si esta columna es la del árbol, agregar indent + toggle
          if (c.key === expandKey) {
            const ind = document.createElement("span");
            ind.className = "no-tl__indent";
            for (let i = 0; i < level; i++) {
              const sp = document.createElement("span");
              sp.className = "no-tl__indent-spacer";
              ind.appendChild(sp);
            }
            const tg = document.createElement("span");
            tg.className = "no-tl__toggle" + (hasKids ? "" : " no-tl__toggle--leaf");
            ind.appendChild(tg);
            cell.appendChild(ind);
            if (opts.icon) {
              const ic = document.createElement("span");
              ic.className = "no-tl__icon";
              ic.innerHTML = opts.icon(n);
              cell.appendChild(ic);
            }
            const lab = document.createElement("span");
            const v = n[c.key];
            lab.textContent = c.format ? c.format(v, n) : (v == null ? "" : String(v));
            cell.appendChild(lab);
          } else {
            const v = n[c.key];
            cell.textContent = c.format ? c.format(v, n) : (v == null ? "" : String(v));
          }
          row.appendChild(cell);
        });
        body.appendChild(row);
        // children
        if (hasKids && expanded) {
          n.children.forEach(ch => ix(ch, level + 1));
        }
      };
      tree.forEach(r => ix(r, 0));

      body.querySelectorAll(".no-tl__row").forEach(rowEl => {
        const node = findNode(rowEl.dataset.id, tree);
        if (!node) return;
        const toggle = rowEl.querySelector(".no-tl__toggle");
        if (toggle && !toggle.classList.contains("no-tl__toggle--leaf")) {
          toggle.onclick = (e) => {
            e.stopPropagation();
            node.expanded = !node.expanded;
            render();
          };
        }
        rowEl.onclick = () => {
          selectedId = node.id;
          if (opts.onSelect) opts.onSelect(node);
          render();
        };
      });
    }
    function findNode(id, arr) {
      for (const n of arr) {
        if (String(n.id) === String(id)) return n;
        if (n.children) { const r = findNode(id, n.children); if (r) return r; }
      }
      return null;
    }
    function walkAll(arr, fn) { arr.forEach(n => { fn(n); if (n.children) walkAll(n.children, fn); }); }

    render();
    return {
      el: wrap,
      refresh: render,
      expandAll: () => { walkAll(tree, n => { if (n.children && n.children.length) n.expanded = true; }); render(); },
      collapseAll: () => { walkAll(tree, n => { n.expanded = false; }); render(); },
      select: (id) => { selectedId = id; render(); },
      destroy: () => wrap.remove()
    };
  }

  /* ============================================================
     ALERT (esquinero con thumbnail + acciones)
     ============================================================
     opts: { title, message, kind, thumbnail, actions, duration, position }
     ============================================================ */
  function ensureAlertStack(position) {
    const id = "no-alert-stack-" + position;
    let s = document.getElementById(id);
    if (!s) {
      s = document.createElement("div");
      s.id = id;
      s.className = "no-alert-stack no-alert-stack--" + position;
      document.body.appendChild(s);
    }
    return s;
  }
  function alertShow(opts) {
    const position = opts.position || "bottom-right";
    const stack = ensureAlertStack(position);
    const kind = opts.kind || "";
    const duration = opts.duration === undefined ? 6000 : opts.duration;

    const thumbHTML = opts.thumbnail
      ? (typeof opts.thumbnail === "string" && opts.thumbnail.startsWith("<")
          ? opts.thumbnail
          : `<img src="${esc(opts.thumbnail)}" alt="">`)
      : (kind === "success" ? "✓" : kind === "warning" ? "⚠" : kind === "danger" ? "✕" : "i");

    const a = document.createElement("div");
    a.className = "no-alert" + (kind ? " no-alert--" + kind : "");
    a.innerHTML = `
      <div class="no-alert__thumb">${thumbHTML}</div>
      <div class="no-alert__body">
        <div class="no-alert__title">
          <span class="no-alert__title-text">${esc(opts.title || "")}</span>
          <button class="no-alert__close" aria-label="Cerrar">✕</button>
        </div>
        ${opts.message ? `<div class="no-alert__msg">${esc(opts.message)}</div>` : ""}
        ${opts.actions && opts.actions.length ? `<div class="no-alert__actions">
          ${opts.actions.map((act, i) => `<button class="no-alert__action ${act.primary ? 'no-alert__action--primary' : ''}" data-i="${i}">${esc(act.label)}</button>`).join("")}
        </div>` : ""}
      </div>
    `;
    stack.appendChild(a);

    function dismiss() {
      a.classList.add("no-alert--leaving");
      setTimeout(() => a.remove(), 220);
    }
    a.querySelector(".no-alert__close").onclick = dismiss;
    if (opts.actions) {
      a.querySelectorAll(".no-alert__action").forEach(b => {
        b.onclick = () => {
          const i = Number(b.dataset.i);
          const act = opts.actions[i];
          if (act && act.onClick) act.onClick();
          dismiss();
        };
      });
    }
    if (duration > 0) setTimeout(dismiss, duration);
    return { dismiss, el: a };
  }

  /* ============================================================
     WAITFORM — overlay loading con spinner
     ============================================================
     opts: { title, message, container? } container? = inline mode
     ============================================================ */
  function waitFormShow(opts) {
    opts = opts || {};
    const inline = !!opts.container;
    const bg = document.createElement("div");
    bg.className = "no-wait-bg" + (inline ? " no-wait-bg--inline" : "");
    bg.innerHTML = `
      <div class="no-wait ${inline ? 'no-wait--inline' : ''}">
        <div class="no-wait__spinner">
          <svg viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="3" fill="none"
                    stroke-linecap="round"
                    stroke-dasharray="20 80"
                    style="color: var(--ofc-blue-700);"/>
          </svg>
        </div>
        <div class="no-wait__title" data-role="title">${esc(opts.title || "Cargando…")}</div>
        ${opts.message ? `<div class="no-wait__msg" data-role="msg">${esc(opts.message)}</div>` : `<div class="no-wait__msg" data-role="msg" style="display:none;"></div>`}
      </div>
    `;
    if (inline) {
      // El contenedor debe tener position:relative
      const c = opts.container;
      if (getComputedStyle(c).position === "static") c.style.position = "relative";
      c.appendChild(bg);
    } else {
      document.body.appendChild(bg);
    }
    return {
      el: bg,
      update: (info) => {
        if (info.title)   bg.querySelector('[data-role="title"]').textContent = info.title;
        if (info.message !== undefined) {
          const m = bg.querySelector('[data-role="msg"]');
          m.textContent = info.message;
          m.style.display = info.message ? "" : "none";
        }
      },
      close: () => bg.remove()
    };
  }

  /* ============================================================
     VERTICAL GRID / PROPERTY GRID
     ============================================================
     opts:
       container,
       headers?: ["Campo","Valor"]
       fields: [
         { type: "category", label: "Datos generales" },         // separador
         { key, label, type: "text|number|money|date|select|switch|password|textarea",
           value?, options?, readonly?, required? }
       ]
       data?: { campo1: valor1, ... }   (opcional, alternativa a value en field)
       editable?: true
       onChange(key, value)
     ============================================================ */
  function verticalGridCreate(opts) {
    const fields = opts.fields || [];
    const data = Object.assign({}, opts.data || {});
    const headers = opts.headers || ["Propiedad", "Valor"];

    const wrap = document.createElement("div");
    wrap.className = "no-vg";
    wrap.innerHTML = `
      <div class="no-vg__header">
        <div style="flex:0 0 180px;">${esc(headers[0])}</div>
        <div style="flex:1;">${esc(headers[1])}</div>
      </div>
      <div class="no-vg__body" data-role="body"></div>
    `;
    opts.container.appendChild(wrap);
    const body = wrap.querySelector('[data-role="body"]');

    function setVal(key, v) {
      data[key] = v;
      if (opts.onChange) opts.onChange(key, v);
    }

    fields.forEach(f => {
      if (f.type === "category") {
        const cat = document.createElement("div");
        cat.className = "no-vg__category";
        cat.textContent = f.label;
        body.appendChild(cat);
        return;
      }
      const row = document.createElement("div");
      row.className = "no-vg__row";
      const lbl = document.createElement("div");
      lbl.className = "no-vg__row-label" + (f.required ? " no-vg__row-label-required" : "");
      lbl.textContent = f.label;
      const val = document.createElement("div");
      val.className = "no-vg__row-value" + (f.readonly ? " no-vg__row-value--readonly" : "");
      const cur = data[f.key] !== undefined ? data[f.key] : f.value;

      let input;
      const ed = opts.editable !== false && !f.readonly;
      if (f.type === "select") {
        input = document.createElement("select");
        (f.options || []).forEach(o => {
          const opt = document.createElement("option");
          opt.value = typeof o === "string" ? o : o.value;
          opt.textContent = typeof o === "string" ? o : o.label;
          if (cur !== undefined && String(cur) === String(opt.value)) opt.selected = true;
          input.appendChild(opt);
        });
        if (!ed) input.disabled = true;
        input.onchange = () => setVal(f.key, input.value);
      } else if (f.type === "switch") {
        input = document.createElement("label");
        input.style.display = "flex";
        input.style.alignItems = "center";
        input.style.padding = "3px 8px";
        input.innerHTML = `<input type="checkbox" ${cur ? "checked" : ""} ${ed ? "" : "disabled"} style="margin-right:6px;"> <span style="font-size:11px;color:var(--text-muted);">${cur ? "Activado" : "Desactivado"}</span>`;
        const cb = input.querySelector("input");
        const lab = input.querySelector("span");
        cb.onchange = () => { lab.textContent = cb.checked ? "Activado" : "Desactivado"; setVal(f.key, cb.checked); };
      } else if (f.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = f.rows || 2;
        input.value = cur || "";
        if (!ed) input.readOnly = true;
        input.oninput = () => setVal(f.key, input.value);
      } else {
        input = document.createElement("input");
        input.type = f.type === "password" ? "password"
                  : f.type === "number" || f.type === "money" ? "number"
                  : f.type === "date" ? "date"
                  : "text";
        input.value = cur !== undefined && cur !== null ? cur : "";
        input.placeholder = f.placeholder || "";
        if (!ed) input.readOnly = true;
        input.oninput = () => setVal(f.key, input.value);
      }
      val.appendChild(input);
      row.appendChild(lbl);
      row.appendChild(val);
      body.appendChild(row);
    });

    return {
      el: wrap,
      getData: () => Object.assign({}, data),
      setValue: (k, v) => { data[k] = v; /* re-render simplificado: el usuario re-monta si necesita */ },
      destroy: () => wrap.remove()
    };
  }

  /* ============================================================
     LAYOUT CONTROL
     ============================================================
     opts:
       container,
       groups: [
         { title, collapsed?, columns?: 1|2|3|4,
           items: [
             { type: "separator" },
             { type: "text|number|money|date|select|textarea|switch|static",
               label, key, value?, options?, span?, full?, readonly?, required? },
             ...
           ]
         }
       ]
       data?: { ... }
       onChange(key, value)
     ============================================================ */
  function layoutCreate(opts) {
    const groups = opts.groups || [];
    const data = Object.assign({}, opts.data || {});
    const wrap = document.createElement("div");
    wrap.className = "no-lay";
    opts.container.appendChild(wrap);

    function setVal(key, v) {
      data[key] = v;
      if (opts.onChange) opts.onChange(key, v);
    }

    groups.forEach((g, gi) => {
      const grp = document.createElement("div");
      grp.className = "no-lay__group no-lay__group-cols-" + (g.columns || 2) + (g.collapsed ? " no-lay__group--collapsed" : "");
      grp.innerHTML = `
        <div class="no-lay__group-header">
          <span class="no-lay__group-toggle">▾</span>
          <span>${esc(g.title || "")}</span>
        </div>
        <div class="no-lay__group-body"></div>
      `;
      wrap.appendChild(grp);
      const body = grp.querySelector(".no-lay__group-body");
      grp.querySelector(".no-lay__group-header").onclick = () => grp.classList.toggle("no-lay__group--collapsed");

      (g.items || []).forEach(it => {
        if (it.type === "separator") {
          const s = document.createElement("div");
          s.className = "no-lay__separator";
          body.appendChild(s);
          return;
        }
        const item = document.createElement("div");
        item.className = "no-lay__item" + (it.full ? " no-lay__item--full" : it.span ? " no-lay__item--span-" + it.span : "");
        const labelHTML = it.type === "static"
          ? "" // static es full-width sin label
          : `<div class="no-lay__item-label ${it.required?'no-lay__item-label--required':''}">${esc(it.label || "")}</div>`;
        item.innerHTML = `
          ${labelHTML}
          <div class="no-lay__item-value"></div>
        `;
        const slot = item.querySelector(".no-lay__item-value");
        const cur = data[it.key] !== undefined ? data[it.key] : it.value;
        const ed = opts.editable !== false && !it.readonly;

        if (it.type === "static") {
          slot.style.gridColumn = "1 / -1";
          slot.innerHTML = `<div style="padding:3px 0;color:var(--text-muted);font-size:11px;">${esc(it.text || it.value || "")}</div>`;
        } else if (it.type === "select") {
          const sel = document.createElement("select");
          (it.options || []).forEach(o => {
            const op = document.createElement("option");
            op.value = typeof o === "string" ? o : o.value;
            op.textContent = typeof o === "string" ? o : o.label;
            if (cur !== undefined && String(cur) === String(op.value)) op.selected = true;
            sel.appendChild(op);
          });
          if (!ed) sel.disabled = true;
          sel.onchange = () => setVal(it.key, sel.value);
          slot.appendChild(sel);
        } else if (it.type === "switch") {
          const w = document.createElement("label");
          w.style.cssText = "display:flex;align-items:center;gap:6px;font-size:11px;";
          w.innerHTML = `<input type="checkbox" ${cur ? "checked" : ""} ${ed?"":"disabled"}><span>${cur ? "Sí" : "No"}</span>`;
          const cb = w.querySelector("input"); const lab = w.querySelector("span");
          cb.onchange = () => { lab.textContent = cb.checked ? "Sí" : "No"; setVal(it.key, cb.checked); };
          slot.appendChild(w);
        } else if (it.type === "textarea") {
          const ta = document.createElement("textarea");
          ta.rows = it.rows || 2;
          ta.value = cur || "";
          ta.placeholder = it.placeholder || "";
          if (!ed) ta.readOnly = true;
          ta.oninput = () => setVal(it.key, ta.value);
          slot.appendChild(ta);
        } else {
          const inp = document.createElement("input");
          inp.type = it.type === "money" || it.type === "number" ? "number"
                    : it.type === "date" ? "date"
                    : it.type === "password" ? "password"
                    : "text";
          inp.value = cur !== undefined && cur !== null ? cur : "";
          inp.placeholder = it.placeholder || "";
          if (!ed) inp.readOnly = true;
          inp.oninput = () => setVal(it.key, inp.value);
          slot.appendChild(inp);
        }
        body.appendChild(item);
      });
    });

    return {
      el: wrap,
      getData: () => Object.assign({}, data),
      destroy: () => wrap.remove()
    };
  }

  /* ============================================================
     EXPORT
     ============================================================ */
  window.NodoComponents.NavBar       = { create: navBarCreate };
  window.NodoComponents.TreeList     = { create: treeListCreate };
  window.NodoComponents.Alert        = { show: alertShow,
    success: (title, message, opts) => alertShow(Object.assign({ kind: "success", title, message }, opts || {})),
    warning: (title, message, opts) => alertShow(Object.assign({ kind: "warning", title, message }, opts || {})),
    danger:  (title, message, opts) => alertShow(Object.assign({ kind: "danger",  title, message }, opts || {})),
    info:    (title, message, opts) => alertShow(Object.assign({ title, message }, opts || {}))
  };
  window.NodoComponents.WaitForm     = { show: waitFormShow };
  window.NodoComponents.VerticalGrid = { create: verticalGridCreate };
  window.NodoComponents.Layout       = { create: layoutCreate };

  console.log("[NODO Shell] DevExpress components: NavBar, TreeList, Alert, WaitForm, VerticalGrid, Layout cargados.");
})();
