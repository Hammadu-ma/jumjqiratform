export const slotKey = (day, periodId) => day + '_' + periodId;
const minOf = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : NaN; };

export function sessionsForDay(config, tables, student, subjectSlugs, dayKey) {
  if (!config || !config.days.includes(dayKey)) return [];
  const out = [];
  tables.forEach((t) => {
    // A table only applies to this student if its department/batch isn't more specific than
    // theirs — an empty department/batch on the table means "everyone", matching the admin
    // console's own attnStudentsFor filtering.
    if (t.department && student.department && t.department !== student.department) return;
    if (t.batch && student.batch && t.batch !== student.batch) return;
    config.periods.filter((p) => p.kind === 'class').forEach((p) => {
      const slot = t.slots[slotKey(dayKey, p.id)] || [];
      slot.forEach((entry) => {
        if (subjectSlugs.includes(entry.subject)) {
          out.push({
            subjectSlug: entry.subject, teacherName: entry.teacherName || '', room: entry.room || '',
            tableName: t.name, periodId: p.id, periodLabel: p.label, start: p.start, end: p.end,
          });
        }
      });
    });
  });
  return out.sort((a, b) => minOf(a.start) - minOf(b.start));
}

// Every table (weekly grid) that applies to this student — same department/batch matching
// rule as sessionsForDay, just without the subject filter, since the full timetable is meant
// to show the whole class's week, not only the sessions this student happens to be in.
export function matchingTables(tables, student) {
  return tables.filter((t) => {
    if (t.department && student.department && t.department !== student.department) return false;
    if (t.batch && student.batch && t.batch !== student.batch) return false;
    return true;
  });
}

export function isNowWithin(start, end) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= minOf(start) && nowMin < minOf(end);
}
