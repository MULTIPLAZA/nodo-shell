/* ============================================================
   NODO Shell — Components: Wizard, Kanban, TreeView
   ============================================================
   API:
     NodoComponents.Wizard.create({ container, steps, onComplete, onCancel })
     NodoComponents.Kanban.create({ container, columns, cards, onMove, onCardClick, title })
     NodoComponents.TreeView.create({ container, nodes, onSelect, onExpand })
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

  /* ============================================================
     WIZARD
     ============================================================
     steps: [{ id, label, sub?, render(panel, ctx)?, validate(ctx)?:bool|string }]
     onComplete(ctx) — al pasar el último paso
     onCancel()
     onChange(stepId, ctx)
     initialIndex (default 0), data: ctx inicial
     ============================================================ */
  function wizardCreate(opts) {
    const steps = opts.steps || [];
    const ctx = opts.data ? Object.assign({}, opts.data) : {};
    let idx = Math.max(0, Math.min(steps.length - 1, opts.initialIndex || 0));
    const completed = new Set();

    const wrap = document.createElement("div");
    wrap.className = "no-wiz";
    wrap.innerHTML = `
      <div class="no-wiz__steps" role="tablist"></div>
      <div class="no-wiz__body" data-role="body"></div>
      <div class="no-wiz__footer">
        <span class="no-wiz__progress" data-role="progress"></span>
        <button class="btn" data-act="cancel">Cancelar</button>
        <button class="btn" data-act="back">‹ Anterior</button>
        <button class="btn btn--primary" data-act="next">Siguiente ›</button>
      </div>
    `;
    opts.container.appendChild(wrap);

    const stepsEl = wrap.querySelector(".no-wiz__steps");
    const bodyEl  = wrap.querySelector('[data-role="body"]');
    const progEl  = wrap.querySelector('[data-role="progress"]');
    const btnBack = wrap.querySelector('[data-act="back"]');
    const btnNext = wrap.querySelector('[data-act="next"]');
    const btnCancel = wrap.querySelector('[data-act="cancel"]');

    function renderSteps() {
      stepsEl.innerHTML = steps.map((s, i) => {
        const isActive = i === idx;
        const isDone = completed.has(s.id);
        const cls = ["no-wiz__step",
                     isActive && "no-wiz__step--active",
                     isDone && !isActive && "no-wiz__step--done",
                     (i < idx || isDone) && "no-wiz__step--clickable"].filter(Boolean).join(" ");
        return `<div class="${cls}" data-i="${i}" role="tab">
          <span class="no-wiz__step-num">${isDone && !isActive ? "✓" : (i+1)}</span>
          <div class="no-wiz__step-label">${esc(s.label)}${s.sub ? `<span class="no-wiz__step-sub">${esc(s.sub)}</span>` : ""}</div>
        </div>`;
      }).join("");
      stepsEl.querySelectorAll(".no-wiz__step--clickable").forEach(el => {
        el.onclick = () => goTo(Number(el.dataset.i));
      });
    }

    function renderBody() {
      bodyEl.innerHTML = "";
      const s = steps[idx];
      if (s && typeof s.render === "function") {
        try { s.render(bodyEl, ctx); }
        catch (e) {
          console.error("[Wizard step render]", e);
          bodyEl.innerHTML = `<div style="color:var(--danger);">Error al renderizar paso: ${esc(e.message)}</div>`;
        }
      } else if (s) {
        bodyEl.innerHTML = `<div style="color:var(--text-muted);font-style:italic;">${esc(s.label)} — sin render configurado</div>`;
      }
    }

    function renderFooter() {
      progEl.textContent = `Paso ${idx + 1} de ${steps.length}`;
      btnBack.disabled = idx === 0;
      btnNext.textContent = idx === steps.length - 1 ? "✓ Finalizar" : "Siguiente ›";
    }

    function goTo(newIdx) {
      if (newIdx < 0 || newIdx >= steps.length) return;
      idx = newIdx;
      renderSteps();
      renderBody();
      renderFooter();
      if (opts.onChange) opts.onChange(steps[idx].id, ctx);
    }

    function next() {
      const s = steps[idx];
      if (s && typeof s.validate === "function") {
        const r = s.validate(ctx);
        if (r !== true) {
          if (window.NodoComponents.Toast) window.NodoComponents.Toast.warning(typeof r === "string" ? r : "El paso tiene errores");
          return;
        }
      }
      completed.add(s.id);
      if (idx === steps.length - 1) {
        if (opts.onComplete) opts.onComplete(ctx);
        return;
      }
      goTo(idx + 1);
    }
    function back() { goTo(idx - 1); }

    btnNext.onclick = next;
    btnBack.onclick = back;
    btnCancel.onclick = () => { if (opts.onCancel) opts.onCancel(); };

    renderSteps(); renderBody(); renderFooter();

    return {
      el: wrap,
      goTo, next, back,
      getCtx: () => ctx,
      setCtx: (k, v) => { ctx[k] = v; },
      destroy: () => wrap.remove()
    };
  }

  /* ============================================================
     KANBAN
     ============================================================
     columns: [{ id, title, color? }]
     cards:   [{ id, columnId, title, subtitle?, color?, tag?, ...meta }]
     onMove(card, fromColId, toColId)
     onCardClick(card)
     title: opcional, va arriba del board
     ============================================================ */
  function kanbanCreate(opts) {
    const columns = (opts.columns || []).slice();
    let cards = (opts.cards || []).slice();

    const wrap = document.createElement("div");
    wrap.className = "no-kan";
    wrap.innerHTML = `
      ${opts.title ? `<div class="no-kan__toolbar"><div class="no-kan__title">${esc(opts.title)}</div></div>` : ""}
      <div class="no-kan__board" data-role="board"></div>
    `;
    opts.container.appendChild(wrap);
    const board = wrap.querySelector('[data-role="board"]');

    function render() {
      board.innerHTML = columns.map(col => {
        const colCards = cards.filter(c => c.columnId === col.id);
        return `
          <div class="no-kan__col" data-col="${esc(col.id)}">
            <div class="no-kan__col-header" ${col.color ? `style="border-top-color:${esc(col.color)};"` : ''}>
              ${col.color ? `<span class="no-kan__col-color" style="background:${esc(col.color)};"></span>` : ''}
              <span>${esc(col.title)}</span>
              <span class="no-kan__col-count">${colCards.length}</span>
            </div>
            <div class="no-kan__col-body" data-drop="${esc(col.id)}">
              ${colCards.map(card => renderCard(card)).join("")}
            </div>
          </div>
        `;
      }).join("");

      // Drag & drop wiring
      board.querySelectorAll(".no-kan__card").forEach(cardEl => {
        cardEl.draggable = true;
        cardEl.addEventListener("dragstart", e => {
          cardEl.classList.add("is-dragging");
          e.dataTransfer.setData("text/plain", cardEl.dataset.id);
          e.dataTransfer.effectAllowed = "move";
        });
        cardEl.addEventListener("dragend", () => cardEl.classList.remove("is-dragging"));
        cardEl.addEventListener("click", () => {
          const card = cards.find(c => String(c.id) === cardEl.dataset.id);
          if (card && opts.onCardClick) opts.onCardClick(card);
        });
      });
      board.querySelectorAll(".no-kan__col-body").forEach(body => {
        body.addEventListener("dragover", e => {
          e.preventDefault();
          body.classList.add("no-kan__col-body--drop-target");
        });
        body.addEventListener("dragleave", () => body.classList.remove("no-kan__col-body--drop-target"));
        body.addEventListener("drop", e => {
          e.preventDefault();
          body.classList.remove("no-kan__col-body--drop-target");
          const id = e.dataTransfer.getData("text/plain");
          const card = cards.find(c => String(c.id) === id);
          if (!card) return;
          const fromColId = card.columnId;
          const toColId = body.dataset.drop;
          if (fromColId === toColId) return;
          card.columnId = toColId;
          if (opts.onMove) opts.onMove(card, fromColId, toColId);
          render();
        });
      });
    }

    function renderCard(card) {
      const left = card.color ? `style="border-left-color:${esc(card.color)};"` : "";
      return `
        <div class="no-kan__card" data-id="${esc(card.id)}" ${left}>
          <div class="no-kan__card-title">${esc(card.title)}</div>
          ${card.subtitle ? `<div class="no-kan__card-sub">${esc(card.subtitle)}</div>` : ""}
          ${(card.tag || card.meta) ? `<div class="no-kan__card-meta">
            ${card.tag ? `<span class="no-kan__card-tag">${esc(card.tag)}</span>` : ""}
            ${card.meta ? `<span>${esc(card.meta)}</span>` : ""}
          </div>` : ""}
        </div>
      `;
    }

    render();
    return {
      el: wrap,
      refresh: render,
      setCards: (newCards) => { cards = newCards.slice(); render(); },
      addCard: (card) => { cards.push(card); render(); },
      moveCard: (id, toColId) => { const c = cards.find(x => String(x.id)===String(id)); if (c) { c.columnId = toColId; render(); } },
      removeCard: (id) => { cards = cards.filter(x => String(x.id)!==String(id)); render(); },
      getCards: () => cards.slice(),
      destroy: () => wrap.remove()
    };
  }

  /* ============================================================
     TREE VIEW
     ============================================================
     nodes: [{ id, label, icon?, badge?, expanded?, children: [] }]
     onSelect(node)
     onExpand(node, isExpanded)
     ============================================================ */
  function treeViewCreate(opts) {
    const nodes = (opts.nodes || []).slice();
    let selectedId = null;

    const wrap = document.createElement("div");
    wrap.className = "no-tree";
    opts.container.appendChild(wrap);

    function render() {
      wrap.innerHTML = renderUL(nodes);
      wireEvents();
    }
    function renderUL(arr) {
      return `<ul>${arr.map(renderNode).join("")}</ul>`;
    }
    function renderNode(n) {
      const hasChildren = n.children && n.children.length > 0;
      const expanded = n.expanded === undefined ? false : n.expanded;
      const sel = selectedId === n.id;
      const cls = ["no-tree__node",
                   !hasChildren && "no-tree__node--leaf",
                   hasChildren && (expanded ? "no-tree__node--expanded" : "no-tree__node--collapsed")
                  ].filter(Boolean).join(" ");
      return `
        <li>
          <div class="${cls}" data-id="${esc(n.id)}" aria-selected="${sel}">
            <span class="no-tree__toggle">▶</span>
            ${n.icon ? `<span class="no-tree__icon">${n.icon}</span>` : ''}
            <span class="no-tree__label">${esc(n.label)}</span>
            ${n.badge !== undefined ? `<span class="no-tree__badge">${esc(n.badge)}</span>` : ""}
          </div>
          ${hasChildren ? `<div class="no-tree__children" ${expanded ? '' : 'style="display:none;"'}>${renderUL(n.children)}</div>` : ""}
        </li>
      `;
    }

    function findNode(id, arr) {
      arr = arr || nodes;
      for (const n of arr) {
        if (String(n.id) === String(id)) return n;
        if (n.children) { const r = findNode(id, n.children); if (r) return r; }
      }
      return null;
    }

    function wireEvents() {
      wrap.querySelectorAll(".no-tree__node").forEach(el => {
        const node = findNode(el.dataset.id);
        if (!node) return;
        el.querySelector(".no-tree__toggle").onclick = (e) => {
          e.stopPropagation();
          if (!node.children || node.children.length === 0) return;
          node.expanded = !node.expanded;
          if (opts.onExpand) opts.onExpand(node, !!node.expanded);
          render();
        };
        el.onclick = (e) => {
          if (e.target.closest(".no-tree__toggle")) return;
          selectedId = node.id;
          if (opts.onSelect) opts.onSelect(node);
          // Si es padre y está cerrado, abrirlo al click
          if (node.children && node.children.length > 0 && !node.expanded) {
            node.expanded = true;
            if (opts.onExpand) opts.onExpand(node, true);
          }
          render();
        };
      });
    }

    render();
    return {
      el: wrap,
      refresh: render,
      setNodes: (newNodes) => { nodes.splice(0, nodes.length, ...newNodes); render(); },
      expandAll: () => { walkNodes(nodes, n => { if (n.children) n.expanded = true; }); render(); },
      collapseAll: () => { walkNodes(nodes, n => { n.expanded = false; }); render(); },
      select: (id) => { selectedId = id; render(); },
      getSelected: () => selectedId !== null ? findNode(selectedId) : null,
      destroy: () => wrap.remove()
    };
  }
  function walkNodes(arr, fn) { arr.forEach(n => { fn(n); if (n.children) walkNodes(n.children, fn); }); }

  window.NodoComponents.Wizard = { create: wizardCreate };
  window.NodoComponents.Kanban = { create: kanbanCreate };
  window.NodoComponents.TreeView = { create: treeViewCreate };

  console.log("[NODO Shell] NodoComponents.Wizard / Kanban / TreeView cargados.");
})();
