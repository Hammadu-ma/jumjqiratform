import { useMemo, useState } from 'react';
import AttendanceRing from './AttendanceRing.jsx';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_LABEL = { present: 'Present', late: 'Late', excused: 'Excused', absent: 'Absent' };
const dayOf = (dateStr) => new Date(dateStr + 'T00:00:00').getDay();

function buildView(items, subjectsBySlug) {
  const bySubj = new Map();
  items.forEach((it) => {
    const name = subjectsBySlug.get(it.subjectSlug) || it.subjectSlug;
    if (!bySubj.has(it.subjectSlug)) bySubj.set(it.subjectSlug, { slug: it.subjectSlug, name, items: [] });
    bySubj.get(it.subjectSlug).items.push(it);
  });
  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  items.forEach((it) => { if (counts[it.status] != null) counts[it.status]++; });
  const total = items.length;
  const rate = total ? Math.round(((total - counts.absent) / total) * 100) : null;
  return { items, total, counts, rate, subjects: [...bySubj.values()].sort((a, b) => a.name.localeCompare(b.name)) };
}

export default function AttendanceTab({ subjects, attendance }) {
  const [day, setDay] = useState('all');
  const subjectsBySlug = useMemo(() => new Map(subjects.map((s) => [s.slug, s.name])), [subjects]);
  const view = useMemo(
    () => buildView(day === 'all' ? attendance.items : attendance.items.filter((it) => dayOf(it.date) === day), subjectsBySlug),
    [attendance.items, day, subjectsBySlug]
  );

  if (attendance.loading) return <div className="tab-pane"><Empty glyph="fa-spinner fa-spin" title="Loading attendance" /></div>;
  if (attendance.error) return <div className="tab-pane"><Empty glyph="fa-triangle-exclamation" title="Could not load attendance" sub={attendance.error} /></div>;
  if (!attendance.items.length) {
    return <div className="tab-pane"><Empty glyph="fa-clipboard" title="No attendance recorded yet" sub="Sessions taken in your subjects will show up here." /></div>;
  }

  return (
    <div className="tab-pane">
      <div className="chip-row">
        <button className={`chip ${day === 'all' ? 'active' : ''}`} onClick={() => setDay('all')}>All days</button>
        {DAY_LABELS.map((label, idx) => (
          <button key={label} className={`chip ${day === idx ? 'active' : ''}`} onClick={() => setDay(idx)}>{label}</button>
        ))}
      </div>

      {!view.total ? (
        <Empty glyph="fa-calendar-xmark" title="No sessions on that day" sub="Pick a different day, or All days." />
      ) : (
        <>
          <section className="card" style={{ marginBottom: 12 }}>
            <div className="att-hero" style={{ marginBottom: 0 }}>
              <AttendanceRing rate={view.rate ?? 0} size={58} stroke={5} />
              <div>
                <div className="att-hero-figure">{view.rate}%</div>
                <div className="att-hero-label">
                  {view.total} session{view.total === 1 ? '' : 's'} across {view.subjects.length} subject{view.subjects.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          </section>

          <div className="stat-grid" style={{ padding: 0, gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
            {['present', 'late', 'excused', 'absent'].map((k) => (
              <div key={k} className={`stat-card ${k === 'absent' && view.counts[k] ? 'warn' : ''}`}>
                <div className="stat-label">{STATUS_LABEL[k]}</div>
                <div className="stat-value">{view.counts[k]}</div>
              </div>
            ))}
          </div>

          {view.subjects.map((sub) => {
            const counts = { present: 0, absent: 0, late: 0, excused: 0 };
            sub.items.forEach((it) => { if (counts[it.status] != null) counts[it.status]++; });
            const rate = sub.items.length ? Math.round(((sub.items.length - counts.absent) / sub.items.length) * 100) : null;
            return (
              <section className="card" key={sub.slug}>
                <div className="subj-card-head">
                  <div>
                    <div className="subj-card-name">{sub.name}</div>
                    <div className="subj-card-sub">{sub.items.length} session{sub.items.length === 1 ? '' : 's'}</div>
                  </div>
                  <AttendanceRing rate={rate ?? 0} size={36} stroke={4} />
                </div>
                <div className="subject-list">
                  {sub.items.map((it, i) => (
                    <div className="subject-item" key={i}>
                      <span className="mono">
                        {it.date}
                        {it.periodLabel && <span style={{ color: 'var(--muted)', fontFamily: 'Inter' }}> · {it.periodLabel}</span>}
                      </span>
                      <span className={`status ${it.status}`}>{STATUS_LABEL[it.status]}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
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
