import { useEffect } from 'react';
import Avatar from './Avatar.jsx';
import AttendanceRing from './AttendanceRing.jsx';
import { subjectNames } from '../data/students.js';

export default function StudentSheet({ student, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!student) return null;
  const subjects = subjectNames(student.subjectIds);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={student.name}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <Avatar name={student.name} size="lg" />
          <div>
            <div className="sheet-name">{student.name}</div>
            <div className="sheet-sub">
              {student.department} · Batch {student.batch}
            </div>
          </div>
          <button className="sheet-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="sheet-body">
          <div className="sheet-section">
            <div className="sheet-label">STANDING</div>
            <span className={`verify-pill ${student.idConfirmed ? 'ok' : 'pending'}`}>
              <span className="dot" />
              {student.idConfirmed ? 'ID confirmed' : 'ID not confirmed'}
            </span>
          </div>

          <div className="sheet-section">
            <div className="sheet-label">ATTENDANCE</div>
            <div className="attendance-block">
              <AttendanceRing rate={student.attendanceRate} size={58} stroke={5} />
              <div className="attendance-figure">
                <b>{student.attendanceRate}%</b>
                <span>across {subjects.length} subject{subjects.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>

          <div className="sheet-section">
            <div className="sheet-label">CONTACT</div>
            <div className="contact-list">
              <div className="contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{student.phone}</span>
              </div>
              <div className="contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16v16H4z" opacity="0" />
                  <path d="M22 6l-10 7L2 6" />
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                </svg>
                <span>{student.email}</span>
              </div>
            </div>
          </div>

          <div className="sheet-section">
            <div className="sheet-label">SUBJECTS ({subjects.length})</div>
            <div className="subject-list">
              {subjects.map((s) => (
                <div className="subject-item" key={s}>
                  <span>{s}</span>
                  <span className="subject-tag">enrolled</span>
                </div>
              ))}
              {subjects.length === 0 && <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>Not enrolled in any subject yet.</span>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
