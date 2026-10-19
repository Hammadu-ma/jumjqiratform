import { TT_DAYS } from '../hooks/useTimetable.js';
import { useAllSubjects } from '../hooks/useAllSubjects.js';
import { matchingTables, slotKey } from '../lib/schedule.js';

const DAY_SHORT = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' };
const todayKey = TT_DAYS[new Date().getDay()];

export default function TimetableGridScreen({ student, timetable, onClose }) {
  const allSubjects = useAllSubjects();

  return (
    <div className="app">
      <header className="sp-hero">
        <div className="sp-hero-row">
          <button className="sp-icon-btn" onClick={onClose} aria-label="Back">
            <i className="fa-solid fa-arrow-left" />
          </button>
          <div>
            <div className="sp-hero-name">Full timetable</div>
            <div className="sp-hero-sub">Every session for your class this week</div>
          </div>
        </div>
      </header>

      <main className="content">
        {timetable.loading || allSubjects.loading ? (
          <Empty glyph="fa-spinner fa-spin" title="Loading timetable" />
        ) : timetable.error ? (
          <Empty glyph="fa-triangle-exclamation" title="Could not load the timetable" sub={timetable.error} />
        ) : (
          <TimetableGrid student={student} timetable={timetable} subjectNames={allSubjects.bySlug} />
        )}
      </main>
    </div>
  );
}

function TimetableGrid({ student, timetable, subjectNames }) {
  const { config, tables } = timetable;
  const days = config.days.length ? config.days : TT_DAYS;
  const periods = config.periods.filter((p) => p.kind === 'class');
  const tablesForStudent = matchingTables(tables, student);

  if (!periods.length) {
    return <Empty glyph="fa-calendar-xmark" title="No timetable configured yet" sub="Your admin hasn't set up class periods yet." />;
  }
  if (!tablesForStudent.length) {
    return <Empty glyph="fa-calendar-xmark" title="No timetable for your class yet" sub="Ask your admin to check your department and batch are set up." />;
  }

  return (
    <>
      {tablesForStudent.map((t) => (
        <section className="tt-block" key={t.id}>
          <div className="section-label">{t.name}</div>
          <div className="tt-scroll">
            <table className="tt-grid">
              <thead>
                <tr>
                  <th className="tt-corner">Time</th>
                  {days.map((d) => (
                    <th key={d} className={d === todayKey ? 'tt-today' : ''}>{DAY_SHORT[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={p.id}>
                    <td className="tt-period">
                      <div className="tt-period-label">{p.label}</div>
                      <div className="tt-period-time">{p.start}–{p.end}</div>
                    </td>
                    {days.map((d) => {
                      const entries = t.slots[slotKey(d, p.id)] || [];
                      return (
                        <td key={d} className={d === todayKey ? 'tt-today' : ''}>
                          {entries.length === 0 ? (
                            <span className="tt-empty-cell">—</span>
                          ) : (
                            entries.map((e, i) => (
                              <div className="tt-entry" key={i}>
                                <div className="tt-entry-subject">{subjectNames[e.subject] || e.subject}</div>
                                {(e.room || e.teacherName) && (
                                  <div className="tt-entry-meta">{[e.room && `Rm ${e.room}`, e.teacherName].filter(Boolean).join(' · ')}</div>
                                )}
                              </div>
                            ))
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
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
