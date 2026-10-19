
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { useAttendance } from '../hooks/useAttendance.js';
import { useResults } from '../hooks/useResults.js';
import { useTimetable } from '../hooks/useTimetable.js';
import { useEvents } from '../hooks/useEvents.js';
import IhsanTab from './IhsanTab.jsx';
import AttendanceTab from './AttendanceTab.jsx';
import ResultsTab from './ResultsTab.jsx';
import ScheduleTab from './ScheduleTab.jsx';
import SubjectsTab from './SubjectsTab.jsx';
import ProfileScreen from './ProfileScreen.jsx';
import TimetableGridScreen from './TimetableGridScreen.jsx';
import EventsTicker from './EventsTicker.jsx';

const TABS = [
  { key: 'schedule', label: 'Today', icon: 'fa-calendar-days', kicker:'YOUR DAY' },
  { key: 'ihsan', label: 'Ihsan', icon: 'fa-hand-holding-heart', kicker:'GIVE & CONTRIBUTE' },
  { key: 'attendance', label: 'Attendance', icon: 'fa-chart-pie', kicker:'YOUR PRESENCE' },
  { key: 'results', label: 'Results', icon: 'fa-chart-line', kicker:'ACADEMIC PROGRESS' },
  { key: 'subjects', label: 'Subjects', icon: 'fa-layer-group', kicker:'YOUR CLASSES' },
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export default function Dashboard({ student, subjects, onProfileUpdated }) {
  const [tab, setTab] = useState('schedule');
  const [profileOpen, setProfileOpen] = useState(false);
  const [timetableOpen, setTimetableOpen] = useState(false);
  const attendance = useAttendance(student.uid, student.subjectIds);
  const results = useResults(student.uid, subjects);
  const timetable = useTimetable();
  const events = useEvents();

  if (profileOpen) return <ProfileScreen student={student} onClose={() => setProfileOpen(false)} onUpdated={onProfileUpdated} />;
  if (timetableOpen) return <TimetableGridScreen student={student} timetable={timetable} onClose={() => setTimetableOpen(false)} />;

  const current = TABS.find(t => t.key === tab);
  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Good morning,' : hr < 18 ? 'Good afternoon,' : 'Good evening,';
  const firstName = (student.name || '').trim().split(/\s+/)[0] || 'there';
  const isToday = tab === 'schedule';

  return (
    <div className="app">
      <header className="header-slim">
        <button className="sp-avatar" onClick={() => setProfileOpen(true)} aria-label="Open your profile">{initials(student.name)}</button>
        <div>
          <div className="header-slim-name">{student.name}</div>
          <div className="header-slim-sub">{student.department}{student.batch ? ` · Batch ${student.batch}` : ''}</div>
        </div>
        <button className="sp-icon-btn" onClick={() => signOut(auth)} title="Sign out" aria-label="Sign out">
          <i className="fa-solid fa-arrow-right-from-bracket" />
        </button>
      </header>

      <EventsTicker events={events.events} />

      <main className="content">
        <div className="page-intro">
          <div>
            <div className={`page-kicker ${isToday ? 'greet' : ''}`}>{isToday ? greeting : current.kicker}</div>
            <h1 className="page-title">{isToday ? <>{firstName} <span aria-hidden="true">👋</span></> : current.label}</h1>
            <p className="page-sub">
              {tab === 'schedule' ? 'Your classes for today are below.' :
               tab === 'ihsan' ? 'Send your contribution and upload the receipt.' :
               tab === 'attendance' ? 'Stay on top of every session.' :
               tab === 'results' ? 'Track your performance as it grows.' : 'Your current academic load.'}
            </p>
          </div>
          {tab === 'schedule' && (
            <button className="tt-fullbtn" onClick={() => setTimetableOpen(true)}>
              <i className="fa-solid fa-table-cells" />Full timetable
            </button>
          )}
        </div>

        {tab === 'schedule' && <ScheduleTab student={student} subjects={subjects} timetable={timetable} />}
        {tab === 'ihsan' && <IhsanTab student={student} />}
        {tab === 'attendance' && <AttendanceTab subjects={subjects} attendance={attendance} />}
        {tab === 'results' && <ResultsTab subjects={subjects} results={results} />}
        {tab === 'subjects' && <SubjectsTab subjects={subjects} />}
      </main>

      <nav className="bottom-nav" aria-label="Student portal navigation">
        {TABS.map(t => (
          <button key={t.key} className={`nav-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <i className={`fa-solid ${t.icon}`} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
