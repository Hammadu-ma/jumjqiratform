const band = (rate) => (rate >= 85 ? 'var(--brand)' : rate >= 70 ? 'var(--gold)' : 'var(--danger)');

export default function AttendanceRing({ rate, size = 34, stroke = 3.5 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, rate));
  const offset = c - (pct / 100) * c;
  const color = band(pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(pct)}% attendance`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.29} fontFamily="'JetBrains Mono', monospace" fontWeight="600" fill={color}>
        {Math.round(pct)}
      </text>
    </svg>
  );
}
