export default function ShieldArt() {
  return (
    <svg viewBox="0 0 240 200" role="img" aria-label="Secure student portal" className="shield-art">
      <defs>
        <linearGradient id="sa-shield" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b8294d" /><stop offset=".55" stopColor="#7a1230" /><stop offset="1" stopColor="#4a0a1c" /></linearGradient>
        <linearGradient id="sa-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6b8c8" /><stop offset="1" stopColor="#8b1535" /></linearGradient>
        <linearGradient id="sa-base" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbe3ea" /><stop offset="1" stopColor="#e7a9bb" /></linearGradient>
        <radialGradient id="sa-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#f4b6c6" stopOpacity=".55" /><stop offset="1" stopColor="#f4b6c6" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="120" cy="100" rx="110" ry="90" fill="url(#sa-glow)" />
      <ellipse cx="120" cy="124" rx="104" ry="28" fill="none" stroke="#8b1535" strokeOpacity=".22" transform="rotate(-10 120 124)" />
      <circle cx="26" cy="140" r="4" fill="#b8294d" /><circle cx="212" cy="100" r="3" fill="#8b1535" opacity=".6" />
      <ellipse cx="120" cy="182" rx="74" ry="16" fill="url(#sa-base)" />
      <ellipse cx="120" cy="176" rx="58" ry="12" fill="#fff4f7" opacity=".9" />
      <path d="M120 18l62 22v56c0 36-26 58-62 72-36-14-62-36-62-72V40z" fill="url(#sa-rim)" />
      <path d="M120 26l55 19v51c0 32-23 52-55 65-32-13-55-33-55-65V45z" fill="url(#sa-shield)" />
      <path d="M120 26l55 19v20c-20 10-38 12-55 4-17 8-35 6-55-4V45z" fill="#fff" opacity=".1" />
      <path d="M104 92V82a16 16 0 0 1 32 0v10" fill="none" stroke="#fbe3ea" strokeWidth="7" strokeLinecap="round" />
      <rect x="96" y="90" width="48" height="38" rx="10" fill="#fbe3ea" />
      <circle cx="120" cy="105" r="5.5" fill="#7a1230" /><rect x="117.8" y="107" width="4.4" height="12" rx="2" fill="#7a1230" />
    </svg>
  );
}
