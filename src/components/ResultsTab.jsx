function ord(n) {
  const m = n % 100;
  if (m >= 11 && m <= 13) return n + 'th';
  return n + (['th', 'st', 'nd', 'rd'][n % 10] || 'th');
}

function rankBadgeClass(rank) {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return '';
}

export default function ResultsTab({ subjects, results }) {
  if (results.loading) return <div className="tab-pane"><Empty glyph="fa-spinner fa-spin" title="Loading results" /></div>;
  if (results.error) return <div className="tab-pane"><Empty glyph="fa-triangle-exclamation" title="Could not load results" sub={results.error} /></div>;

  const graded = subjects.filter((s) => results.bySlug[s.slug] && results.bySlug[s.slug].total !== null);
  if (!graded.length) {
    return <div className="tab-pane"><Empty glyph="fa-file-lines" title="No results entered yet" sub="Scores your teachers enter will show up here as soon as they're saved." /></div>;
  }

  const pcts = graded.map((s) => {
    const r = results.bySlug[s.slug];
    return r.maxTotal ? (r.total / r.maxTotal) * 100 : null;
  }).filter((p) => p !== null);
  const overallAvg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;

  return (
    <div className="tab-pane">
      <div className="stat-grid" style={{ padding: 0, marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-label">Average</div>
          <div className="stat-value">{overallAvg === null ? '—' : `${overallAvg}%`}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Graded</div>
          <div className="stat-value">{graded.length}/{subjects.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Subjects</div>
          <div className="stat-value">{subjects.length}</div>
        </div>
      </div>

      {graded.map((s) => {
        const r = results.bySlug[s.slug];
        const pct = r.maxTotal ? (r.total / r.maxTotal) * 100 : null;

        return (
          <section className="card" key={s.slug}>
            <div className="subj-card-head">
              <div>
                <div className="subj-card-name">{s.name}</div>
                <div className="subj-card-sub">
                  {r.total?.toFixed(2)} / {r.maxTotal}
                  {!r.complete && <span style={{ color: 'var(--gold)' }}> · partial</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {r.rank && (
                  <span className={`rank-badge ${rankBadgeClass(r.rank)}`}>{ord(r.rank)}</span>
                )}
                <span className="grade-pct">{pct === null ? '—' : `${Math.round(pct)}%`}</span>
              </div>
            </div>

            {r.rank && r.totalWithRecords && (
              <div className="subj-card-sub" style={{ marginBottom: 12 }}>
                Rank {r.rank} of {r.totalWithRecords}
                {r.cohortAvg !== null && ` · cohort average ${r.cohortAvg}`}
              </div>
            )}

            <div className="comp-list">
              {r.components.map((c) => (
                <div className="comp-row" key={c.key}>
                  <div className="comp-row-top">
                    <span className="comp-label">{c.label}</span>
                    <span className="mono comp-score">{c.raw ?? '—'}/{c.max}</span>
                  </div>
                  <div className="comp-track">
                    <div
                      className="comp-fill"
                      style={{ width: `${c.max ? Math.min(100, ((c.raw || 0) / c.max) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Empty({ glyph, title, sub }) {
  return (
    <div className="empty">
      <div className="glyph"><i className={`fa-solid ${glyph}`} /></div>
      <div className="title">{title}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
