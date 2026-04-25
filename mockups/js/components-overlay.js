/* ============================================================
   NODO Shell — Overlays: Modal, Toast, DocumentViewer
   ============================================================
   API:
     NodoComponents.Modal.open({ title, body, footer, kind, size, onClose })
     NodoComponents.Modal.alert({ title, message, kind })   → Promise
     NodoComponents.Modal.confirm({ title, message, kind }) → Promise<boolean>
     NodoComponents.Modal.close()

     NodoComponents.Toast.show({ title, message, kind, duration })
     NodoComponents.Toast.success(message)
     NodoComponents.Toast.warning(message)
     NodoComponents.Toast.danger(message)
     NodoComponents.Toast.info(message)

     NodoComponents.DocumentViewer.open({ url, type, title })
       type: "pdf" | "image" | "iframe"
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
     MODAL
     ============================================================ */
  let activeModal = null;

  function modalOpen(opts) {
    closeModal(); // solo uno a la vez
    const kind = opts.kind || ""; // warning | danger | success | ""
    const size = opts.size || "";  // lg | sm | ""
    const bg = document.createElement("div");
    bg.className = "no-modal-bg";
    const iconSVG = (() => {
      if (kind === "warning") return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 22h22L12 2zm0 6l7.5 13H4.5L12 8zm-1 4v5h2v-5h-2zm0 6v2h2v-2h-2z"/></svg>`;
      if (kind === "danger")  return `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="2"/></svg>`;
      if (kind === "success") return `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 12l3 3 7-7" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>`;
      return `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="8" r="1.2" fill="currentColor"/><path d="M12 11v7" stroke="currentColor" stroke-width="2"/></svg>`;
    })();

    bg.innerHTML = `
      <div class="no-modal ${size?'no-modal--'+size:''} ${kind?'no-modal--'+kind:''}" role="dialog" aria-modal="true">
        <header class="no-modal__header">
          <span class="no-modal__icon ${kind?'no-modal__icon--'+kind:''}">${iconSVG}</span>
          <h3 class="no-modal__title">${esc(opts.title || "")}</h3>
          <button class="no-modal__close" data-act="close" aria-label="Cerrar">✕</button>
        </header>
        <div class="no-modal__body">${typeof opts.body === "string" ? opts.body : ""}</div>
        <footer class="no-modal__footer">${opts.footer || ""}</footer>
      </div>
    `;
    document.body.appendChild(bg);
    requestAnimationFrame(() => bg.classList.add("is-open"));
    if (typeof opts.body !== "string" && opts.body instanceof HTMLElement) {
      bg.querySelector(".no-modal__body").innerHTML = "";
      bg.querySelector(".no-modal__body").appendChild(opts.body);
    }
    bg.addEventListener("click", e => { if (e.target === bg) closeModal(); });
    bg.querySelector('[data-act="close"]').addEventListener("click", closeModal);
    function escHandler(e) { if (e.key === "Escape") closeModal(); }
    document.addEventListener("keydown", escHandler);

    activeModal = {
      el: bg,
      close: () => {
        document.removeEventListener("keydown", escHandler);
        bg.remove();
        activeModal = null;
        if (opts.onClose) opts.onClose();
      },
      footer: bg.querySelector(".no-modal__footer"),
      body: bg.querySelector(".no-modal__body")
    };
    return activeModal;
  }
  function closeModal() {
    if (activeModal) activeModal.close();
  }
  function alertModal(opts) {
    return new Promise(resolve => {
      const m = modalOpen({
        title: opts.title || "Aviso",
        body: `<p>${esc(opts.message || "")}</p>`,
        footer: `<button class="btn btn--primary" data-act="ok">Aceptar</button>`,
        kind: opts.kind,
        size: "sm"
      });
      m.footer.querySelector('[data-act="ok"]').onclick = () => { m.close(); resolve(true); };
    });
  }
  function confirmModal(opts) {
    return new Promise(resolve => {
      const m = modalOpen({
        title: opts.title || "Confirmar",
        body: `<p>${esc(opts.message || "")}</p>`,
        footer: `
          <button class="btn" data-act="no">Cancelar</button>
          <button class="btn btn--primary" data-act="yes">${esc(opts.confirmLabel || "Confirmar")}</button>
        `,
        kind: opts.kind || "warning",
        size: "sm",
        onClose: () => resolve(false)
      });
      m.footer.querySelector('[data-act="yes"]').onclick = () => { m.close(); resolve(true); };
      m.footer.querySelector('[data-act="no"]').onclick  = () => { m.close(); };
    });
  }

  window.NodoComponents.Modal = {
    open: modalOpen,
    close: closeModal,
    alert: alertModal,
    confirm: confirmModal
  };

  /* ============================================================
     TOAST
     ============================================================ */
  function ensureStack() {
    let s = document.getElementById("no-toast-stack");
    if (!s) {
      s = document.createElement("div");
      s.id = "no-toast-stack";
      s.className = "no-toast-stack";
      document.body.appendChild(s);
    }
    return s;
  }
  function toastShow(opts) {
    const stack = ensureStack();
    const kind = opts.kind || "info";
    const duration = opts.duration === undefined ? 4000 : opts.duration;

    const iconSVG = ({
      success: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 12l3 3 7-7" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 22h22L12 2z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 9v6h2V9zM11 17v2h2v-2z"/></svg>`,
      danger:  `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="2"/></svg>`,
      info:    `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="8" r="1.2" fill="currentColor"/><path d="M12 11v7" stroke="currentColor" stroke-width="2"/></svg>`
    })[kind];

    const t = document.createElement("div");
    t.className = "no-toast no-toast--" + kind;
    t.innerHTML = `
      <span class="no-toast__icon">${iconSVG}</span>
      <div class="no-toast__body">
        ${opts.title ? `<div class="no-toast__title">${esc(opts.title)}</div>` : ""}
        <div class="no-toast__msg">${esc(opts.message || "")}</div>
      </div>
      <button class="no-toast__close" aria-label="Cerrar">✕</button>
    `;
    stack.appendChild(t);
    function dismiss() {
      t.classList.add("no-toast--leaving");
      setTimeout(() => t.remove(), 200);
    }
    t.querySelector(".no-toast__close").onclick = dismiss;
    if (duration > 0) setTimeout(dismiss, duration);
    return { dismiss };
  }
  window.NodoComponents.Toast = {
    show: toastShow,
    success: (msg, opts) => toastShow(Object.assign({ kind: "success", message: msg }, opts || {})),
    warning: (msg, opts) => toastShow(Object.assign({ kind: "warning", message: msg }, opts || {})),
    danger:  (msg, opts) => toastShow(Object.assign({ kind: "danger",  message: msg }, opts || {})),
    info:    (msg, opts) => toastShow(Object.assign({ kind: "info",    message: msg }, opts || {}))
  };

  /* ============================================================
     DOCUMENT VIEWER
     ============================================================ */
  function docViewerOpen(opts) {
    const url = opts.url;
    const type = opts.type || (url && url.toLowerCase().endsWith(".pdf") ? "pdf" : "image");
    const title = opts.title || (url ? url.split("/").pop() : "Documento");

    let zoom = 100;
    let imgEl = null;

    const body = document.createElement("div");
    body.style.height = "100%";
    body.innerHTML = `
      <div class="no-docviewer__toolbar">
        <button class="btn" data-act="zoom-out" title="Reducir">−</button>
        <span class="no-docviewer__zoom" data-role="zoom">100%</span>
        <button class="btn" data-act="zoom-in" title="Ampliar">+</button>
        <button class="btn" data-act="zoom-reset" title="Tamaño original">100%</button>
        <div style="flex:1;"></div>
        <a class="btn" href="${esc(url)}" download target="_blank">↓ Descargar</a>
        <button class="btn" data-act="print" title="Imprimir">🖨 Imprimir</button>
      </div>
      <div class="no-docviewer__viewport" data-role="viewport"></div>
    `;
    const m = modalOpen({
      title: title,
      body: body,
      size: "lg"
    });
    m.el.classList.add("no-docviewer");

    const viewport = body.querySelector('[data-role="viewport"]');
    const zoomEl   = body.querySelector('[data-role="zoom"]');

    if (type === "pdf") {
      viewport.innerHTML = `<iframe src="${esc(url)}#toolbar=0" title="${esc(title)}"></iframe>`;
    } else if (type === "image") {
      imgEl = document.createElement("img");
      imgEl.src = url;
      imgEl.className = "no-docviewer__image";
      imgEl.alt = title;
      imgEl.style.maxWidth = "100%";
      viewport.appendChild(imgEl);
    } else {
      // iframe genérico
      viewport.innerHTML = `<iframe src="${esc(url)}" title="${esc(title)}"></iframe>`;
    }

    function applyZoom() {
      zoomEl.textContent = zoom + "%";
      if (imgEl) {
        imgEl.style.transform = "scale(" + (zoom/100) + ")";
        imgEl.style.maxWidth = "none";
      }
    }
    body.querySelector('[data-act="zoom-in"]').onclick    = () => { zoom = Math.min(400, zoom + 25); applyZoom(); };
    body.querySelector('[data-act="zoom-out"]').onclick   = () => { zoom = Math.max(25,  zoom - 25); applyZoom(); };
    body.querySelector('[data-act="zoom-reset"]').onclick = () => { zoom = 100; applyZoom(); };
    body.querySelector('[data-act="print"]').onclick = () => {
      if (type === "pdf") {
        const iframe = viewport.querySelector("iframe");
        if (iframe) iframe.contentWindow.print();
      } else {
        const w = window.open("");
        w.document.write(`<img src="${esc(url)}" style="max-width:100%;" onload="window.print()">`);
      }
    };

    return m;
  }
  window.NodoComponents.DocumentViewer = { open: docViewerOpen };

  console.log("[NODO Shell] NodoComponents.Modal/Toast/DocumentViewer cargados.");
})();
