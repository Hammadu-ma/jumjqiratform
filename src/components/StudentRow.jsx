import Avatar from './Avatar.jsx';
import AttendanceRing from './AttendanceRing.jsx';

export default function StudentRow({ student, index, onOpen }) {
  return (
    <button className="row" onClick={() => onOpen(student)}>
      <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
      <Avatar name={student.name} />
      <span className="row-main">
        <span className="row-name">
          {student.name}
          {!student.idConfirmed && <span className="unverified" title="ID not confirmed" />}
        </span>
        <span className="row-meta">
          {student.department}
          <span className="dot">·</span>
          <span className="batch">{student.batch}</span>
        </span>
      </span>
      <span className="ring-wrap">
        <AttendanceRing rate={student.attendanceRate} />
        <svg className="chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
          <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
