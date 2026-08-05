import { valueToColor, SLICE_COLORS } from '../../utils/colorScale';

const WIDTH = 620;
const HEIGHT = 280;
const PAD = { top: 20, right: 20, bottom: 46, left: 56 };

function niceMax(n) {
  if (n <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(n));
  return Math.ceil(n / magnitude) * magnitude;
}

function truncate(label, max = 12) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export function BarChartSVG({ rows, valueLabelFn }) {
  if (rows.length === 0) return null;
  const values = rows.map((r) => r.value);
  const min = Math.min(...values, 0);
  const max = niceMax(Math.max(...values));
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const barGap = 14;
  const barW = Math.max(14, innerW / rows.length - barGap);
  const yFor = (v) => PAD.top + innerH - (v / max) * innerH;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="chart-svg" role="img">
      {gridLines.map((g) => {
        const y = PAD.top + innerH - g * innerH;
        return (
          <g key={g}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} stroke="#e2dfd6" strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="9" fill="#6b7280">
              {Math.round(max * g)}
            </text>
          </g>
        );
      })}
      {rows.map((row, i) => {
        const x = PAD.left + i * (barW + barGap) + barGap / 2;
        const y = yFor(row.value);
        const h = PAD.top + innerH - y;
        const color = valueToColor(row.value, min, max);
        return (
          <g key={row.label}>
            <rect x={x} y={y} width={barW} height={Math.max(0, h)} fill={color} rx="2" />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="#171d29">
              {valueLabelFn ? valueLabelFn(row.value) : row.value}
            </text>
            <text x={x + barW / 2} y={HEIGHT - PAD.bottom + 16} textAnchor="middle" fontSize="9.5" fill="#6b7280">
              {truncate(row.label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function LineChartSVG({ rows, valueLabelFn }) {
  if (rows.length === 0) return null;
  const values = rows.map((r) => r.value);
  const max = niceMax(Math.max(...values));
  const min = Math.min(...values, 0);
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const stepX = rows.length > 1 ? innerW / (rows.length - 1) : 0;
  const yFor = (v) => PAD.top + innerH - (v / max) * innerH;
  const xFor = (i) => PAD.left + i * stepX;
  const points = rows.map((r, i) => `${xFor(i)},${yFor(r.value)}`).join(' ');
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="chart-svg" role="img">
      {gridLines.map((g) => {
        const y = PAD.top + innerH - g * innerH;
        return (
          <g key={g}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} stroke="#e2dfd6" strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="9" fill="#6b7280">
              {Math.round(max * g)}
            </text>
          </g>
        );
      })}
      <polyline points={points} fill="none" stroke="#3454d1" strokeWidth="2.5" />
      {rows.map((row, i) => (
        <g key={row.label}>
          <circle cx={xFor(i)} cy={yFor(row.value)} r="4.5" fill={valueToColor(row.value, min, max)} stroke="#fff" strokeWidth="1.5" />
          <text x={xFor(i)} y={yFor(row.value) - 10} textAnchor="middle" fontSize="10" fontWeight="600" fill="#171d29">
            {valueLabelFn ? valueLabelFn(row.value) : row.value}
          </text>
          <text x={xFor(i)} y={HEIGHT - PAD.bottom + 16} textAnchor="middle" fontSize="9.5" fill="#6b7280">
            {truncate(row.label)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function PieChartSVG({ rows, valueLabelFn, donut }) {
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, r) => sum + r.value, 0) || 1;
  const cx = 130;
  const cy = HEIGHT / 2;
  const rOuter = 90;
  const rInner = donut ? 50 : 0;
  let angle = -Math.PI / 2;

  const slices = rows.map((row, i) => {
    const fraction = row.value / total;
    const startAngle = angle;
    const endAngle = angle + fraction * Math.PI * 2;
    angle = endAngle;
    const color = SLICE_COLORS[i % SLICE_COLORS.length];
    return { row, startAngle, endAngle, color, fraction };
  });

  const arcPath = (startAngle, endAngle) => {
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = cx + rOuter * Math.cos(startAngle);
    const y1 = cy + rOuter * Math.sin(startAngle);
    const x2 = cx + rOuter * Math.cos(endAngle);
    const y2 = cy + rOuter * Math.sin(endAngle);
    if (rInner === 0) {
      return `M ${cx} ${cy} L ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }
    const ix1 = cx + rInner * Math.cos(startAngle);
    const iy1 = cy + rInner * Math.sin(startAngle);
    const ix2 = cx + rInner * Math.cos(endAngle);
    const iy2 = cy + rInner * Math.sin(endAngle);
    return `M ${ix1} ${iy1} L ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${rInner} ${rInner} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
  };

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="chart-svg" role="img">
      {slices.map((s) => (
        <path key={s.row.label} d={arcPath(s.startAngle, s.endAngle)} fill={s.color} stroke="#fbfaf7" strokeWidth="1.5" />
      ))}
      <g transform={`translate(${cx * 2 - 10}, 30)`}>
        {rows.map((row, i) => (
          <g key={row.label} transform={`translate(0, ${i * 20})`}>
            <rect width="10" height="10" rx="2" fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
            <text x="16" y="9" fontSize="10.5" fill="#171d29">
              {truncate(row.label, 16)} — {valueLabelFn ? valueLabelFn(row.value) : row.value} ({Math.round((row.value / total) * 100)}%)
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
