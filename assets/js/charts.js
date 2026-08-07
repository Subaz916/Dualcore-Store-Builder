/* ============================================================
   DualCore — charts.js  (canvas-free SVG charts)
   ============================================================ */

const Charts = (() => {
  const NS = "http://www.w3.org/2000/svg";

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  };

  const theme = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    return {
      grid: dark ? "#22304A" : "#E7EBF3",
      axis: dark ? "#94A3B8" : "#64748B",
      text: dark ? "#E2E8F0" : "#0F172A",
      bg: "transparent",
    };
  };

  /* ---------- Line / Area chart ---------- */
  const line = (container, { labels = [], series = [], height = 240, format = (v) => v } = {}) => {
    if (!container) return;
    container.innerHTML = "";
    const W = Math.max(container.clientWidth || 640, 200);
    const H = height;
    const pad = { t: 16, r: 12, b: 32, l: 46 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

    let max = 0;
    series.forEach(s => (s.values || s.data || []).forEach(d => { if (d > max) max = d; }));
    if (!max) max = 1;
    const pow = 10 ** Math.floor(Math.log10(max));
    const niceMax = Math.ceil((max * 1.15) / pow) * pow;
    const n = labels.length || (series[0]?.values || []).length || 2;
    const px = (i) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
    const py = (v) => pad.t + ih - (v / niceMax) * ih;

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", class: "chart-svg" }, container);

    // gridlines + y labels
    const T = theme();
    const ticks = 4;
    for (let g = 0; g <= ticks; g++) {
      const y = pad.t + (ih / ticks) * g;
      const v = niceMax * (1 - g / ticks);
      el("line", { x1: pad.l, x2: W - pad.r, y1: y, y2: y, stroke: T.grid, "stroke-width": 1, "stroke-dasharray": g === ticks ? "0" : "4 4" }, svg);
      el("text", { x: pad.l - 8, y: y + 4, "text-anchor": "end", "font-size": 10, fill: T.axis }, svg).textContent = format(v);
    }
    // x labels (sampled)
    const step = Math.max(1, Math.ceil(n / 8));
    labels.forEach((lb, i) => {
      if (i % step !== 0 && i !== n - 1) return;
      el("text", { x: px(i), y: H - 8, "text-anchor": "middle", "font-size": 10, fill: T.axis }, svg).textContent = lb;
    });

    // data series
    series.forEach((s, si) => {
      let d = s.values.map((v, i) => `${si ? "L" : "M"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
      const path = el("path", { d, fill: "none", stroke: s.color, "stroke-width": 2.75, "class": "chart-line", "stroke-linecap": "round" }, svg);
      path.style.filter = `drop-shadow(0 3px 8px ${s.color}44)`;

      if (s.area !== false) {
        const dClip = pad.t + ih + 1;
        el("path", { d: d + ` L${px(n - 1).toFixed(1)},${dClip} L${px(0).toFixed(1)},${dClip} Z`, fill: s.color, class: "chart-area", opacity: ".1" }, svg);
      }

      // points + tooltips
      s.values.forEach((v, i) => {
        const g = el("g", { class: "chart-point", cursor: "pointer" }, svg);
        el("title", {}, g).textContent = `${labels[i]}: ${format(v)}`;
        el("circle", { cx: px(i), cy: py(v), r: 3.5, fill: "var(--white)", stroke: s.color, "stroke-width": 2.5 }, g);
      });
    });

    return svg;
  };

  /* ---------- Donut ---------- */
  const donut = (container, { data = [], size = 190, thickness = 26, format = (v) => v + "" } = {}) => {
    if (!container) return;
    container.innerHTML = "";
    const R = (size / 2) - thickness;
    const C = 2 * Math.PI * R;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const svg = el("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size, class: "chart-svg" }, container);

    let offset = 0;
    data.forEach(d => {
      const frac = d.value / total;
      if (frac <= 0) return;
      const circ = el("circle", {
        cx: size / 2, cy: size / 2, r: R, fill: "none", stroke: d.color,
        "stroke-width": thickness, "stroke-dasharray": `${frac * C} ${C - frac * C}`,
        "stroke-dashoffset": -offset * C, "stroke-linecap": "round",
      }, svg);
      offset += frac;
    });

    const center = el("text", {
      x: size / 2, y: size / 2 - 6, "text-anchor": "middle",
      "font-size": 26, "font-weight": 800, fill: themeVal("ink"),
    }, svg);
    center.textContent = format(Math.round(total));
    const lbl = el("text", { x: size / 2, y: size / 2 + 16, "text-anchor": "middle", "font-size": 11, fill: themeVal("muted") }, svg);
    lbl.textContent = "visitors";

    function themeVal(k) {
      const dark = document.documentElement.dataset.theme === "dark";
      return {
        ink: dark ? "#F8FAFC" : "#0F172A",
        muted: dark ? "#94A3B8" : "#64748B",
      }[k];
    }
  };

  /* ---------- Sparkline (tiny inline line) ---------- */
  const spark = (container, values, color = "#5C6EFF", height = 40) => {
    if (!container) return;
    container.innerHTML = "";
    const W = Math.max(container.clientWidth || 120, 60);
    const max = Math.max(...values, 1);
    const pad = 4;
    const pts = values.map((v, i) => {
      const x = pad + (i / (values.length - 1 || 1)) * (W - pad * 2);
      const y = (height - pad * 2) - (v / max) * (height - pad * 2) + pad;
      return `${x},${y}`;
    }).join(" ");
    const svg = el("svg", { viewBox: `0 0 ${W} ${height}`, width: "100%", height: height }, container);
    el("polyline", { points: pts, fill: "none", stroke: color, "stroke-width": 2, "stroke-linecap": "round" }, svg);
  };

  /* ---------- Bars (vertical) ---------- */
  const bars = (container, { labels = [], values = [], color = "#5C6EFF", height = 160 } = {}) => {
    if (!container) return;
    container.innerHTML = "";
    const W = Math.max(container.clientWidth || 200, 100);
    const max = Math.max(...values, 1);
    const svg = el("svg", { viewBox: `0 0 ${W} ${height}`, width: "100%" }, container);
    const bw = W / values.length * 0.55;
    values.forEach((v, i) => {
      const h = (v / max) * (height - 20);
      const x = (i + 0.225) * (W / values.length);
      el("rect", { x, y: height - h - 12, width: bw, height: h, rx: 4, fill: color, opacity: .85 }, svg);
      // label
      const onlyEvery = Math.ceil(values.length / 6);
      if (i % onlyEvery === 0) {
        el("text", { x: x + bw / 2, y: height - 4, "text-anchor": "middle", "font-size": 8, fill: theme().axis }, svg).textContent = labels[i];
      }
    });
  };

  return { line, donut, spark, bars };
})();

window.Charts = Charts;