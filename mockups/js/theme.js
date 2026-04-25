/* ============================================================
   Theme switcher — aplica data-theme="X" al <html> y persiste
   la preferencia en localStorage.
   Para sumar un tema: registrarlo en THEMES + agregar bloque
   [data-theme="X"] en styles/themes.css.
   ============================================================ */

(function () {
  "use strict";

  // Cada cliente puede sobreescribir esta key antes de cargar el script
  // para que la preferencia sea por-aplicación (ej: "taller-jordan.theme",
  // "multicompra.theme"). Si no se setea, usa la genérica del shell.
  const STORAGE_KEY = (window.NODO_SHELL_CONFIG && window.NODO_SHELL_CONFIG.themeStorageKey) || "nodo-shell.theme";

  const THEMES = [
    {
      id: "office2010",
      label: "Office 2010 Blue",
      hint: "Clásico Microsoft — gradientes plata + azul",
      swatch: "linear-gradient(90deg,#cad3de 0%,#0a4c82 100%)",
      dot: "#1e6bb0"
    },
    {
      id: "bloomberg",
      label: "Bloomberg Pro",
      hint: "Charcoal + dorado/cobre apagado (mismos gradientes Office)",
      swatch: "linear-gradient(90deg,#2a2a2a 0%,#3a3a3a 40%,#b8761a 70%,#d4a76a 100%)",
      dot: "#d4a76a"
    },
    {
      id: "slate",
      label: "Slate Operational",
      hint: "Verde pizarra + gris frío — logística y stock, jornada larga",
      swatch: "linear-gradient(90deg,#c8d8de 0%,#eaf4ef 40%,#52b788 70%,#1b4332 100%)",
      dot: "#2d6a4f"
    }
  ];

  // ---- Aplicar tema ----
  function applyTheme(id) {
    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    document.documentElement.setAttribute("data-theme", theme.id);
    try { localStorage.setItem(STORAGE_KEY, theme.id); } catch (e) {}
    // Notificar a quien quiera escuchar
    window.dispatchEvent(new CustomEvent("themechange", { detail: { id: theme.id } }));
    return theme;
  }

  function currentTheme() {
    let id = null;
    try { id = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    return THEMES.find(t => t.id === id) || THEMES[0];
  }

  // ---- Aplicar al cargar (lo antes posible para evitar flash) ----
  applyTheme(currentTheme().id);

  // ---- Construir UI del switcher ----
  function buildSwitcher() {
    const qat = document.querySelector(".qat");
    if (!qat) return;

    // Insertarlo antes del dropdown de personalización (último botón) para que quede a la derecha
    const wrap = document.createElement("div");
    wrap.className = "theme-switcher";
    wrap.id = "theme-switcher";

    const cur = currentTheme();
    wrap.innerHTML = `
      <button class="theme-switcher__btn" id="theme-switcher-btn" title="Cambiar tema visual" aria-haspopup="true" aria-expanded="false">
        <span class="theme-switcher__dot" id="theme-switcher-dot" style="background:${cur.dot};"></span>
        <span id="theme-switcher-label">Tema: ${escapeHtml(cur.label)}</span>
        <svg viewBox="0 0 8 8" width="8" height="8" style="opacity:0.7;"><path d="M0 2l4 4 4-4z" fill="currentColor"/></svg>
      </button>
      <div class="theme-switcher__menu" id="theme-switcher-menu" role="menu">
        <div style="padding:6px 10px 4px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">
          Elegir tema visual
        </div>
        ${THEMES.map(t => `
          <button class="theme-switcher__option" data-theme-id="${t.id}" aria-selected="${t.id === cur.id ? 'true' : 'false'}" role="menuitem">
            <span class="theme-switcher__swatch" style="background:${t.swatch};"></span>
            <span style="display:flex;flex-direction:column;align-items:flex-start;gap:1px;line-height:1.2;">
              <span>${escapeHtml(t.label)}</span>
              <span style="font-size:10px;opacity:0.7;font-weight:normal;">${escapeHtml(t.hint)}</span>
            </span>
            <span class="theme-switcher__check">✓</span>
          </button>
        `).join("")}
        <div style="padding:6px 10px;font-size:10px;color:#888;border-top:1px solid currentColor;border-color:rgba(127,127,127,0.3);margin-top:4px;">
          La preferencia se guarda en este equipo.
        </div>
      </div>
    `;

    // Insertar antes del dropdown final (icono ▾ de personalizar QAT)
    const customDropdown = qat.querySelector(".qat__dropdown");
    if (customDropdown) {
      qat.insertBefore(wrap, customDropdown);
    } else {
      qat.appendChild(wrap);
    }

    // ---- Wiring ----
    const btn = wrap.querySelector("#theme-switcher-btn");
    const menu = wrap.querySelector("#theme-switcher-menu");

    function toggle(open) {
      const next = open !== undefined ? open : !wrap.classList.contains("theme-switcher--open");
      wrap.classList.toggle("theme-switcher--open", next);
      btn.setAttribute("aria-expanded", String(next));
    }
    function close() { toggle(false); }

    btn.addEventListener("click", e => { e.stopPropagation(); toggle(); });
    document.addEventListener("click", e => {
      if (!wrap.contains(e.target)) close();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && wrap.classList.contains("theme-switcher--open")) {
        close();
        e.stopPropagation();
      }
    });

    wrap.querySelectorAll(".theme-switcher__option").forEach(opt => {
      opt.addEventListener("click", e => {
        e.stopPropagation();
        const id = opt.dataset.themeId;
        applyTheme(id);
        // Refrescar UI del switcher
        wrap.querySelectorAll(".theme-switcher__option").forEach(o =>
          o.setAttribute("aria-selected", o.dataset.themeId === id ? "true" : "false")
        );
        const t = THEMES.find(x => x.id === id);
        if (t) {
          wrap.querySelector("#theme-switcher-dot").style.background = t.dot;
          wrap.querySelector("#theme-switcher-label").textContent = "Tema: " + t.label;
        }
        close();
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---- Init cuando el DOM esté listo ----
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildSwitcher);
  } else {
    buildSwitcher();
  }

  // Exponer API simple
  window.NodoTheme = { apply: applyTheme, current: currentTheme, list: () => THEMES.slice() };
})();
