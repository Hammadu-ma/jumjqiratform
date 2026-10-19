import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, ATTENDANCE } from '../lib/firebase.js';

// Attendance docs are keyed by subject+date+session, not by student, so there's no single
// doc to fetch — same approach as the admin console's student-profile Attendance tab: query
// by subjectSlug (chunked for Firestore's 10-item "in" limit), then keep only the sessions
// where this student's own uid appears in that doc's `records` map. Firestore's security
// rules should still restrict this query to only the subjects the signed-in uid is actually
// enrolled in — this hook doesn't grant access, it just shapes what a legitimate read returns.
export function useAttendance(uid, subjectSlugs) {
  const [state, setState] = useState({ loading: true, items: [], error: null });
  const key = (subjectSlugs || []).slice().sort().join(',');

  useEffect(() => {
    if (!uid || !key) { setState({ loading: false, items: [], error: null }); return; }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      const slugs = key.split(',');
      const items = [];
      try {
        for (let i = 0; i < slugs.length; i += 10) {
          const chunk = slugs.slice(i, i + 10);
          const snap = await getDocs(query(collection(db, ATTENDANCE), where('subjectSlug', 'in', chunk)));
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.cancelled) return;
            const status = (data.records || {})[uid];
            if (!status) return;
            items.push({
              date: data.date,
              subjectSlug: data.subjectSlug,
              periodLabel: data.periodLabel || '',
              start: data.start || '',
              end: data.end || '',
              status,
            });
          });
        }
        items.sort((a, b) => b.date.localeCompare(a.date) || (a.start || '').localeCompare(b.start || ''));
        if (!cancelled) setState({ loading: false, items, error: null });
      } catch (err) {
        if (!cancelled) setState({ loading: false, items: [], error: err.message || String(err) });
      }
    })();

    return () => { cancelled = true; };
  }, [uid, key]);

  return state;
}
