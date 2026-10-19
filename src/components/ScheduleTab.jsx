import { useMemo, useState } from 'react';
import { TT_DAYS } from '../hooks/useTimetable.js';
import { sessionsForDay, isNowWithin } from '../lib/schedule.js';

const DAY_SHORT = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' };
const DAY_FULL = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };
const todayKey = TT_DAYS[new Date().getDay()];

export default function ScheduleTab({ student, subjects, timetable }) {
  const subjectSlugs = student.subjectIds || [];
  const subjectsBySlug = useMemo(() => new Map(subjects.map((s) => [s.slug, s.name])), [subjects]);
  const [day, setDay] = useState(null); // null = follow "today" until the student picks one

  if (timetable.loading) return <div className="tab-pane"><Empty glyph="fa-spinner fa-spin" title="Loading schedule" /></div>;
  if (timetable.error) return <div className="tab-pane"><Empty glyph="fa-triangle-exclamation" title="Could not load the schedule" sub={timetable.error} /></div>;

  const { config, tables } = timetable;
  const days = config.days.length ? config.days : TT_DAYS;
  const activeDay = day || (days.includes(todayKey) ? todayKey : days[0]);
  const isToday = activeDay === todayKey;

  const sessions = sessionsForDay(config, tables, student, subjectSlugs, activeDay);

  return (
    <div className="tab-pane">
      <div className="chip-row">
        {days.map((d) => (
          <button key={d} className={`chip ${activeDay === d ? 'active' : ''}`} onClick={() => setDay(d)}>
            {d === todayKey ? 'Today' : DAY_SHORT[d]}
          </button>
        ))}
      </div>

      <div className="section-label">{DAY_FULL[activeDay]}{isToday ? ' · today' : ''}</div>

      {!sessions.length ? (
        <Empty glyph="fa-mug-hot" title="Nothing scheduled" sub="No sessions for your subjects fall on this day." />
      ) : (
        <div className="sched-list">
          {sessions.map((s, i) => {
            const now = isToday && isNowWithin(s.start, s.end);
            return (
              <div className={`sched-card ${now ? 'now' : ''}`} key={i}>
                <div className="sched-time">
                  <div className="sched-time-start">{s.start}</div>
                  <div className="sched-time-end">{s.end}</div>
                </div>
                <div className="sched-rail" />
                <div className="sched-body">
                  <div className="sched-top">
                    <span className="sched-subject">{subjectsBySlug.get(s.subjectSlug) || s.subjectSlug}</span>
                    {now && <span className="now-pill">NOW</span>}
                  </div>
                  <div className="sched-meta">
                    {s.periodLabel}
                    {s.room && <> · Room {s.room}</>}
                    {s.teacherName && <> · {s.teacherName}</>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
