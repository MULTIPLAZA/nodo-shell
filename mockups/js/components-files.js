/* ============================================================
   NODO Shell — FileUpload + DataExport
   ============================================================
   API:
     NodoComponents.FileUpload.create({
       container, accept, multiple, maxSize, maxFiles,
       onChange(files), onUpload(files), uploadLabel
     });

     NodoComponents.DataExport.toCSV(rows, columns, filename)
     NodoComponents.DataExport.toJSON(data, filename)
     NodoComponents.DataExport.toPrintablePDF(rows, columns, options)
       → abre ventana imprimible, el browser ofrece "Guardar como PDF"
     NodoComponents.DataExport.button({ container, getRows, columns,
       filename, formats: ["csv","json","pdf"] })
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

  function fmtBytes(n) {
    if (!n) return "0 B";
    const k = 1024;
    const units = ["B","KB","MB","GB"];
    const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(k)));
    return (n / Math.pow(k, i)).toFixed(i ? 1 : 0) + " " + units[i];
  }

  /* ============================================================
     FILE UPLOAD
     ============================================================ */
  function fileUploadCreate(opts) {
    const container = opts.container;
    const accept   = opts.accept   || "";
    const multiple = opts.multiple !== false;
    const maxSize  = opts.maxSize  || 0;   // bytes; 0 = sin límite
    const maxFiles = opts.maxFiles || 0;   // 0 = sin límite

    const wrap = document.createElement("div");
    wrap.className = "no-fu";
    wrap.innerHTML = `
      <label class="no-fu__zone" data-role="zone">
        <div class="no-fu__zone-icon">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M16 22V8M10 14l6-6 6 6M6 24h20"/>
          </svg>
        </div>
        <div class="no-fu__zone-title">Arrastrá archivos acá o hacé click para seleccionar</div>
        <div class="no-fu__zone-hint">
          ${accept ? `Tipos permitidos: ${esc(accept)} · ` : ""}
          ${maxSize ? `Máximo ${fmtBytes(maxSize)} por archivo · ` : ""}
          ${multiple ? "Podés subir varios" : "Un solo archivo"}
        </div>
        <input type="file" ${accept ? `accept="${esc(accept)}"` : ""} ${multiple ? "multiple" : ""}>
      </label>
      <div class="no-fu__list" data-role="list"></div>
      <div class="no-fu__error" data-role="error"></div>
    `;
    container.appendChild(wrap);

    const zone  = wrap.querySelector('[data-role="zone"]');
    const input = wrap.querySelector("input[type=file]");
    const list  = wrap.querySelector('[data-role="list"]');
    const errEl = wrap.querySelector('[data-role="error"]');
    let files = [];

    function setError(m) { errEl.textContent = m || ""; }
    function notify() {
      if (opts.onChange) opts.onChange(files.slice());
      renderList();
    }
    function valid(f) {
      if (maxSize && f.size > maxSize) return `${f.name} excede ${fmtBytes(maxSize)}`;
      if (accept) {
        const types = accept.split(",").map(s => s.trim().toLowerCase());
        const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
        const okType = types.some(t => {
          if (t.startsWith(".")) return ext === t;
          if (t.endsWith("/*")) return f.type.startsWith(t.replace("/*",""));
          return f.type === t;
        });
        if (!okType) return `${f.name}: tipo no permitido`;
      }
      return true;
    }
    function add(newFiles) {
      setError("");
      const arr = Array.from(newFiles);
      const errors = [];
      arr.forEach(f => {
        const r = valid(f);
        if (r !== true) { errors.push(r); return; }
        if (!multiple) files = [];
        if (maxFiles && files.length >= maxFiles) { errors.push("Máximo " + maxFiles + " archivos"); return; }
        files.push(f);
      });
      if (errors.length) setError(errors.join(" · "));
      notify();
    }
    function renderList() {
      if (files.length === 0) { list.innerHTML = ""; return; }
      list.innerHTML = files.map((f, i) => {
        const isImg = f.type && f.type.startsWith("image/");
        const url = isImg ? URL.createObjectURL(f) : null;
        const ext = (f.name.split(".").pop() || "?").toUpperCase().slice(0, 4);
        return `
          <div class="no-fu__item" data-i="${i}">
            <div class="no-fu__item-thumb">${isImg ? `<img src="${url}" alt="">` : esc(ext)}</div>
            <div class="no-fu__item-info">
              <div class="no-fu__item-name">${esc(f.name)}</div>
              <div class="no-fu__item-size">${fmtBytes(f.size)} · ${esc(f.type || "—")}</div>
            </div>
            <button class="no-fu__item-remove" data-act="remove" title="Quitar">✕</button>
          </div>
        `;
      }).join("");
      list.querySelectorAll('[data-act="remove"]').forEach(b => {
        b.onclick = () => {
          const i = Number(b.closest(".no-fu__item").dataset.i);
          files.splice(i, 1);
          notify();
        };
      });
    }

    input.onchange = () => add(input.files);
    zone.ondragover = e => { e.preventDefault(); zone.classList.add("no-fu__zone--drag"); };
    zone.ondragleave = () => zone.classList.remove("no-fu__zone--drag");
    zone.ondrop = e => {
      e.preventDefault();
      zone.classList.remove("no-fu__zone--drag");
      add(e.dataTransfer.files);
    };

    return {
      el: wrap,
      getFiles: () => files.slice(),
      clear: () => { files = []; setError(""); notify(); },
      destroy: () => wrap.remove()
    };
  }

  /* ============================================================
     DATA EXPORT
     ============================================================
     columns: [{ key, label, formatter? }]
     ============================================================ */
  function csvEscape(v) {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function toCSV(rows, columns, filename) {
    const cols = columns || (rows.length ? Object.keys(rows[0]).map(k => ({ key: k, label: k })) : []);
    const header = cols.map(c => csvEscape(c.label || c.key)).join(";");
    const body = rows.map(r => cols.map(c => {
      const v = c.formatter ? c.formatter(r[c.key], r) : r[c.key];
      return csvEscape(v);
    }).join(";")).join("\n");
    // Excel-friendly: BOM + separador `;` + saltos de línea \n
    const csv = "﻿" + header + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    download(blob, filename || ("export-" + Date.now() + ".csv"));
  }
  function toJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8;" });
    download(blob, filename || ("export-" + Date.now() + ".json"));
  }
  function toPrintablePDF(rows, columns, options) {
    options = options || {};
    const cols = columns || (rows.length ? Object.keys(rows[0]).map(k => ({ key: k, label: k })) : []);
    const title = options.title || "Reporte";
    const subtitle = options.subtitle || "";
    const html = `
      <!doctype html>
      <html lang="es"><head>
      <meta charset="utf-8">
      <title>${esc(title)}</title>
      <style>
        @page { size: A4; margin: 14mm; }
        body { font-family: Segoe UI, Arial, sans-serif; color: #222; font-size: 11px; }
        h1 { font-size: 18px; margin: 0 0 4px; color: #0a4c82; }
        .sub { color: #666; font-size: 11px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        thead th {
          background: #eef3fa; color: #0a4c82; padding: 6px 8px;
          text-align: left; border-bottom: 2px solid #0a4c82; font-size: 10px;
          text-transform: uppercase; letter-spacing: 0.3px;
        }
        tbody td { padding: 4px 8px; border-bottom: 1px solid #eee; }
        tbody tr:nth-child(even) td { background: #fafbfc; }
        tfoot td { padding: 6px 8px; border-top: 2px solid #0a4c82; background: #eef3fa; font-weight: bold; }
        .meta { margin-top: 16px; font-size: 9px; color: #888; text-align: right; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
      </head><body>
      <h1>${esc(title)}</h1>
      ${subtitle ? `<div class="sub">${esc(subtitle)}</div>` : ""}
      <table>
        <thead><tr>${cols.map(c => `<th>${esc(c.label || c.key)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(r => `<tr>${cols.map(c => {
          const v = c.formatter ? c.formatter(r[c.key], r) : r[c.key];
          return `<td>${esc(v)}</td>`;
        }).join("")}</tr>`).join("")}</tbody>
        ${options.footerRow ? `<tfoot><tr>${options.footerRow.map(v => `<td>${esc(v)}</td>`).join("")}</tr></tfoot>` : ""}
      </table>
      <div class="meta">
        Generado el ${new Date().toLocaleString("es-PY")} · ${rows.length} registros
      </div>
      <script>window.onload = () => window.print();<\/script>
      </body></html>
    `;
    const w = window.open("");
    if (!w) {
      if (window.NodoComponents.Toast) window.NodoComponents.Toast.warning("El navegador bloqueó el popup. Permitilo para imprimir.");
      return;
    }
    w.document.write(html);
    w.document.close();
  }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
  }

  function exportButton(opts) {
    const formats = opts.formats || ["csv", "json", "pdf"];
    const wrap = document.createElement("div");
    wrap.style.position = "relative";
    wrap.style.display = "inline-block";
    wrap.innerHTML = `
      <button class="btn" data-act="open" type="button">↓ Exportar ▾</button>
      <div data-role="menu" style="display:none;position:absolute;right:0;top:calc(100% + 2px);background:var(--bg-ribbon,#fff);border:1px solid var(--border-strong);border-radius:2px;box-shadow:0 6px 18px rgba(0,0,0,0.18);min-width:180px;z-index:1000;padding:4px 0;">
        ${formats.includes("csv") ? `<button class="btn" data-act="csv"  style="width:100%;justify-content:flex-start;border:none;border-radius:0;background:transparent;">📊 Exportar a CSV/Excel</button>` : ""}
        ${formats.includes("json")? `<button class="btn" data-act="json" style="width:100%;justify-content:flex-start;border:none;border-radius:0;background:transparent;">📦 Exportar a JSON</button>` : ""}
        ${formats.includes("pdf") ? `<button class="btn" data-act="pdf"  style="width:100%;justify-content:flex-start;border:none;border-radius:0;background:transparent;">🖨 Imprimir / Guardar PDF</button>` : ""}
      </div>
    `;
    opts.container.appendChild(wrap);
    const menu = wrap.querySelector('[data-role="menu"]');
    wrap.querySelector('[data-act="open"]').onclick = () => {
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    };
    document.addEventListener("click", e => { if (!wrap.contains(e.target)) menu.style.display = "none"; });

    function getRows() { return typeof opts.getRows === "function" ? opts.getRows() : (opts.rows || []); }
    if (formats.includes("csv"))  wrap.querySelector('[data-act="csv"]').onclick = () => { toCSV(getRows(), opts.columns, opts.filename); menu.style.display = "none"; };
    if (formats.includes("json")) wrap.querySelector('[data-act="json"]').onclick = () => { toJSON(getRows(), opts.filename); menu.style.display = "none"; };
    if (formats.includes("pdf"))  wrap.querySelector('[data-act="pdf"]').onclick = () => { toPrintablePDF(getRows(), opts.columns, { title: opts.title, subtitle: opts.subtitle }); menu.style.display = "none"; };

    return { el: wrap };
  }

  window.NodoComponents.FileUpload = { create: fileUploadCreate };
  window.NodoComponents.DataExport = { toCSV, toJSON, toPrintablePDF, button: exportButton };

  console.log("[NODO Shell] NodoComponents.FileUpload / DataExport cargados.");
})();
