/* ============================================================
   NODO Shell — NodoComponents.Chart
   ============================================================
   Gráficos SVG vanilla, tema-aware, sin librerías externas.

   Uso:
     NodoComponents.Chart.bar({
       container, title, data: [{ label, value, color? }, ...],
       valueFormatter: (n) => "Gs. " + n,
       horizontal: false   // bar horizontal o vertical
     });
     NodoComponents.Chart.line({
       container, title, series: [{ name, color, data: [{x, y}, ...] }],
       xLabels: ["Ene","Feb",...],
       valueFormatter, area: true
     });
     NodoComponents.Chart.pie({
       container, title, data: [{ label, value, color? }],
       donut: true, valueFormatter
     });
   ============================================================ */

(function () {
  "use strict";

  window.NodoComponents = window.NodoComponents || {};

  // Paleta default (los colores se cyclan si no se especifican)
  const PALETTE = [
    "#1e6bb0", "#4a7d28", "#d4a106", "#a40000",
    "#6b3fa0", "#2d8a8a", "#c97f1e", "#5a8a3d",
    "#7a1818", "#1f5a8a"
  ];
  function paletteColor(i) { return PALETTE[i % PALETTE.length]; }

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

  function showTooltip(tooltip, html, x, y) {
    tooltip.innerHTML = html;
    tooltip.style.left = (x + 10) + "px";
    tooltip.style.top  = (y - 28) + "px";
    tooltip.classList.add("is-visible");
  }
  function hideTooltip(tooltip) { tooltip.classList.remove("is-visible"); }

  function addLegend(wrap, items, fmt) {
    if (items.length === 0) return;
    const lg = document.createElement("div");
    lg.className = "nc-chart__legend";
    lg.innerHTML = items.map(it => `
      <span class="nc-chart__legend-item">
        <span class="nc-chart__legend-swatch" style="background:${esc(it.color)};"></span>
        ${esc(it.label)}
        ${it.value !== undefined ? `<span class="nc-chart__legend-value">${esc(fmt(it.value))}</span>` : ""}
      </span>
    `).join("");
    wrap.appendChild(lg);
  }

  /* ============================================================
     BAR (vertical or horizontal)
     ============================================================ */
  function bar(opts) {
    const data = opts.data || [];
    const fmt = opts.valueFormatter || fmtNum;
    const horizontal = !!opts.horizontal;
    const { wrap, vp, tooltip } = shellWrap(opts, "bar");

    function render() {
      const w = vp.clientWidth || 600;
      const h = vp.clientHeight || 300;
      const padL = horizontal ? 110 : 38;
      const padR = 16;
      const padT = 12;
      const padB = horizontal ? 30 : 50;
      const innerW = w - padL - padR;
      const innerH = h - padT - padB;
      const max = Math.max(...data.map(d => d.value), 1);
      const niceMax = niceCeil(max);
      const ticks = 5;

      let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">`;

      // Grid + ejes
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

      // Bars
      const bandSize = (horizontal ? innerH : innerW) / data.length;
      const barSize = bandSize * 0.7;
      const offset = (bandSize - barSize) / 2;

      data.forEach((d, i) => {
        const color = d.color || paletteColor(i);
        if (horizontal) {
          const len = innerW * (d.value / niceMax);
          const y = padT + bandSize * i + offset;
          svg += `<rect class="nc-bar" x="${padL}" y="${y}" width="${len}" height="${barSize}" fill="${esc(color)}" data-i="${i}"/>`;
          svg += `<text x="${padL - 6}" y="${y + barSize/2 + 3}" text-anchor="end" font-size="10">${esc(d.label)}</text>`;
          if (len > 50) {
            svg += `<text x="${padL + len - 6}" y="${y + barSize/2 + 3}" text-anchor="end" font-size="10" fill="#fff" font-weight="600">${esc(fmt(d.value))}</text>`;
          }
        } else {
          const len = innerH * (d.value / niceMax);
          const x = padL + bandSize * i + offset;
          const y = padT + innerH - len;
          svg += `<rect class="nc-bar" x="${x}" y="${y}" width="${barSize}" height="${len}" fill="${esc(color)}" data-i="${i}"/>`;
          // Etiqueta abajo (rotada si hay muchos)
          const rot = data.length > 6 ? -25 : 0;
          svg += `<text x="${x + barSize/2}" y="${padT + innerH + 14}" text-anchor="${rot ? 'end' : 'middle'}" font-size="10"
                       transform="rotate(${rot} ${x + barSize/2} ${padT + innerH + 14})">${esc(d.label)}</text>`;
          if (len > 16) {
            svg += `<text x="${x + barSize/2}" y="${y + 12}" text-anchor="middle" font-size="10" fill="#fff" font-weight="600">${esc(fmt(d.value))}</text>`;
          }
        }
      });

      svg += `</svg>`;
      vp.innerHTML = svg;

      // Tooltip
      vp.querySelectorAll(".nc-bar").forEach(b => {
        b.addEventListener("mousemove", e => {
          const i = Number(b.dataset.i);
          const d = data[i];
          const rect = vp.getBoundingClientRect();
          showTooltip(tooltip, `${esc(d.label)}: <strong>${esc(fmt(d.value))}</strong>`, e.clientX - rect.left, e.clientY - rect.top);
        });
        b.addEventListener("mouseleave", () => hideTooltip(tooltip));
        b.addEventListener("click", () => {
          if (opts.onClick) opts.onClick(data[Number(b.dataset.i)]);
        });
      });
    }
    render();
    window.addEventListener("resize", render);
    return { el: wrap, refresh: render, destroy: () => wrap.remove() };
  }

  /* ============================================================
     LINE (con opcional area)
     ============================================================ */
  function line(opts) {
    const series = opts.series || [];
    const xLabels = opts.xLabels || [];
    const fmt = opts.valueFormatter || fmtNum;
    const area = !!opts.area;
    const { wrap, vp, tooltip } = shellWrap(opts, "line");

    function render() {
      const w = vp.clientWidth || 600;
      const h = vp.clientHeight || 300;
      const padL = 38, padR = 16, padT = 12, padB = 30;
      const innerW = w - padL - padR;
      const innerH = h - padT - padB;

      let allValues = [];
      series.forEach(s => s.data.forEach(p => allValues.push(p.y)));
      const max = Math.max(...allValues, 1);
      const niceMax = niceCeil(max);
      const min = Math.min(...allValues, 0);
      const ticks = 5;

      const numPoints = Math.max(...series.map(s => s.data.length), 1);

      let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">`;
      // Grid
      for (let i = 0; i <= ticks; i++) {
        const y = padT + innerH - (innerH * i / ticks);
        const v = niceMax * i / ticks;
        svg += `<line class="nc-grid-line" x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}"/>`;
        svg += `<text class="nc-axis-label" x="${padL - 6}" y="${y + 3}" text-anchor="end">${esc(fmt(v))}</text>`;
      }
      svg += `<line class="nc-axis-line" x1="${padL}" y1="${padT + innerH}" x2="${w - padR}" y2="${padT + innerH}"/>`;
      // X labels
      const stepX = numPoints > 1 ? innerW / (numPoints - 1) : innerW;
      for (let i = 0; i < numPoints; i++) {
        const x = padL + stepX * i;
        const lbl = xLabels[i] || "";
        if (lbl) svg += `<text class="nc-axis-label" x="${x}" y="${padT + innerH + 14}" text-anchor="middle">${esc(lbl)}</text>`;
      }

      const legend = [];
      series.forEach((s, sIdx) => {
        const color = s.color || paletteColor(sIdx);
        const pts = s.data.map((p, i) => {
          const x = padL + stepX * i;
          const y = padT + innerH - innerH * (p.y / niceMax);
          return { x, y, p };
        });
        const path = pts.map((q, i) => (i === 0 ? "M" : "L") + q.x + " " + q.y).join(" ");
        if (area && pts.length > 0) {
          const areaPath = path + ` L ${pts[pts.length-1].x} ${padT + innerH} L ${pts[0].x} ${padT + innerH} Z`;
          svg += `<path class="nc-area" d="${areaPath}" fill="${esc(color)}"/>`;
        }
        svg += `<path class="nc-line" d="${path}" stroke="${esc(color)}"/>`;
        pts.forEach((q, i) => {
          svg += `<circle class="nc-dot" cx="${q.x}" cy="${q.y}" r="3" fill="${esc(color)}" data-s="${sIdx}" data-i="${i}"/>`;
        });
        legend.push({ label: s.name || ("Serie " + (sIdx+1)), color });
      });

      svg += `</svg>`;
      vp.innerHTML = svg;
      vp.querySelectorAll(".nc-dot").forEach(d => {
        d.addEventListener("mousemove", e => {
          const sIdx = Number(d.dataset.s), i = Number(d.dataset.i);
          const p = series[sIdx].data[i];
          const rect = vp.getBoundingClientRect();
          showTooltip(tooltip, `${esc(series[sIdx].name || "")} ${esc(xLabels[i] || "")}: <strong>${esc(fmt(p.y))}</strong>`, e.clientX - rect.left, e.clientY - rect.top);
        });
        d.addEventListener("mouseleave", () => hideTooltip(tooltip));
      });

      // Reset legend
      const oldLg = wrap.querySelector(".nc-chart__legend");
      if (oldLg) oldLg.remove();
      addLegend(wrap, legend, fmt);
    }
    render();
    window.addEventListener("resize", render);
    return { el: wrap, refresh: render, destroy: () => wrap.remove() };
  }

  /* ============================================================
     PIE / DONUT
     ============================================================ */
  function pie(opts) {
    const data = opts.data || [];
    const donut = !!opts.donut;
    const fmt = opts.valueFormatter || fmtNum;
    const { wrap, vp, tooltip } = shellWrap(opts, "pie");

    function render() {
      const w = vp.clientWidth || 400;
      const h = vp.clientHeight || 300;
      const cx = w/2, cy = h/2;
      const r = Math.min(w, h) / 2 - 16;
      const rInner = donut ? r * 0.55 : 0;
      const total = data.reduce((s, d) => s + d.value, 0) || 1;

      let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">`;
      let acc = 0;
      const legend = [];
      data.forEach((d, i) => {
        const color = d.color || paletteColor(i);
        const startA = (acc / total) * Math.PI * 2 - Math.PI/2;
        const endA   = ((acc + d.value) / total) * Math.PI * 2 - Math.PI/2;
        acc += d.value;
        const x1 = cx + Math.cos(startA) * r;
        const y1 = cy + Math.sin(startA) * r;
        const x2 = cx + Math.cos(endA) * r;
        const y2 = cy + Math.sin(endA) * r;
        const large = (endA - startA) > Math.PI ? 1 : 0;
        let path;
        if (donut) {
          const ix1 = cx + Math.cos(startA) * rInner;
          const iy1 = cy + Math.sin(startA) * rInner;
          const ix2 = cx + Math.cos(endA) * rInner;
          const iy2 = cy + Math.sin(endA) * rInner;
          path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${rInner} ${rInner} 0 ${large} 0 ${ix1} ${iy1} Z`;
        } else {
          path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        }
        svg += `<path class="nc-pie-slice" d="${path}" fill="${esc(color)}" data-i="${i}"/>`;
        // Etiqueta sólo si la porción es grande
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
      // Centro del donut: total
      if (donut) {
        svg += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="10" fill="#888">Total</text>`;
        svg += `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="14" font-weight="700">${esc(fmt(total))}</text>`;
      }
      svg += `</svg>`;
      vp.innerHTML = svg;
      vp.querySelectorAll(".nc-pie-slice").forEach(s => {
        s.addEventListener("mousemove", e => {
          const i = Number(s.dataset.i);
          const d = data[i];
          const pct = ((d.value / total) * 100).toFixed(1) + "%";
          const rect = vp.getBoundingClientRect();
          showTooltip(tooltip, `${esc(d.label)}: <strong>${esc(fmt(d.value))}</strong> (${pct})`, e.clientX - rect.left, e.clientY - rect.top);
        });
        s.addEventListener("mouseleave", () => hideTooltip(tooltip));
        s.addEventListener("click", () => { if (opts.onClick) opts.onClick(data[Number(s.dataset.i)]); });
      });

      const oldLg = wrap.querySelector(".nc-chart__legend");
      if (oldLg) oldLg.remove();
      addLegend(wrap, legend, fmt);
    }
    render();
    window.addEventListener("resize", render);
    return { el: wrap, refresh: render, destroy: () => wrap.remove() };
  }

  /* ---------- niceCeil para max de eje ---------- */
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

  window.NodoComponents.Chart = { bar, line, pie };
  console.log("[NODO Shell] NodoComponents.Chart cargado.");
})();
