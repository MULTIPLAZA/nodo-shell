/* ============================================================
   NODO Shell — NodoComponents.Chart
   ============================================================
   Gráficos SVG vanilla, paleta tema-aware, gradientes nativos.
   Sin librerías externas.

   Tipos:
     - bar(opts)         barras verticales con gradiente
     - line(opts)        línea suave con dots
     - area(opts)        área rellena con gradiente
     - pie(opts)         pie / donut
     - stackedBar(opts)  barras apiladas
     - groupedBar(opts)  barras agrupadas (varias series lado a lado)
     - sparkline(opts)   mini gráfico inline (sin ejes)
     - gauge(opts)       medidor radial (semi-círculo)
     - funnel(opts)      embudo (pipeline / conversion)
     - heatmap(opts)     matriz de celdas coloreadas
     - dynamic(opts)     wrapper con filtros + KPIs + selector tipo

   Re-render automático cuando cambia el tema (escucha "themechange").
   ============================================================ */

(function () {
  "use strict";

  window.NodoComponents = window.NodoComponents || {};

  /* ============================================================
     PALETAS tema-aware (sobrias y armónicas, no chillonas)
     ============================================================ */
  const PALETTES = {
    office2010: ["#1e6bb0", "#5a8a3d", "#8a5a3d", "#6b8aa6", "#4a7d28", "#a85c00", "#5a6b7d", "#3d6e8a"],
    bloomberg:  ["#d4a76a", "#7aa84e", "#b85450", "#6b8aa6", "#c9a464", "#8a6fb0", "#4a8a8a", "#a8a87a"],
    slate:      ["#2d6a4f", "#52b788", "#5a8a8a", "#7d6b8a", "#8a6b3d", "#3d5a8a", "#1b4332", "#95d5b2"]
  };
  function activeTheme() { return document.documentElement.getAttribute("data-theme") || "office2010"; }
  function themePalette() { return PALETTES[activeTheme()] || PALETTES.office2010; }
  function paletteColor(i, palette) {
    const p = palette || themePalette();
    return p[i % p.length];
  }
  // Lighten/darken para gradientes
  function lighten(hex, amt) {
    const m = hex.replace("#","").match(/.{2}/g);
    if (!m) return hex;
    const rgb = m.map(s => Math.min(255, Math.max(0, parseInt(s,16) + amt)));
    return "#" + rgb.map(n => n.toString(16).padStart(2,"0")).join("");
  }

  /* ============================================================
     Re-render automático en cambio de tema
     ============================================================ */
  const REGISTRY = new Set();
  function registerInstance(inst) {
    REGISTRY.add(inst);
    return inst;
  }
  function destroyInstance(inst) { REGISTRY.delete(inst); }
  window.addEventListener("themechange", () => {
    REGISTRY.forEach(inst => {
      if (inst && typeof inst.refresh === "function") {
        try { inst.refresh(); } catch (e) {}
      }
    });
  });

  /* ============================================================
     Helpers comunes
     ============================================================ */
  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  function fmtNum(n) {
    if (n === null || n === undefined) return "";
    const num = Number(n);
    if (isNaN(num)) return String(n);
    return num.toLocaleString("es-PY", { maximumFractionDigits: 0 });
  }
  function uid() { return "c" + Math.random().toString(36).slice(2, 8); }

  function shellWrap(opts, kind) {
    const wrap = document.createElement("div");
    wrap.className = "nc-chart";
    wrap.dataset.kind = kind;
    if (opts.title) {
      const t = document.createElement("div");
      t.className = "nc-chart__title";
      t.textContent = opts.title;
      wrap.appendChild(t);
    }
    const vp = document.createElement("div");
    vp.className = "nc-chart__viewport";
    wrap.appendChild(vp);
    const tooltip = document.createElement("div");
    tooltip.className = "nc-chart__tooltip";
    wrap.appendChild(tooltip);
    opts.container.appendChild(wrap);
    return { wrap, vp, tooltip };
  }
  function showTooltip(tooltip, html, x, y, vpRect, ttRect) {
    tooltip.innerHTML = html;
    tooltip.classList.add("is-visible");
    const w = tooltip.offsetWidth;
    let left = x + 12, top = y - 28;
    if (vpRect && left + w > vpRect.width) left = x - w - 12;
    if (top < 0) top = 4;
    tooltip.style.left = left + "px";
    tooltip.style.top  = top + "px";
  }
  function hideTooltip(tooltip) { tooltip.classList.remove("is-visible"); }
  function addLegend(wrap, items, fmt, onToggle) {
    const old = wrap.querySelector(".nc-chart__legend");
    if (old) old.remove();
    if (!items || items.length === 0) return;
    const lg = document.createElement("div");
    lg.className = "nc-chart__legend";
    lg.innerHTML = items.map((it, i) => `
      <span class="nc-chart__legend-item ${it.disabled?'is-disabled':''}" data-i="${i}">
        <span class="nc-chart__legend-swatch" style="background:${esc(it.color)};"></span>
        ${esc(it.label)}
        ${it.value !== undefined ? `<span class="nc-chart__legend-value">${esc(fmt(it.value))}</span>` : ""}
      </span>
    `).join("");
    if (onToggle) {
      lg.querySelectorAll(".nc-chart__legend-item").forEach(el => {
        el.addEventListener("click", () => onToggle(Number(el.dataset.i)));
      });
    }
    wrap.appendChild(lg);
  }

  function niceCeil(n) {
    if (n <= 0) return 1;
    const exp = Math.pow(10, Math.floor(Math.log10(n)));
    const f = n / exp;
    let nice;
    if (f <= 1) nice = 1;
    else if (f <= 2) nice = 2;
    else if (f <= 2.5) nice = 2.5;
    else if (f <= 5) nice = 5;
    else nice = 10;
    return nice * exp;
  }

  // Genera gradient SVG vertical (claro arriba → más oscuro/transparente abajo)
  function gradientDef(id, color, kind) {
    if (kind === "area") {
      return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="${color}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.05"/>
      </linearGradient>`;
    }
    // bar: claro arriba, color base abajo
    const top = lighten(color, 30);
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="${top}"   stop-opacity="1"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="1"/>
    </linearGradient>`;
  }

  /* ============================================================
     BAR (vertical / horizontal) con gradiente
     ============================================================ */
  function bar(opts) {
    const fmt = opts.valueFormatter || fmtNum;
    const horizontal = !!opts.horizontal;
    const { wrap, vp, tooltip } = shellWrap(opts, "bar");
    const id = uid();

    function render() {
      const palette = themePalette();
      const data = opts.data || [];
      const w = vp.clientWidth || 600;
      const h = vp.clientHeight || 300;
      const padL = horizontal ? 110 : 38;
      const padR = 16, padT = 12;
      const padB = horizontal ? 30 : 50;
      const innerW = w - padL - padR;
      const innerH = h - padT - padB;
      const max = Math.max(...data.map(d => d.value), 1);
      const niceMax = niceCeil(max);
      const ticks = 5;

      let defs = `<defs>`;
      data.forEach((d, i) => {
        defs += gradientDef(`${id}-${i}`, d.color || paletteColor(i, palette), "bar");
      });
      defs += `</defs>`;

      let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">${defs}`;

      if (horizontal) {
        for (let i = 0; i <= ticks; i++) {
          const x = padL + (innerW * i / ticks);
          const v = niceMax * i / ticks;
          svg += `<line class="nc-grid-line" x1="${x}" y1="${padT}" x2="${x}" y2="${padT + innerH}"/>`;
          svg += `<text class="nc-axis-label" x="${x}" y="${padT + innerH + 12}" text-anchor="middle">${esc(fmt(v))}</text>`;
        }
        svg += `<line class="nc-axis-line" x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + innerH}"/>`;
      } else {
        for (let i = 0; i <= ticks; i++) {
          const y = padT + innerH - (innerH * i / ticks);
          const v = niceMax * i / ticks;
          svg += `<line class="nc-grid-line" x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}"/>`;
          svg += `<text class="nc-axis-label" x="${padL - 6}" y="${y + 3}" text-anchor="end">${esc(fmt(v))}</text>`;
        }
        svg += `<line class="nc-axis-line" x1="${padL}" y1="${padT + innerH}" x2="${w - padR}" y2="${padT + innerH}"/>`;
      }

      const bandSize = (horizontal ? innerH : innerW) / data.length;
      const barSize = bandSize * 0.7;
      const offset = (bandSize - barSize) / 2;

      data.forEach((d, i) => {
        if (horizontal) {
          const len = innerW * (d.value / niceMax);
          const y = padT + bandSize * i + offset;
          svg += `<rect class="nc-bar" rx="2" ry="2" x="${padL}" y="${y}" width="${Math.max(0,len)}" height="${barSize}" fill="url(#${id}-${i})" data-i="${i}"/>`;
          svg += `<text x="${padL - 6}" y="${y + barSize/2 + 3}" text-anchor="end" font-size="10">${esc(d.label)}</text>`;
          if (len > 50) {
            svg += `<text x="${padL + len - 6}" y="${y + barSize/2 + 3}" text-anchor="end" font-size="10" fill="#fff" font-weight="600">${esc(fmt(d.value))}</text>`;
          }
        } else {
          const len = innerH * (d.value / niceMax);
          const x = padL + bandSize * i + offset;
          const y = padT + innerH - len;
          svg += `<rect class="nc-bar" rx="2" ry="2" x="${x}" y="${y}" width="${barSize}" height="${Math.max(0,len)}" fill="url(#${id}-${i})" data-i="${i}"/>`;
          const rot = data.length > 6 ? -25 : 0;
          svg += `<text x="${x + barSize/2}" y="${padT + innerH + 14}" text-anchor="${rot ? 'end' : 'middle'}" font-size="10"
                       transform="rotate(${rot} ${x + barSize/2} ${padT + innerH + 14})">${esc(d.label)}</text>`;
          if (len > 18) {
            svg += `<text x="${x + barSize/2}" y="${y + 12}" text-anchor="middle" font-size="10" fill="#fff" font-weight="600">${esc(fmt(d.value))}</text>`;
          }
        }
      });
      svg += `</svg>`;
      vp.innerHTML = svg;

      const vpRect = vp.getBoundingClientRect();
      vp.querySelectorAll(".nc-bar").forEach(b => {
        b.addEventListener("mousemove", e => {
          const i = Number(b.dataset.i);
          const d = data[i];
          showTooltip(tooltip, `<div class="nc-tt-row"><span class="nc-tt-label">${esc(d.label)}</span><strong>${esc(fmt(d.value))}</strong></div>`, e.clientX - vpRect.left, e.clientY - vpRect.top, vpRect);
        });
        b.addEventListener("mouseleave", () => hideTooltip(tooltip));
        b.addEventListener("click", () => { if (opts.onClick) opts.onClick(data[Number(b.dataset.i)]); });
      });
    }
    render();
    window.addEventListener("resize", render);
    const inst = { el: wrap, refresh: render, destroy: () => { destroyInstance(inst); wrap.remove(); } };
    return registerInstance(inst);
  }

  /* ============================================================
     LINE (con dots y curva opcional)
     ============================================================ */
  function line(opts) {
    const fmt = opts.valueFormatter || fmtNum;
    const { wrap, vp, tooltip } = shellWrap(opts, "line");

    function render() {
      const palette = themePalette();
      const series = opts.series || [];
      const xLabels = opts.xLabels || [];
      const w = vp.clientWidth || 600;
      const h = vp.clientHeight || 300;
      const padL = 38, padR = 16, padT = 12, padB = 30;
      const innerW = w - padL - padR;
      const innerH = h - padT - padB;

      let allValues = [];
      series.forEach(s => s.data.forEach(p => allValues.push(p.y)));
      const max = Math.max(...allValues, 1);
      const niceMax = niceCeil(max);
      const ticks = 5;
      const numPoints = Math.max(...series.map(s => s.data.length), 1);

      let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">`;
      for (let i = 0; i <= ticks; i++) {
        const y = padT + innerH - (innerH * i / ticks);
        const v = niceMax * i / ticks;
        svg += `<line class="nc-grid-line" x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}"/>`;
        svg += `<text class="nc-axis-label" x="${padL - 6}" y="${y + 3}" text-anchor="end">${esc(fmt(v))}</text>`;
      }
      svg += `<line class="nc-axis-line" x1="${padL}" y1="${padT + innerH}" x2="${w - padR}" y2="${padT + innerH}"/>`;
      const stepX = numPoints > 1 ? innerW / (numPoints - 1) : innerW;
      for (let i = 0; i < numPoints; i++) {
        const x = padL + stepX * i;
        const lbl = xLabels[i] || "";
        if (lbl) svg += `<text class="nc-axis-label" x="${x}" y="${padT + innerH + 14}" text-anchor="middle">${esc(lbl)}</text>`;
      }

      const legend = [];
      series.forEach((s, sIdx) => {
        const color = s.color || paletteColor(sIdx, palette);
        const pts = s.data.map((p, i) => ({
          x: padL + stepX * i,
          y: padT + innerH - innerH * (p.y / niceMax),
          p
        }));
        // Curva suave (Catmull-Rom simple → Bezier)
        const path = pts.length === 0 ? "" : pts.map((q, i) => {
          if (i === 0) return "M" + q.x + " " + q.y;
          const prev = pts[i-1];
          const cx = (prev.x + q.x) / 2;
          return `Q ${cx} ${prev.y} ${cx} ${(prev.y+q.y)/2} T ${q.x} ${q.y}`;
        }).join(" ");
        svg += `<path class="nc-line" d="${path}" stroke="${esc(color)}"/>`;
        pts.forEach((q, i) => {
          svg += `<circle class="nc-dot" cx="${q.x}" cy="${q.y}" r="3" fill="${esc(color)}" data-s="${sIdx}" data-i="${i}"/>`;
        });
        legend.push({ label: s.name || ("Serie " + (sIdx+1)), color });
      });

      svg += `</svg>`;
      vp.innerHTML = svg;
      const vpRect = vp.getBoundingClientRect();
      vp.querySelectorAll(".nc-dot").forEach(d => {
        d.addEventListener("mousemove", e => {
          const sIdx = Number(d.dataset.s), i = Number(d.dataset.i);
          const p = series[sIdx].data[i];
          showTooltip(tooltip,
            `<div class="nc-tt-row"><span class="nc-tt-label">${esc(series[sIdx].name || "")} ${esc(xLabels[i] || "")}</span><strong>${esc(fmt(p.y))}</strong></div>`,
            e.clientX - vpRect.left, e.clientY - vpRect.top, vpRect);
        });
        d.addEventListener("mouseleave", () => hideTooltip(tooltip));
      });
      addLegend(wrap, legend, fmt);
    }
    render();
    window.addEventListener("resize", render);
    const inst = { el: wrap, refresh: render, destroy: () => { destroyInstance(inst); wrap.remove(); } };
    return registerInstance(inst);
  }

  /* ============================================================
     AREA (curva con relleno gradiente)
     ============================================================ */
  function area(opts) {
    const fmt = opts.valueFormatter || fmtNum;
    const { wrap, vp, tooltip } = shellWrap(opts, "area");
    const id = uid();

    function render() {
      const palette = themePalette();
      const series = opts.series || [];
      const xLabels = opts.xLabels || [];
      const w = vp.clientWidth || 600;
      const h = vp.clientHeight || 300;
      const padL = 38, padR = 16, padT = 12, padB = 30;
      const innerW = w - padL - padR;
      const innerH = h - padT - padB;

      let allValues = [];
      series.forEach(s => s.data.forEach(p => allValues.push(p.y)));
      const max = Math.max(...allValues, 1);
      const niceMax = niceCeil(max);
      const ticks = 5;
      const numPoints = Math.max(...series.map(s => s.data.length), 1);
      const stepX = numPoints > 1 ? innerW / (numPoints - 1) : innerW;

      let defs = `<defs>`;
      series.forEach((s, sIdx) => {
        const color = s.color || paletteColor(sIdx, palette);
        defs += gradientDef(`${id}-${sIdx}`, color, "area");
      });
      defs += `</defs>`;

      let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">${defs}`;
      for (let i = 0; i <= ticks; i++) {
        const y = padT + innerH - (innerH * i / ticks);
        const v = niceMax * i / ticks;
        svg += `<line class="nc-grid-line" x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}"/>`;
        svg += `<text class="nc-axis-label" x="${padL - 6}" y="${y + 3}" text-anchor="end">${esc(fmt(v))}</text>`;
      }
      svg += `<line class="nc-axis-line" x1="${padL}" y1="${padT + innerH}" x2="${w - padR}" y2="${padT + innerH}"/>`;
      for (let i = 0; i < numPoints; i++) {
        const x = padL + stepX * i;
        const lbl = xLabels[i] || "";
        if (lbl) svg += `<text class="nc-axis-label" x="${x}" y="${padT + innerH + 14}" text-anchor="middle">${esc(lbl)}</text>`;
      }

      const legend = [];
      series.forEach((s, sIdx) => {
        const color = s.color || paletteColor(sIdx, palette);
        const pts = s.data.map((p, i) => ({
          x: padL + stepX * i,
          y: padT + innerH - innerH * (p.y / niceMax),
          p
        }));
        if (pts.length === 0) return;
        // Curva suave
        const linePath = pts.map((q, i) => {
          if (i === 0) return "M" + q.x + " " + q.y;
          const prev = pts[i-1];
          const cx = (prev.x + q.x) / 2;
          return `Q ${cx} ${prev.y} ${cx} ${(prev.y+q.y)/2} T ${q.x} ${q.y}`;
        }).join(" ");
        const areaPath = linePath + ` L ${pts[pts.length-1].x} ${padT + innerH} L ${pts[0].x} ${padT + innerH} Z`;
        svg += `<path class="nc-area" d="${areaPath}" fill="url(#${id}-${sIdx})"/>`;
        svg += `<path class="nc-line" d="${linePath}" stroke="${esc(color)}"/>`;
        pts.forEach((q, i) => {
          svg += `<circle class="nc-dot" cx="${q.x}" cy="${q.y}" r="2.5" fill="${esc(color)}" data-s="${sIdx}" data-i="${i}"/>`;
        });
        legend.push({ label: s.name || ("Serie " + (sIdx+1)), color });
      });

      svg += `</svg>`;
      vp.innerHTML = svg;
      const vpRect = vp.getBoundingClientRect();
      vp.querySelectorAll(".nc-dot").forEach(d => {
        d.addEventListener("mousemove", e => {
          const sIdx = Number(d.dataset.s), i = Number(d.dataset.i);
          const p = series[sIdx].data[i];
          showTooltip(tooltip,
            `<div class="nc-tt-row"><span class="nc-tt-label">${esc(series[sIdx].name || "")} ${esc(xLabels[i] || "")}</span><strong>${esc(fmt(p.y))}</strong></div>`,
            e.clientX - vpRect.left, e.clientY - vpRect.top, vpRect);
        });
        d.addEventListener("mouseleave", () => hideTooltip(tooltip));
      });
      addLegend(wrap, legend, fmt);
    }
    render();
    window.addEventListener("resize", render);
    const inst = { el: wrap, refresh: render, destroy: () => { destroyInstance(inst); wrap.remove(); } };
    return registerInstance(inst);
  }

  /* ============================================================
     STACKED BAR (apiladas)
     ============================================================
     opts: { container, title, series: [{ name, color?, data: [num,num,...] }],
             xLabels: ["Ene","Feb",...], valueFormatter }
     ============================================================ */
  function stackedBar(opts) {
    const fmt = opts.valueFormatter || fmtNum;
    const { wrap, vp, tooltip } = shellWrap(opts, "stackedBar");
    const id = uid();

    function render() {
      const palette = themePalette();
      const series = opts.series || [];
      const xLabels = opts.xLabels || [];
      const w = vp.clientWidth || 600;
      const h = vp.clientHeight || 300;
      const padL = 44, padR = 16, padT = 12, padB = 30;
      const innerW = w - padL - padR;
      const innerH = h - padT - padB;
      const numCats = xLabels.length;
      // Total por categoría
      const totals = xLabels.map((_, i) => series.reduce((s, ser) => s + (Number(ser.data[i])||0), 0));
      const max = Math.max(...totals, 1);
      const niceMax = niceCeil(max);
      const ticks = 5;
      const bandSize = numCats > 0 ? innerW / numCats : innerW;
      const barW = bandSize * 0.7;
      const offX = (bandSize - barW) / 2;

      let defs = `<defs>`;
      series.forEach((s, i) => defs += gradientDef(`${id}-${i}`, s.color || paletteColor(i, palette), "bar"));
      defs += `</defs>`;

      let svg = `<svg viewBox="0 0 ${w} ${h}">${defs}`;
      for (let i = 0; i <= ticks; i++) {
        const y = padT + innerH - (innerH * i / ticks);
        const v = niceMax * i / ticks;
        svg += `<line class="nc-grid-line" x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}"/>`;
        svg += `<text class="nc-axis-label" x="${padL - 6}" y="${y + 3}" text-anchor="end">${esc(fmt(v))}</text>`;
      }
      svg += `<line class="nc-axis-line" x1="${padL}" y1="${padT + innerH}" x2="${w - padR}" y2="${padT + innerH}"/>`;

      const legend = [];
      series.forEach((s, i) => {
        legend.push({ label: s.name || ("Serie " + (i+1)), color: s.color || paletteColor(i, palette) });
      });

      xLabels.forEach((lbl, ci) => {
        const x = padL + bandSize * ci + offX;
        let stackY = padT + innerH;
        series.forEach((ser, si) => {
          const v = Number(ser.data[ci]) || 0;
          if (v <= 0) return;
          const segH = innerH * (v / niceMax);
          stackY -= segH;
          svg += `<rect class="nc-bar" rx="${si===series.length-1?2:0}" x="${x}" y="${stackY}" width="${barW}" height="${segH}" fill="url(#${id}-${si})" data-c="${ci}" data-s="${si}"/>`;
        });
        svg += `<text class="nc-axis-label" x="${x + barW/2}" y="${padT + innerH + 14}" text-anchor="middle">${esc(lbl)}</text>`;
      });

      svg += `</svg>`;
      vp.innerHTML = svg;
      const vpRect = vp.getBoundingClientRect();
      vp.querySelectorAll(".nc-bar").forEach(b => {
        b.addEventListener("mousemove", e => {
          const ci = Number(b.dataset.c), si = Number(b.dataset.s);
          const ser = series[si];
          const v = ser.data[ci];
          showTooltip(tooltip,
            `<div><span class="nc-tt-label">${esc(xLabels[ci])}</span></div>
             <div class="nc-tt-row"><span class="nc-tt-label">${esc(ser.name || "")}</span><strong>${esc(fmt(v))}</strong></div>
             <div class="nc-tt-row"><span class="nc-tt-label">Total</span><strong>${esc(fmt(totals[ci]))}</strong></div>`,
            e.clientX - vpRect.left, e.clientY - vpRect.top, vpRect);
        });
        b.addEventListener("mouseleave", () => hideTooltip(tooltip));
      });
      addLegend(wrap, legend, fmt);
    }
    render();
    window.addEventListener("resize", render);
    const inst = { el: wrap, refresh: render, destroy: () => { destroyInstance(inst); wrap.remove(); } };
    return registerInstance(inst);
  }

  /* ============================================================
     GROUPED BAR (varias series lado a lado)
     ============================================================ */
  function groupedBar(opts) {
    const fmt = opts.valueFormatter || fmtNum;
    const { wrap, vp, tooltip } = shellWrap(opts, "groupedBar");
    const id = uid();

    function render() {
      const palette = themePalette();
      const series = opts.series || [];
      const xLabels = opts.xLabels || [];
      const w = vp.clientWidth || 600;
      const h = vp.clientHeight || 300;
      const padL = 44, padR = 16, padT = 12, padB = 30;
      const innerW = w - padL - padR;
      const innerH = h - padT - padB;
      const numCats = xLabels.length;
      let allValues = [];
      series.forEach(s => s.data.forEach(v => allValues.push(Number(v)||0)));
      const max = Math.max(...allValues, 1);
      const niceMax = niceCeil(max);
      const ticks = 5;
      const bandSize = numCats > 0 ? innerW / numCats : innerW;
      const groupW = bandSize * 0.7;
      const offX = (bandSize - groupW) / 2;
      const barW = series.length > 0 ? groupW / series.length : groupW;

      let defs = `<defs>`;
      series.forEach((s, i) => defs += gradientDef(`${id}-${i}`, s.color || paletteColor(i, palette), "bar"));
      defs += `</defs>`;

      let svg = `<svg viewBox="0 0 ${w} ${h}">${defs}`;
      for (let i = 0; i <= ticks; i++) {
        const y = padT + innerH - (innerH * i / ticks);
        const v = niceMax * i / ticks;
        svg += `<line class="nc-grid-line" x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}"/>`;
        svg += `<text class="nc-axis-label" x="${padL - 6}" y="${y + 3}" text-anchor="end">${esc(fmt(v))}</text>`;
      }
      svg += `<line class="nc-axis-line" x1="${padL}" y1="${padT + innerH}" x2="${w - padR}" y2="${padT + innerH}"/>`;

      const legend = [];
      series.forEach((s, i) => legend.push({ label: s.name || ("Serie " + (i+1)), color: s.color || paletteColor(i, palette) }));

      xLabels.forEach((lbl, ci) => {
        const xBase = padL + bandSize * ci + offX;
        series.forEach((ser, si) => {
          const v = Number(ser.data[ci]) || 0;
          const segH = innerH * (v / niceMax);
          const x = xBase + barW * si;
          const y = padT + innerH - segH;
          svg += `<rect class="nc-bar" rx="2" x="${x}" y="${y}" width="${barW * 0.85}" height="${Math.max(0,segH)}" fill="url(#${id}-${si})" data-c="${ci}" data-s="${si}"/>`;
        });
        svg += `<text class="nc-axis-label" x="${xBase + groupW/2}" y="${padT + innerH + 14}" text-anchor="middle">${esc(lbl)}</text>`;
      });

      svg += `</svg>`;
      vp.innerHTML = svg;
      const vpRect = vp.getBoundingClientRect();
      vp.querySelectorAll(".nc-bar").forEach(b => {
        b.addEventListener("mousemove", e => {
          const ci = Number(b.dataset.c), si = Number(b.dataset.s);
          const ser = series[si];
          const v = ser.data[ci];
          showTooltip(tooltip,
            `<div class="nc-tt-row"><span class="nc-tt-label">${esc(xLabels[ci])} · ${esc(ser.name || "")}</span><strong>${esc(fmt(v))}</strong></div>`,
            e.clientX - vpRect.left, e.clientY - vpRect.top, vpRect);
        });
        b.addEventListener("mouseleave", () => hideTooltip(tooltip));
      });
      addLegend(wrap, legend, fmt);
    }
    render();
    window.addEventListener("resize", render);
    const inst = { el: wrap, refresh: render, destroy: () => { destroyInstance(inst); wrap.remove(); } };
    return registerInstance(inst);
  }

  /* ============================================================
     PIE / DONUT
     ============================================================ */
  function pie(opts) {
    const donut = !!opts.donut;
    const fmt = opts.valueFormatter || fmtNum;
    const { wrap, vp, tooltip } = shellWrap(opts, "pie");

    function render() {
      const palette = themePalette();
      const data = opts.data || [];
      const w = vp.clientWidth || 400;
      const h = vp.clientHeight || 300;
      const cx = w/2, cy = h/2;
      const r = Math.min(w, h) / 2 - 16;
      const rInner = donut ? r * 0.55 : 0;
      const total = data.reduce((s, d) => s + d.value, 0) || 1;

      let svg = `<svg viewBox="0 0 ${w} ${h}">`;
      let acc = 0;
      const legend = [];
      data.forEach((d, i) => {
        const color = d.color || paletteColor(i, palette);
        const startA = (acc / total) * Math.PI * 2 - Math.PI/2;
        const endA   = ((acc + d.value) / total) * Math.PI * 2 - Math.PI/2;
        acc += d.value;
        const x1 = cx + Math.cos(startA) * r, y1 = cy + Math.sin(startA) * r;
        const x2 = cx + Math.cos(endA) * r,   y2 = cy + Math.sin(endA) * r;
        const large = (endA - startA) > Math.PI ? 1 : 0;
        let path;
        if (donut) {
          const ix1 = cx + Math.cos(startA) * rInner, iy1 = cy + Math.sin(startA) * rInner;
          const ix2 = cx + Math.cos(endA) * rInner,   iy2 = cy + Math.sin(endA) * rInner;
          path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${rInner} ${rInner} 0 ${large} 0 ${ix1} ${iy1} Z`;
        } else {
          path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        }
        svg += `<path class="nc-pie-slice" d="${path}" fill="${esc(color)}" data-i="${i}"/>`;
        if (d.value / total > 0.06) {
          const midA = (startA + endA) / 2;
          const lr = donut ? (r + rInner) / 2 : r * 0.7;
          const lx = cx + Math.cos(midA) * lr;
          const ly = cy + Math.sin(midA) * lr;
          const pct = ((d.value / total) * 100).toFixed(0) + "%";
          svg += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="#fff">${pct}</text>`;
        }
        legend.push({ label: d.label, color, value: d.value });
      });
      if (donut) {
        svg += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="10" fill="#888">Total</text>`;
        svg += `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="14" font-weight="700">${esc(fmt(total))}</text>`;
      }
      svg += `</svg>`;
      vp.innerHTML = svg;
      const vpRect = vp.getBoundingClientRect();
      vp.querySelectorAll(".nc-pie-slice").forEach(s => {
        s.addEventListener("mousemove", e => {
          const i = Number(s.dataset.i);
          const d = data[i];
          const pct = ((d.value / total) * 100).toFixed(1) + "%";
          showTooltip(tooltip,
            `<div class="nc-tt-row"><span class="nc-tt-label">${esc(d.label)}</span><strong>${esc(fmt(d.value))} (${pct})</strong></div>`,
            e.clientX - vpRect.left, e.clientY - vpRect.top, vpRect);
        });
        s.addEventListener("mouseleave", () => hideTooltip(tooltip));
        s.addEventListener("click", () => { if (opts.onClick) opts.onClick(data[Number(s.dataset.i)]); });
      });
      addLegend(wrap, legend, fmt);
    }
    render();
    window.addEventListener("resize", render);
    const inst = { el: wrap, refresh: render, destroy: () => { destroyInstance(inst); wrap.remove(); } };
    return registerInstance(inst);
  }

  /* ============================================================
     SPARKLINE — mini línea inline (para celdas/KPIs)
     ============================================================ */
  function sparkline(opts) {
    const wrap = document.createElement("span");
    wrap.className = "nc-spark";
    if (opts.large) wrap.classList.add("nc-spark--lg");
    opts.container.appendChild(wrap);

    function render() {
      const palette = themePalette();
      const data = opts.data || [];
      const color = opts.color || paletteColor(0, palette);
      if (data.length === 0) { wrap.innerHTML = ""; return; }
      const w = wrap.clientWidth || 80;
      const h = wrap.clientHeight || 18;
      const max = Math.max(...data, 1);
      const min = Math.min(...data, 0);
      const range = max - min || 1;
      const pts = data.map((v, i) => ({
        x: (i / (data.length - 1 || 1)) * (w - 2) + 1,
        y: h - 1 - ((v - min) / range) * (h - 2)
      }));
      const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p.x + " " + p.y).join(" ");
      const area = path + ` L ${pts[pts.length-1].x} ${h} L ${pts[0].x} ${h} Z`;
      const id = uid();
      wrap.innerHTML = `
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
          <defs>${gradientDef(id, color, "area")}</defs>
          <path d="${area}" fill="url(#${id})"/>
          <path d="${path}" stroke="${color}" stroke-width="1.5" fill="none"/>
          <circle cx="${pts[pts.length-1].x}" cy="${pts[pts.length-1].y}" r="2" fill="${color}"/>
        </svg>
      `;
    }
    render();
    window.addEventListener("resize", render);
    const inst = { el: wrap, refresh: render, destroy: () => { destroyInstance(inst); wrap.remove(); } };
    return registerInstance(inst);
  }

  /* ============================================================
     GAUGE — semi-círculo con valor/min/max
     opts: { container, value, min, max, label, valueFormatter, color }
     ============================================================ */
  function gauge(opts) {
    const fmt = opts.valueFormatter || fmtNum;
    const wrap = document.createElement("div");
    wrap.className = "nc-chart";
    wrap.dataset.kind = "gauge";
    if (opts.title) {
      const t = document.createElement("div");
      t.className = "nc-chart__title";
      t.textContent = opts.title;
      wrap.appendChild(t);
    }
    const inner = document.createElement("div");
    inner.className = "nc-gauge-wrap";
    wrap.appendChild(inner);
    opts.container.appendChild(wrap);

    function render() {
      const palette = themePalette();
      const min = opts.min || 0;
      const max = opts.max || 100;
      const value = Math.max(min, Math.min(max, Number(opts.value) || 0));
      const pct = (value - min) / (max - min);
      const color = opts.color || paletteColor(0, palette);

      const w = wrap.clientWidth || 220;
      const h = Math.min(180, w * 0.6);
      const cx = w/2, cy = h * 0.85;
      const r = Math.min(w, h*1.6) / 2 - 14;
      const sw = 18; // stroke width

      // Semi-círculo de 180° (-180° a 0°)
      // Path arc
      function pol(a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
      const startA = Math.PI; // -180°
      const endA = 0;          // 0°
      const valA = startA + (endA - startA) * pct;
      const [sx, sy] = pol(startA);
      const [ex, ey] = pol(endA);
      const [vx, vy] = pol(valA);
      const id = uid();

      inner.innerHTML = `
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;">
          <defs>${gradientDef(id, color, "bar")}</defs>
          <path d="M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}"
                stroke-width="${sw}" stroke-linecap="round" fill="none"
                class="nc-gauge-track"/>
          <path d="M ${sx} ${sy} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${vx} ${vy}"
                stroke-width="${sw}" stroke-linecap="round" fill="none"
                stroke="url(#${id})"/>
          <text x="${cx - r}" y="${cy + 18}" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.6">${esc(fmt(min))}</text>
          <text x="${cx + r}" y="${cy + 18}" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.6">${esc(fmt(max))}</text>
        </svg>
        <div class="nc-gauge-value">${esc(fmt(value))}</div>
        ${opts.label ? `<div class="nc-gauge-label">${esc(opts.label)}</div>` : ""}
      `;
    }
    render();
    window.addEventListener("resize", render);
    const inst = { el: wrap, refresh: render, destroy: () => { destroyInstance(inst); wrap.remove(); }, setValue: (v) => { opts.value = v; render(); } };
    return registerInstance(inst);
  }

  /* ============================================================
     FUNNEL — embudo (pipeline / conversion)
     opts: { container, title, data: [{label, value, color?}],
             valueFormatter, showPercent }
     ============================================================ */
  function funnel(opts) {
    const fmt = opts.valueFormatter || fmtNum;
    const showPct = opts.showPercent !== false;
    const { wrap, vp, tooltip } = shellWrap(opts, "funnel");
    const id = uid();

    function render() {
      const palette = themePalette();
      const data = (opts.data || []).slice();
      const w = vp.clientWidth || 400;
      const h = vp.clientHeight || 300;
      const padX = 100;  // espacio para etiquetas
      const innerW = w - padX * 2;
      const segH = data.length > 0 ? (h - 16) / data.length : 0;
      const maxValue = Math.max(...data.map(d => d.value), 1);

      let defs = `<defs>`;
      data.forEach((d, i) => defs += gradientDef(`${id}-${i}`, d.color || paletteColor(i, palette), "bar"));
      defs += `</defs>`;

      let svg = `<svg viewBox="0 0 ${w} ${h}">${defs}`;
      data.forEach((d, i) => {
        const ratio = d.value / maxValue;
        const nextRatio = (i < data.length - 1 ? data[i+1].value : data[i].value * 0.7) / maxValue;
        const y = 8 + segH * i;
        const wTop = innerW * ratio;
        const wBot = innerW * nextRatio;
        const xTopL = (w - wTop) / 2, xTopR = xTopL + wTop;
        const xBotL = (w - wBot) / 2, xBotR = xBotL + wBot;
        svg += `<polygon class="nc-funnel-segment" data-i="${i}" points="${xTopL},${y} ${xTopR},${y} ${xBotR},${y+segH-2} ${xBotL},${y+segH-2}" fill="url(#${id}-${i})"/>`;
        // Etiqueta izquierda
        svg += `<text x="${xTopL - 6}" y="${y + segH/2 + 4}" text-anchor="end" font-size="11" font-weight="600">${esc(d.label)}</text>`;
        // Valor centrado
        svg += `<text x="${w/2}" y="${y + segH/2 + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${esc(fmt(d.value))}</text>`;
        // % a la derecha
        if (showPct && i > 0) {
          const conv = ((d.value / data[i-1].value) * 100).toFixed(1) + "%";
          svg += `<text x="${xTopR + 6}" y="${y + segH/2 + 4}" text-anchor="start" font-size="10" opacity="0.7">${conv}</text>`;
        }
      });
      svg += `</svg>`;
      vp.innerHTML = svg;
      const vpRect = vp.getBoundingClientRect();
      vp.querySelectorAll(".nc-funnel-segment").forEach(s => {
        s.addEventListener("mousemove", e => {
          const i = Number(s.dataset.i);
          const d = data[i];
          const conv = i > 0 ? ((d.value / data[i-1].value) * 100).toFixed(1) + "%" : "100%";
          const total = i > 0 ? ((d.value / data[0].value) * 100).toFixed(1) + "%" : "100%";
          showTooltip(tooltip,
            `<div><strong>${esc(d.label)}</strong></div>
             <div class="nc-tt-row"><span class="nc-tt-label">Valor</span><strong>${esc(fmt(d.value))}</strong></div>
             <div class="nc-tt-row"><span class="nc-tt-label">Vs anterior</span><strong>${conv}</strong></div>
             <div class="nc-tt-row"><span class="nc-tt-label">Vs total</span><strong>${total}</strong></div>`,
            e.clientX - vpRect.left, e.clientY - vpRect.top, vpRect);
        });
        s.addEventListener("mouseleave", () => hideTooltip(tooltip));
      });
    }
    render();
    window.addEventListener("resize", render);
    const inst = { el: wrap, refresh: render, destroy: () => { destroyInstance(inst); wrap.remove(); } };
    return registerInstance(inst);
  }

  /* ============================================================
     HEATMAP — matriz de celdas coloreadas
     opts: { container, title, rows: ["Lun","Mar"...], cols: [...],
             values: [[...], [...]], valueFormatter, color }
     ============================================================ */
  function heatmap(opts) {
    const fmt = opts.valueFormatter || fmtNum;
    const { wrap, vp, tooltip } = shellWrap(opts, "heatmap");

    function render() {
      const palette = themePalette();
      const rows = opts.rows || [];
      const cols = opts.cols || [];
      const values = opts.values || [];
      const baseColor = opts.color || paletteColor(0, palette);
      const w = vp.clientWidth || 400;
      const h = vp.clientHeight || 200;
      const padL = 60, padT = 24, padR = 8, padB = 8;
      const innerW = w - padL - padR;
      const innerH = h - padT - padB;
      const cellW = cols.length > 0 ? innerW / cols.length : innerW;
      const cellH = rows.length > 0 ? innerH / rows.length : innerH;

      let allValues = [];
      values.forEach(r => r.forEach(v => allValues.push(Number(v) || 0)));
      const max = Math.max(...allValues, 1);
      const min = Math.min(...allValues, 0);

      let svg = `<svg viewBox="0 0 ${w} ${h}">`;
      // Headers columnas
      cols.forEach((c, ci) => {
        svg += `<text class="nc-axis-label" x="${padL + cellW * (ci + 0.5)}" y="${padT - 8}" text-anchor="middle" font-weight="600">${esc(c)}</text>`;
      });
      // Headers filas
      rows.forEach((r, ri) => {
        svg += `<text class="nc-axis-label" x="${padL - 6}" y="${padT + cellH * (ri + 0.5) + 4}" text-anchor="end" font-weight="600">${esc(r)}</text>`;
      });
      // Cells
      rows.forEach((r, ri) => {
        cols.forEach((c, ci) => {
          const v = (values[ri] && values[ri][ci]) || 0;
          const ratio = (v - min) / (max - min || 1);
          const opacity = 0.1 + ratio * 0.85;
          svg += `<rect class="nc-hm-cell" x="${padL + cellW * ci + 1}" y="${padT + cellH * ri + 1}"
                       width="${cellW - 2}" height="${cellH - 2}" rx="2"
                       fill="${baseColor}" fill-opacity="${opacity}"
                       data-r="${ri}" data-c="${ci}"/>`;
          if (ratio > 0.4) {
            svg += `<text x="${padL + cellW * (ci + 0.5)}" y="${padT + cellH * (ri + 0.5) + 4}" text-anchor="middle" font-size="10" font-weight="600" fill="#fff">${esc(fmt(v))}</text>`;
          }
        });
      });
      svg += `</svg>`;
      vp.innerHTML = svg;
      const vpRect = vp.getBoundingClientRect();
      vp.querySelectorAll(".nc-hm-cell").forEach(cell => {
        cell.addEventListener("mousemove", e => {
          const ri = Number(cell.dataset.r), ci = Number(cell.dataset.c);
          const v = (values[ri] && values[ri][ci]) || 0;
          showTooltip(tooltip,
            `<div class="nc-tt-row"><span class="nc-tt-label">${esc(rows[ri])} · ${esc(cols[ci])}</span><strong>${esc(fmt(v))}</strong></div>`,
            e.clientX - vpRect.left, e.clientY - vpRect.top, vpRect);
        });
        cell.addEventListener("mouseleave", () => hideTooltip(tooltip));
      });
    }
    render();
    window.addEventListener("resize", render);
    const inst = { el: wrap, refresh: render, destroy: () => { destroyInstance(inst); wrap.remove(); } };
    return registerInstance(inst);
  }

  /* ============================================================
     DYNAMIC — wrapper con filtros + KPIs + selector de tipo
     ============================================================
     opts:
       container, title
       data: [{...row...}]                              datos crudos
       filters: [{ id, label, type, options?, ...} ]   select | multiselect | dateRange
       metrics: [{ id, label, agg, field?, formatter? }] sum | count | avg | max | min
       group:   { field, by? }                            field en row a usar como label X
       series:  { field }                                field para separar series
       valueField: "total"                               campo numérico principal
       chartTypes: ["bar","line","area","stackedBar"]    botones del switcher
       defaultType: "bar"
       valueFormatter
     ============================================================ */
  function dynamic(opts) {
    const data = opts.data || [];
    const filters = opts.filters || [];
    const metrics = opts.metrics || [];
    const valueField = opts.valueField || "value";
    const groupField = opts.group && opts.group.field;
    const groupBy    = opts.group && opts.group.by;        // "month"|"day"|"week"|null
    const seriesField = opts.series && opts.series.field;
    const chartTypes = opts.chartTypes || ["bar","line","area"];
    let currentType = opts.defaultType || chartTypes[0];
    const fmt = opts.valueFormatter || fmtNum;

    // Estado actual de filtros
    const filterState = {};
    filters.forEach(f => filterState[f.id] = f.default !== undefined ? f.default : (f.type === "multiselect" ? [] : null));

    const wrap = document.createElement("div");
    wrap.className = "nc-dyn";
    wrap.innerHTML = `
      <div class="nc-dyn__header">
        <div class="nc-dyn__title">${esc(opts.title || "")}</div>
        <div class="nc-dyn__filters" data-role="filters"></div>
        <div class="nc-dyn__type-switch" data-role="type-switch">
          ${chartTypes.map(t => `<button data-type="${t}" aria-selected="${t === currentType ? 'true' : 'false'}">${esc(typeLabel(t))}</button>`).join("")}
        </div>
      </div>
      <div class="nc-dyn__kpis" data-role="kpis"></div>
      <div class="nc-dyn__body" data-role="body"></div>
      <div class="nc-dyn__footer" data-role="footer"></div>
    `;
    opts.container.appendChild(wrap);

    function typeLabel(t) {
      return ({ bar: "Barras", line: "Línea", area: "Área", stackedBar: "Apiladas", groupedBar: "Agrupadas", pie: "Torta", funnel: "Embudo" })[t] || t;
    }

    /* ---------- Build filters UI ---------- */
    const filtersEl = wrap.querySelector('[data-role="filters"]');
    filters.forEach(f => {
      const wrapF = document.createElement("div");
      wrapF.className = "nc-dyn__filter";
      wrapF.innerHTML = `<label>${esc(f.label)}</label>`;
      filtersEl.appendChild(wrapF);
      const slot = document.createElement("div");
      wrapF.appendChild(slot);
      if (!window.NodoComponents.Inputs) {
        slot.innerHTML = `<em style="font-size:11px;color:var(--text-muted);">Inputs no disponible</em>`;
        return;
      }
      const I = window.NodoComponents.Inputs;
      if (f.type === "select") {
        const inst = I.select({
          container: slot, items: f.options || [], value: filterState[f.id],
          onChange: (v) => { filterState[f.id] = v; refresh(); }
        });
        inst.el.querySelector(".ni__select-control").style.minWidth = "140px";
      } else if (f.type === "multiselect") {
        // Implementación simple: select que acumula valores como array (mock)
        const inst = I.select({
          container: slot, items: [{ value: "", label: "Todos" }, ...(f.options || [])], value: "",
          onChange: (v) => { filterState[f.id] = v ? [v] : []; refresh(); }
        });
        inst.el.querySelector(".ni__select-control").style.minWidth = "140px";
      } else if (f.type === "dateRange") {
        const inst = I.dateRange({
          container: slot, from: filterState[f.id]?.from, to: filterState[f.id]?.to,
          presets: f.presets,
          onChange: (v) => { filterState[f.id] = v; refresh(); }
        });
      }
    });

    /* ---------- Type switcher ---------- */
    wrap.querySelector('[data-role="type-switch"]').addEventListener("click", e => {
      const b = e.target.closest("[data-type]");
      if (!b) return;
      currentType = b.dataset.type;
      wrap.querySelectorAll('[data-type]').forEach(x => x.setAttribute("aria-selected", x.dataset.type === currentType ? "true" : "false"));
      refresh();
    });

    /* ---------- Filtrado ---------- */
    function applyFilters(rows) {
      return rows.filter(r => {
        for (const f of filters) {
          const fv = filterState[f.id];
          if (fv === null || fv === undefined || fv === "") continue;
          if (f.type === "select" && fv !== r[f.field]) return false;
          if (f.type === "multiselect" && fv.length > 0 && !fv.includes(r[f.field])) return false;
          if (f.type === "dateRange" && fv) {
            const dv = r[f.field];
            if (fv.from && dv < fv.from) return false;
            if (fv.to && dv > fv.to) return false;
          }
        }
        return true;
      });
    }

    /* ---------- Agregación temporal ---------- */
    function groupKey(row) {
      const v = row[groupField];
      if (!groupBy) return v;
      if (typeof v !== "string") return String(v);
      // YYYY-MM-DD
      if (groupBy === "month") return v.slice(0, 7);
      if (groupBy === "year")  return v.slice(0, 4);
      if (groupBy === "week") {
        const d = new Date(v);
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1);
        return d.toISOString().slice(0,10);
      }
      return v;
    }
    function groupLabel(key) {
      if (!groupBy || groupBy === "day") return key;
      if (groupBy === "month") {
        const [y,m] = key.split("-");
        const monthNames = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        return monthNames[Number(m)-1] + " " + y;
      }
      if (groupBy === "year")  return key;
      if (groupBy === "week")  return "Sem " + key;
      return key;
    }
    function aggregate(rows) {
      // Si no hay group field, devolver una sola categoría
      if (!groupField) {
        const total = rows.reduce((s, r) => s + (Number(r[valueField]) || 0), 0);
        return { labels: ["Total"], series: [{ name: "Total", data: [total] }] };
      }
      // Agrupar por X
      const groupKeys = [];
      const groupMap = {};
      rows.forEach(r => {
        const k = groupKey(r);
        if (!groupMap[k]) { groupMap[k] = {}; groupKeys.push(k); }
        const sk = seriesField ? r[seriesField] : "Total";
        groupMap[k][sk] = (groupMap[k][sk] || 0) + (Number(r[valueField]) || 0);
      });
      groupKeys.sort();
      // Series únicas
      const seriesNames = [];
      Object.values(groupMap).forEach(g => Object.keys(g).forEach(s => { if (!seriesNames.includes(s)) seriesNames.push(s); }));
      const seriesArr = seriesNames.map(name => ({
        name,
        data: groupKeys.map(k => groupMap[k][name] || 0)
      }));
      return { labels: groupKeys.map(groupLabel), series: seriesArr };
    }

    /* ---------- KPI calc ---------- */
    function calcMetrics(rows) {
      return metrics.map(m => {
        let val = 0;
        const field = m.field || valueField;
        if (m.agg === "count") val = rows.length;
        else if (m.agg === "sum") val = rows.reduce((s, r) => s + (Number(r[field]) || 0), 0);
        else if (m.agg === "avg") val = rows.length ? rows.reduce((s, r) => s + (Number(r[field]) || 0), 0) / rows.length : 0;
        else if (m.agg === "min") val = rows.length ? Math.min(...rows.map(r => Number(r[field]) || 0)) : 0;
        else if (m.agg === "max") val = rows.length ? Math.max(...rows.map(r => Number(r[field]) || 0)) : 0;
        return { label: m.label, value: val, formatter: m.formatter || fmt };
      });
    }

    /* ---------- Render principal ---------- */
    let chartInst = null;
    function refresh() {
      const filtered = applyFilters(data);
      // KPIs
      const kpis = calcMetrics(filtered);
      const kpiEl = wrap.querySelector('[data-role="kpis"]');
      kpiEl.innerHTML = kpis.map(k => `
        <div class="nc-dyn__kpi">
          <div class="nc-dyn__kpi-label">${esc(k.label)}</div>
          <div class="nc-dyn__kpi-value">${esc(k.formatter(k.value))}</div>
        </div>
      `).join("");

      // Body chart
      const body = wrap.querySelector('[data-role="body"]');
      body.innerHTML = "";
      if (chartInst) { destroyInstance(chartInst); chartInst = null; }

      const agg = aggregate(filtered);
      const bodyW = body.clientWidth, bodyH = body.clientHeight;
      // wrapper interno con altura 100%
      const innerHost = document.createElement("div");
      innerHost.style.width = "100%";
      innerHost.style.height = "100%";
      body.appendChild(innerHost);

      if (currentType === "bar" && agg.series.length === 1) {
        chartInst = bar({
          container: innerHost,
          data: agg.labels.map((l, i) => ({ label: l, value: agg.series[0].data[i] })),
          valueFormatter: fmt
        });
      } else if (currentType === "groupedBar" || (currentType === "bar" && agg.series.length > 1)) {
        chartInst = groupedBar({
          container: innerHost,
          xLabels: agg.labels,
          series: agg.series,
          valueFormatter: fmt
        });
      } else if (currentType === "stackedBar") {
        chartInst = stackedBar({
          container: innerHost,
          xLabels: agg.labels,
          series: agg.series,
          valueFormatter: fmt
        });
      } else if (currentType === "line") {
        chartInst = line({
          container: innerHost,
          xLabels: agg.labels,
          series: agg.series.map(s => ({ name: s.name, data: s.data.map((y, i) => ({ x: i, y })) })),
          valueFormatter: fmt
        });
      } else if (currentType === "area") {
        chartInst = area({
          container: innerHost,
          xLabels: agg.labels,
          series: agg.series.map(s => ({ name: s.name, data: s.data.map((y, i) => ({ x: i, y })) })),
          valueFormatter: fmt
        });
      } else if (currentType === "pie") {
        // Sumar series y mostrar categorías como porciones
        const pieData = agg.labels.map((l, i) => ({
          label: l,
          value: agg.series.reduce((s, ser) => s + (ser.data[i] || 0), 0)
        }));
        chartInst = pie({ container: innerHost, donut: true, data: pieData, valueFormatter: fmt });
      } else if (currentType === "funnel") {
        const funData = agg.labels.map((l, i) => ({
          label: l,
          value: agg.series.reduce((s, ser) => s + (ser.data[i] || 0), 0)
        })).sort((a,b) => b.value - a.value);
        chartInst = funnel({ container: innerHost, data: funData, valueFormatter: fmt });
      }

      const fEl = wrap.querySelector('[data-role="footer"]');
      fEl.innerHTML = `${filtered.length} registros · ${agg.labels.length} categorías${agg.series.length > 1 ? ' · ' + agg.series.length + ' series' : ''}`;
    }

    refresh();
    const inst = { el: wrap, refresh, destroy: () => { destroyInstance(inst); wrap.remove(); } };
    return registerInstance(inst);
  }

  /* ============================================================
     Export API
     ============================================================ */
  window.NodoComponents.Chart = {
    bar, line, area, pie,
    stackedBar, groupedBar,
    sparkline, gauge, funnel, heatmap,
    dynamic,
    themePalette
  };
  console.log("[NODO Shell] NodoComponents.Chart cargado (11 tipos + dynamic).");
})();
