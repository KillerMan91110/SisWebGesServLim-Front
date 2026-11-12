import { useEffect, useRef, useState } from "react";

// Gráficos livianos en SVG/HTML, sin dependencias. Una sola serie por gráfico
// (color primario), ejes y grillas tenues, tooltip al pasar el mouse o tocar.

function useAncho(ref, inicial = 600) {
  const [ancho, setAncho] = useState(inicial);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(([entry]) => setAncho(entry.contentRect.width));
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return ancho;
}

function pasoBonito(max) {
  if (max <= 4) return 1;
  const bruto = max / 4;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const n = bruto / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

/**
 * Serie temporal como área + línea. data: [{ x: 'YYYY-MM-DD', y: number }]
 */
export function AreaChart({ data, height = 220, formatX, etiqueta = "Solicitudes" }) {
  const ref = useRef(null);
  const ancho = useAncho(ref);
  const [hover, setHover] = useState(null);

  const m = { top: 12, right: 12, bottom: 26, left: 32 };
  const w = Math.max(ancho - m.left - m.right, 10);
  const h = height - m.top - m.bottom;
  const maxY = Math.max(...data.map((d) => d.y), 1);
  const paso = pasoBonito(maxY);
  const tope = Math.ceil(maxY / paso) * paso;
  const ticks = [];
  for (let v = 0; v <= tope; v += paso) ticks.push(v);

  const x = (i) => (data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w);
  const y = (v) => h - (v / tope) * h;
  const linea = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.y)}`).join(" ");
  const area = data.length ? `${linea} L${x(data.length - 1)},${h} L${x(0)},${h} Z` : "";
  const cadaN = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(w / 70))));

  function mover(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - m.left;
    const i = Math.round((px / w) * (data.length - 1));
    setHover(Math.min(Math.max(i, 0), data.length - 1));
  }

  const punto = hover !== null ? data[hover] : null;

  return (
    <div ref={ref} className="chart" style={{ height }}>
      <svg
        width={ancho}
        height={height}
        role="img"
        aria-label={`${etiqueta} por día`}
        onMouseMove={mover}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="area-relleno" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <g transform={`translate(${m.left},${m.top})`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={w} y1={y(t)} y2={y(t)} className="chart-grid" />
              <text x={-8} y={y(t)} dy="0.32em" textAnchor="end" className="chart-axis">
                {t}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % cadaN === 0 ? (
              <text key={d.x} x={x(i)} y={h + 18} textAnchor="middle" className="chart-axis">
                {formatX ? formatX(d.x) : d.x}
              </text>
            ) : null
          )}
          <path d={area} fill="url(#area-relleno)" />
          <path d={linea} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
          {punto && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={0} y2={h} className="chart-crosshair" />
              <circle cx={x(hover)} cy={y(punto.y)} r="5" fill="var(--primary)" stroke="var(--surface)" strokeWidth="2" />
            </>
          )}
        </g>
      </svg>
      {punto && (
        <div
          className="chart-tooltip"
          style={{
            left: Math.min(Math.max(m.left + x(hover), 70), ancho - 70),
            top: m.top + y(punto.y) - 12,
          }}
        >
          <span>{formatX ? formatX(punto.x, true) : punto.x}</span>
          <strong>
            {punto.y} {etiqueta.toLowerCase()}
          </strong>
        </div>
      )}
    </div>
  );
}

/**
 * Barras horizontales con etiqueta a la izquierda y valor a la derecha.
 * items: [{ label, value, hint?, icon? }]
 */
export function BarList({ items, formatValue = (v) => v, vacio = "Sin datos en este periodo." }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0 || items.every((i) => i.value === 0)) {
    return <p className="chart-empty">{vacio}</p>;
  }
  return (
    <ul className="barlist">
      {items.map((it) => (
        <li key={it.label} className="barlist-row" title={`${it.label}: ${formatValue(it.value)}${it.hint ? ` · ${it.hint}` : ""}`}>
          <div className="barlist-label">
            {it.icon && <span aria-hidden="true">{it.icon}</span>}
            <span>{it.label}</span>
          </div>
          <div className="barlist-track">
            <div className="barlist-fill" style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
          <div className="barlist-value">
            {formatValue(it.value)}
            {it.hint && <small>{it.hint}</small>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Barra de proporción entre dos partes (ej. domicilio vs consultorio). */
export function SplitBar({ partes }) {
  const total = partes.reduce((a, p) => a + p.value, 0);
  if (!total) return <p className="chart-empty">Sin datos en este periodo.</p>;
  return (
    <div>
      <div className="splitbar" role="img" aria-label={partes.map((p) => `${p.label} ${p.value}`).join(", ")}>
        {partes.map((p, i) =>
          p.value ? (
            <div
              key={p.label}
              className={`splitbar-seg splitbar-seg--${i}`}
              style={{ flexGrow: p.value }}
              title={`${p.label}: ${p.value}`}
            />
          ) : null
        )}
      </div>
      <ul className="splitbar-legend">
        {partes.map((p, i) => (
          <li key={p.label}>
            <span className={`legend-swatch splitbar-seg--${i}`} />
            {p.icon} {p.label}
            <strong>
              {p.value} ({Math.round((p.value / total) * 100)}%)
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
