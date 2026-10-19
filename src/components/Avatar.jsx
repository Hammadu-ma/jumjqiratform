function initials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export default function Avatar({ name, size = 'sm' }) {
  const className = size === 'lg' ? 'sheet-avatar' : 'avatar';
  return <div className={className}>{initials(name)}</div>;
}
