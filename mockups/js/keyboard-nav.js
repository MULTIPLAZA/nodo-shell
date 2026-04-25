/* ============================================================
   NODO Shell — Keyboard navigation (genérico, agnóstico al cliente)
   ============================================================
   - F1: ayuda (overlay con todos los atajos)
   - F2..F12: buscan [data-fkey="F2"] en el DOM y disparan click.
     Cada cliente solo agrega data-fkey="F2" a sus botones del ribbon.
     F5/F11/F12 NO se interceptan (browser reload/fullscreen/devtools).
   - Tab/Shift+Tab: foco entre botones (HTML nativo + :focus-visible)
   - Flechas/Home/End/PgUp/PgDn/Enter: navegan la grilla activa
   - Ctrl+F/N/E/S/P/Supr: acciones del módulo activo (vía data-act)

   Configuración opcional por aplicación:
     window.NODO_SHELL_CONFIG = {
       fkeyHints: { F2: "Tablero", F3: "Clientes", ... }   // texto en overlay help
     };
   ============================================================ */

(function () {
  "use strict";

  const CONFIG = window.NODO_SHELL_CONFIG || {};
  const F_HINTS = CONFIG.fkeyHints || {};

  /* ---------- Helpers ---------- */
  function activeWsPanel() { return document.querySelector('.ws-panel[data-active="true"]'); }
  function activeGridBody() {
    const panel = activeWsPanel();
    if (!panel) return null;
    return panel.querySelector('.grid tbody');
  }
  function isTypingTarget(target) {
    if (!target) return false;
    const tag = (target.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (target.isContentEditable) return true;
    return false;
  }

  /* ---------- Movimiento de selección en la grilla activa ---------- */
  function moveSelection(delta, abs) {
    const tbody = activeGridBody();
    if (!tbody) return false;
    const rows = Array.from(tbody.querySelectorAll('tr')).filter(r =>
      r.querySelectorAll('td').length > 0 &&
      !(r.children.length === 1 && r.children[0].colSpan > 1) &&
      r.style.display !== "none"
    );
    if (!rows.length) return false;
    const cur = tbody.querySelector('tr.is-selected');
    let i = cur ? rows.indexOf(cur) : -1;
    let next;
    if (abs === "first")     next = 0;
    else if (abs === "last") next = rows.length - 1;
    else if (i === -1)       next = delta > 0 ? 0 : rows.length - 1;
    else                     next = Math.max(0, Math.min(rows.length - 1, i + delta));
    if (next === i && cur) return true;
    if (cur) cur.classList.remove('is-selected');
    const nextRow = rows[next];
    nextRow.classList.add('is-selected');
    nextRow.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    nextRow.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  }

  function activateRow() {
    const tbody = activeGridBody();
    if (!tbody) return false;
    const cur = tbody.querySelector('tr.is-selected');
    if (!cur) return false;
    cur.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    return true;
  }

  /* ---------- F-keys: lookup dinámico en el DOM ---------- */
  // Cada cliente marca sus botones del ribbon con data-fkey="F2"
  // Apretar F2 dispara click() sobre el primer elemento encontrado.
  function triggerFKey(key) {
    const el = document.querySelector('[data-fkey="' + key + '"]');
    if (!el) return false;
    el.click();
    // Si el botón pide auto-foco en buscador (data-fkey-focus-search="true"),
    // dar tiempo al render del módulo y luego buscar el input
    if (el.dataset.fkeyFocusSearch === "true") {
      setTimeout(focusSearch, 80);
    }
    return true;
  }

  /* ---------- Help overlay (autodescubre las F-keys del DOM) ---------- */
  function discoverFKeys() {
    const out = {};
    document.querySelectorAll('[data-fkey]').forEach(el => {
      const k = el.dataset.fkey;
      if (!k || out[k]) return;
      // texto: prioridad data-title > .rb-btn-lg__label > textContent
      const label = el.dataset.title
                 || (el.querySelector('.rb-btn-lg__label') || {}).textContent
                 || el.textContent.trim();
      out[k] = (F_HINTS[k] || label || k).trim();
    });
    return out;
  }

  function buildHelpHTML() {
    const fkeys = discoverFKeys();
    const fkeyRows = Object.keys(fkeys).length === 0
      ? `<tr><td colspan="2" style="text-align:center;color:var(--text-muted);font-style:italic;padding:8px;">Sin F-keys configuradas en este sistema.<br>Agregá <code>data-fkey="F2"</code> a los botones del ribbon.</td></tr>`
      : Object.entries(fkeys).map(([k, label]) => `
          <tr><td><kbd>${k}</kbd></td><td>${escapeHtml(label)}</td></tr>
        `).join("");
    return `
      <div class="kbd-help__panel" role="dialog" aria-modal="true" aria-labelledby="kbd-help-title">
        <header>
          <h2 id="kbd-help-title">Atajos de teclado</h2>
          <button class="kbd-help__close" id="kbd-help-close" aria-label="Cerrar">✕</button>
        </header>
        <div class="kbd-help__body">

          <section>
            <h3>Módulos (F-keys)</h3>
            <table class="kbd-help__table"><tr><td><kbd>F1</kbd></td><td>Mostrar / ocultar esta ayuda</td></tr>${fkeyRows}</table>
          </section>

          <section>
            <h3>Navegación de tablas</h3>
            <table class="kbd-help__table">
              <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Fila anterior / siguiente</td></tr>
              <tr><td><kbd>PgUp</kbd> <kbd>PgDn</kbd></td><td>±10 filas</td></tr>
              <tr><td><kbd>Home</kbd> <kbd>End</kbd></td><td>Primera / última fila</td></tr>
              <tr><td><kbd>Enter</kbd></td><td>Abrir detalle (= doble click)</td></tr>
              <tr><td><kbd>Espacio</kbd></td><td>Igual que Enter</td></tr>
            </table>
          </section>

          <section>
            <h3>Acciones del módulo activo</h3>
            <table class="kbd-help__table">
              <tr><td><kbd>Ctrl</kbd>+<kbd>F</kbd></td><td>Foco en buscador</td></tr>
              <tr><td><kbd>Ctrl</kbd>+<kbd>N</kbd></td><td>Nuevo registro</td></tr>
              <tr><td><kbd>Ctrl</kbd>+<kbd>E</kbd></td><td>Editar seleccionado</td></tr>
              <tr><td><kbd>Ctrl</kbd>+<kbd>S</kbd></td><td>Guardar</td></tr>
              <tr><td><kbd>Ctrl</kbd>+<kbd>P</kbd></td><td>Imprimir</td></tr>
              <tr><td><kbd>Supr</kbd></td><td>Eliminar / Anular</td></tr>
            </table>
          </section>

          <section>
            <h3>Navegación general</h3>
            <table class="kbd-help__table">
              <tr><td><kbd>Tab</kbd> / <kbd>⇧</kbd>+<kbd>Tab</kbd></td><td>Foco al siguiente / anterior elemento</td></tr>
              <tr><td><kbd>Alt</kbd>+<kbd>letra</kbd></td><td>Cambiar tab del ribbon (la letra subrayada)</td></tr>
              <tr><td><kbd>Ctrl</kbd>+<kbd>Tab</kbd></td><td>Siguiente módulo abierto (Shift = anterior)</td></tr>
              <tr><td><kbd>Esc</kbd></td><td>Cerrar overlay / panel / tab activo</td></tr>
            </table>
          </section>

        </div>
        <footer>
          Presioná <kbd>F1</kbd> o <kbd>Esc</kbd> para cerrar.
        </footer>
      </div>
    `;
  }

  function showHelp() {
    let bg = document.getElementById("kbd-help-bg");
    if (bg) {
      // re-render por si las F-keys del DOM cambiaron desde la última apertura
      bg.innerHTML = buildHelpHTML();
      bg.querySelector("#kbd-help-close").addEventListener("click", hideHelp);
      bg.classList.add("is-open");
      return;
    }
    bg = document.createElement("div");
    bg.id = "kbd-help-bg";
    bg.className = "kbd-help is-open";
    bg.innerHTML = buildHelpHTML();
    document.body.appendChild(bg);
    bg.addEventListener("click", e => { if (e.target === bg) hideHelp(); });
    bg.querySelector("#kbd-help-close").addEventListener("click", hideHelp);
  }
  function hideHelp() {
    const bg = document.getElementById("kbd-help-bg");
    if (bg) bg.classList.remove("is-open");
  }
  function toggleHelp() {
    const bg = document.getElementById("kbd-help-bg");
    if (bg && bg.classList.contains("is-open")) hideHelp();
    else showHelp();
  }
  function isHelpOpen() {
    const bg = document.getElementById("kbd-help-bg");
    return bg && bg.classList.contains("is-open");
  }

  /* ---------- Ctrl combos por módulo activo ---------- */
  function clickFirst(selectors) {
    const panel = activeWsPanel();
    if (!panel) return false;
    for (const sel of selectors) {
      const el = panel.querySelector(sel);
      if (el) { el.click(); return true; }
    }
    return false;
  }
  function focusSearch() {
    const panel = activeWsPanel();
    if (!panel) return false;
    const inp = panel.querySelector('[data-role^="search"], .tb-search input');
    if (inp) { inp.focus(); inp.select && inp.select(); return true; }
    return false;
  }

  /* ---------- Listener principal ---------- */
  document.addEventListener("keydown", function (e) {
    // Si la ayuda está abierta: solo F1 o Esc la cierran
    if (isHelpOpen()) {
      if (e.key === "F1" || e.key === "Escape") {
        e.preventDefault();
        hideHelp();
      }
      return;
    }

    // F1 = help (siempre, incluso escribiendo en input)
    if (e.key === "F1") { e.preventDefault(); toggleHelp(); return; }

    // F2..F12 (excepto F5/F11/F12 que no se interceptan)
    const FKEYS_RESERVED = { F5: 1, F11: 1, F12: 1 };
    if (/^F\d{1,2}$/.test(e.key) && !FKEYS_RESERVED[e.key]) {
      if (triggerFKey(e.key)) {
        e.preventDefault();
        return;
      }
      // si no hay binding en el DOM, dejamos que el browser haga lo suyo
    }

    const inInput = isTypingTarget(e.target);

    // Ctrl + combos
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
      const k = e.key.toLowerCase();
      if (k === "f") { e.preventDefault(); focusSearch(); return; }
      if (k === "n") { e.preventDefault(); clickFirst(['[data-act="nuevo"]','[data-act="nueva"]']); return; }
      if (k === "e") { e.preventDefault(); clickFirst(['[data-act="editar"]','[data-act="ver"]']); return; }
      if (k === "s") { e.preventDefault(); clickFirst(['[data-act="guardar"]','.btn--primary']); return; }
      if (k === "p") { e.preventDefault(); clickFirst(['[data-act="imprimir"]','[data-act="imprimir-int"]']); return; }
    }

    // Si NO estoy escribiendo, navegación de grilla
    if (!inInput) {
      switch (e.key) {
        case "ArrowDown":  if (moveSelection(1))         e.preventDefault(); return;
        case "ArrowUp":    if (moveSelection(-1))        e.preventDefault(); return;
        case "PageDown":   if (moveSelection(10))        e.preventDefault(); return;
        case "PageUp":     if (moveSelection(-10))       e.preventDefault(); return;
        case "Home":       if (moveSelection(0,"first")) e.preventDefault(); return;
        case "End":        if (moveSelection(0,"last"))  e.preventDefault(); return;
        case "Enter":      if (activateRow())            e.preventDefault(); return;
        case " ":          if (activateRow())            e.preventDefault(); return;
        case "Delete":     if (clickFirst(['[data-act="eliminar"]','[data-act="anular"]'])) e.preventDefault(); return;
      }
    }
  }, true);

  /* ---------- Indicador visual: marca cuando el teclado está activo ---------- */
  document.addEventListener("focusin", e => {
    if (e.target.closest('.ws-panel')) document.body.classList.add('kbd-active');
  });
  document.addEventListener("focusout", e => {
    if (!document.activeElement || document.activeElement === document.body) {
      document.body.classList.remove('kbd-active');
    }
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // Exponer API
  window.NodoKeyboard = {
    showHelp, hideHelp, toggleHelp,
    triggerFKey, moveSelection, activateRow,
    discoverFKeys
  };

  console.log("[NODO Shell · keyboard-nav] activo. Presioná F1 para ver atajos.");
})();
