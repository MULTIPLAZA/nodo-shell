/* ============================================================
   ERP Lite Web — Shell controller
   - Tab switching del ribbon
   - Apertura / cierre de módulos en el workspace (MDI emulado)
   - Atajos de teclado: Alt+letra, Esc, Ctrl+Tab
   ============================================================ */

(function () {
  "use strict";

  // ---------- Ribbon tab switching ----------
  const ribbonTabs = document.querySelectorAll(".ribbon-tab");
  const ribbonPanels = document.querySelectorAll(".ribbon-panel");

  function activateRibbonTab(tabName) {
    ribbonTabs.forEach((t) => {
      t.setAttribute("aria-selected", t.dataset.tab === tabName ? "true" : "false");
    });
    ribbonPanels.forEach((p) => {
      if (p.dataset.panel === tabName) p.setAttribute("data-active", "true");
      else p.removeAttribute("data-active");
    });
  }

  ribbonTabs.forEach((tab) => {
    tab.addEventListener("click", () => activateRibbonTab(tab.dataset.tab));
  });

  // ---------- Workspace (MDI emulado) ----------
  const wsTabsEl = document.getElementById("ws-tabs");
  const wsContent = document.getElementById("ws-content");
  const wsEmpty = document.getElementById("ws-empty");

  /** @type {Map<string, {label:string, icon:string}>} */
  const openModules = new Map();
  let activeModuleId = null;

  function moduleLabelFor(id, fallbackEl) {
    const el = fallbackEl || document.querySelector(`[data-open="${id}"]`);
    if (!el) return id;
    const title = el.dataset.title;
    if (title) return title;
    const lg = el.querySelector(".rb-btn-lg__label");
    if (lg) return lg.textContent.trim();
    const smTxt = el.textContent.trim();
    return smTxt || id;
  }

  function moduleIconFor(id, fallbackEl) {
    const el = fallbackEl || document.querySelector(`[data-open="${id}"]`);
    if (!el) return null;
    const svg = el.querySelector("svg");
    return svg ? svg.outerHTML : null;
  }

  function openModule(id, sourceEl) {
    if (!id) return;
    if (openModules.has(id)) {
      setActiveModule(id);
      return;
    }
    const label = moduleLabelFor(id, sourceEl);
    const icon = moduleIconFor(id, sourceEl);
    openModules.set(id, { label, icon });

    // Crear tab del workspace
    const tab = document.createElement("div");
    tab.className = "ws-tab";
    tab.setAttribute("role", "tab");
    tab.dataset.moduleId = id;
    tab.innerHTML = `
      <span class="ws-tab__icon">${icon || ""}</span>
      <span class="ws-tab__label">${escapeHtml(label)}</span>
      <button class="ws-tab__close" title="Cerrar" aria-label="Cerrar">✕</button>
    `;
    tab.addEventListener("click", (e) => {
      if (e.target.closest(".ws-tab__close")) return;
      setActiveModule(id);
    });
    tab.querySelector(".ws-tab__close").addEventListener("click", (e) => {
      e.stopPropagation();
      closeModule(id);
    });
    wsTabsEl.appendChild(tab);

    // Crear panel de contenido
    const panel = document.createElement("section");
    panel.className = "ws-panel";
    panel.dataset.moduleId = id;
    wsContent.appendChild(panel);
    renderModule(panel, id, label);

    setActiveModule(id);
  }

  function setActiveModule(id) {
    activeModuleId = id;
    wsEmpty.style.display = "none";

    wsTabsEl.querySelectorAll(".ws-tab").forEach((t) => {
      t.setAttribute("aria-selected", t.dataset.moduleId === id ? "true" : "false");
    });
    wsContent.querySelectorAll(".ws-panel").forEach((p) => {
      if (p.dataset.moduleId === id) p.setAttribute("data-active", "true");
      else p.removeAttribute("data-active");
    });
  }

  function closeModule(id) {
    openModules.delete(id);
    const tab = wsTabsEl.querySelector(`.ws-tab[data-module-id="${id}"]`);
    const panel = wsContent.querySelector(`.ws-panel[data-module-id="${id}"]`);
    if (tab) tab.remove();
    if (panel) panel.remove();

    if (activeModuleId === id) {
      const remaining = Array.from(openModules.keys());
      if (remaining.length) {
        setActiveModule(remaining[remaining.length - 1]);
      } else {
        activeModuleId = null;
        wsEmpty.style.display = "flex";
      }
    }
  }

  function renderModulePlaceholder(id, label) {
    return `
      <div class="ws-panel__header">
        <h1 class="ws-panel__title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>
          ${escapeHtml(label)}
        </h1>
        <div>
          <button class="btn">Guardar (Ctrl+S)</button>
          <button class="btn btn--primary">Nuevo (Ctrl+N)</button>
        </div>
      </div>
      <div class="ws-panel__placeholder">
        <strong>Módulo: ${escapeHtml(label)}</strong><br>
        <span style="opacity:0.8">Mockup del módulo pendiente. Cuando decidas por cuál empezar, pediselo a <code>@ErpLiteUX</code>.</span>
        <br><br>
        <span style="font-size:11px; opacity:0.7">ID interno: <code>${escapeHtml(id)}</code></span>
      </div>
    `;
  }

  function renderModule(panel, id, label) {
    // Si hay un módulo registrado, lo invocamos en pantalla completa. Si no, placeholder.
    if (window.MODULOS && typeof window.MODULOS[id] === "function") {
      try {
        panel.classList.add("ws-panel--full");
        window.MODULOS[id](panel);
        return;
      } catch (err) {
        console.error("[modulo " + id + "] error al renderizar:", err);
      }
    }
    panel.innerHTML = renderModulePlaceholder(id, label);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // Delegar clicks en botones [data-open] del ribbon
  document.querySelector(".ribbon-body").addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (!opener) return;
    openModule(opener.dataset.open, opener);
  });

  // ---------- Atajos de teclado ----------
  const altMap = {
    "i": "inicio",
    "v": "inventario",   // INVENTARIO (primera letra única disponible)
    "p": "proveedores",
    "c": "clientes",
    "o": "operativo",
    "t": "tesoreria",
    "b": "contabilidad", // contaBilidad (C ya ocupado)
    "s": "seguridad",
    "h": "rrhh",
    "r": "reportes"
  };

  document.addEventListener("keydown", (e) => {
    // Alt: resaltar letras clave
    if (e.key === "Alt") {
      document.body.classList.add("alt-mode");
    }
    // Alt+letra → cambiar tab del ribbon
    if (e.altKey && !e.ctrlKey && !e.shiftKey) {
      const k = e.key.toLowerCase();
      if (altMap[k]) {
        e.preventDefault();
        activateRibbonTab(altMap[k]);
      }
    }
    // Esc → cerrar tab activo del workspace
    if (e.key === "Escape" && activeModuleId) {
      e.preventDefault();
      closeModule(activeModuleId);
    }
    // Ctrl+Tab → siguiente tab del workspace
    if (e.ctrlKey && e.key === "Tab" && openModules.size > 1) {
      e.preventDefault();
      const ids = Array.from(openModules.keys());
      const i = ids.indexOf(activeModuleId);
      const next = e.shiftKey
        ? ids[(i - 1 + ids.length) % ids.length]
        : ids[(i + 1) % ids.length];
      setActiveModule(next);
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Alt") {
      document.body.classList.remove("alt-mode");
    }
  });

  // Click derecho en tab del workspace → menú contextual simple (futuro)
  wsTabsEl.addEventListener("contextmenu", (e) => {
    const tab = e.target.closest(".ws-tab");
    if (!tab) return;
    e.preventDefault();
    // TODO: menú contextual (cerrar, cerrar otros, cerrar todos)
  });

  console.log("[NODO Shell] inicializado.");

  // Soporte ?modulo=clientes en URL (para shortcuts del PWA)
  const params = new URLSearchParams(location.search);
  const moduloParam = params.get("modulo");
  if (moduloParam) {
    const btn = document.querySelector(`[data-open="${moduloParam}"]`);
    if (btn) openModule(moduloParam, btn);
  } else if (window.MODULOS && window.MODULOS.clientes) {
    // Default: abrir Clientes en el primer ingreso para mostrar la base
    const clientesBtn = document.querySelector('[data-open="clientes"]');
    if (clientesBtn) openModule("clientes", clientesBtn);
  }

  // PWA: capturar evento beforeinstallprompt para botón "Instalar"
  let deferredInstall = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e;
    showInstallButton();
  });

  function showInstallButton() {
    if (document.getElementById("pwa-install-btn")) return;
    const btn = document.createElement("button");
    btn.id = "pwa-install-btn";
    btn.className = "qat__btn";
    btn.title = "Instalar como aplicación";
    btn.innerHTML = `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M7 1h2v7h2L8 12 5 8h2V1zM2 13h12v2H2v-2z"/></svg>`;
    btn.style.cssText = "width:auto;padding:0 6px;gap:4px;color:var(--ofc-blue-700);font-weight:600;font-size:11px;";
    btn.innerHTML += "Instalar app";
    btn.addEventListener("click", async () => {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      const { outcome } = await deferredInstall.userChoice;
      console.log("[PWA] install:", outcome);
      deferredInstall = null;
      btn.remove();
    });
    document.querySelector(".qat").appendChild(btn);
  }
})();
