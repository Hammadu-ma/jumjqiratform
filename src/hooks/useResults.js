import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, STUDENTS, MODULE_RESULTS } from '../lib/firebase.js';

const maxTotalOf = (subject) => (subject.components || []).reduce((a, c) => a + (Number(c.weight) || 0), 0);

function normResult(data, subject) {
  const components = Array.isArray(data.components) ? data.components : [];
  const total = data.total ?? (components.length ? +components.reduce((s, c) => s + (c.weighted || 0), 0).toFixed(2) : null);
  const complete = data.complete ?? (components.length ? components.every((c) => c.raw !== null && c.raw !== undefined) : true);
  return {
    components,
    total,
    complete,
    maxTotal: data.maxTotal || maxTotalOf(subject) || null,
    // Written onto this doc by the admin console's cohort recompute — already scoped to just
    // this student, so reading it never requires seeing anyone else's result.
    rank: data.rank ?? null,
    cohortAvg: data.cohortAvg ?? null,
    totalWithRecords: data.totalWithRecords ?? null,
    updatedAt: data.updatedAt || null,
  };
}

// Unlike attendance, this is naturally safe to read directly: each result lives at
// students/{uid}/moduleResults/{slug}, under the student's OWN document, so a Firestore rule
// scoping /students/{uid}/** to request.auth.uid == uid (recommended anyway for the students
// collection) already protects this with no denormalization needed.
export function useResults(uid, subjects) {
  const [state, setState] = useState({ loading: true, bySlug: {}, error: null });
  const key = subjects.map((s) => s.slug).sort().join(',');

  useEffect(() => {
    if (!uid || !key) { setState({ loading: false, bySlug: {}, error: null }); return; }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const bySlug = {};
        await Promise.all(
          subjects.map(async (subject) => {
            const snap = await getDoc(doc(db, STUDENTS, uid, MODULE_RESULTS, subject.slug));
            if (snap.exists()) bySlug[subject.slug] = normResult(snap.data(), subject);
          })
        );
        if (!cancelled) setState({ loading: false, bySlug, error: null });
      } catch (err) {
        if (!cancelled) setState({ loading: false, bySlug: {}, error: err.message || String(err) });
      }
    })();

    return () => { cancelled = true; };
  }, [uid, key]);

  return state;
}
