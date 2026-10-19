export default function SubjectsTab({ subjects }) {
  if (!subjects.length) {
    return (
      <div className="tab-pane">
        <div className="empty">
          <div className="glyph"><i className="fa-solid fa-book-open" /></div>
          <div className="title">Not enrolled in any subject yet</div>
          <div className="sub">Your admin will enroll you once your account is set up.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-pane">
      <div className="section-label">Enrolled ({subjects.length})</div>
      <section className="card">
        {subjects.map((s) => (
          <div className="subj-row" key={s.slug}>
            <div className="subj-row-icon"><i className="fa-solid fa-book-medical" /></div>
            <div>
              <div className="subj-row-name">{s.name}</div>
              {s.teacherName && <div className="subj-row-teacher">{s.teacherName}</div>}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
