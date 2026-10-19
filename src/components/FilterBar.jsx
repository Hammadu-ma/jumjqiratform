export default function FilterBar({
  query, onQuery,
  departments, department, onDepartment,
  batches, batch, onBatch,
  gender, onGender,
}) {
  return (
    <>
      <div className="search-row">
        <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          inputMode="search"
          placeholder="Search by name, phone, or email"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>

      <div className="chip-group chip-row">
        <button className={`chip ${department === 'all' ? 'active' : ''}`} onClick={() => onDepartment('all')}>
          All departments
        </button>
        {departments.map((d) => (
          <button key={d} className={`chip ${department === d ? 'active' : ''}`} onClick={() => onDepartment(d)}>
            {d}
          </button>
        ))}
      </div>

      <div className="chip-group chip-row">
        <button className={`chip ${batch === 'all' ? 'active' : ''}`} onClick={() => onBatch('all')}>
          Every batch
        </button>
        {batches.map((b) => (
          <button key={b} className={`chip ${batch === b ? 'active' : ''}`} onClick={() => onBatch(b)}>
            {b}
          </button>
        ))}
        <button className={`chip ${gender === 'F' ? 'active' : ''}`} onClick={() => onGender(gender === 'F' ? 'all' : 'F')}>
          Sisters
        </button>
        <button className={`chip ${gender === 'M' ? 'active' : ''}`} onClick={() => onGender(gender === 'M' ? 'all' : 'M')}>
          Brothers
        </button>
      </div>
    </>
  );
}
