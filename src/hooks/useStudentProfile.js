import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, STUDENTS, SUBJECTS } from '../lib/firebase.js';

// A student can only ever read their OWN /students/{uid} doc — that's enforced by the
// same Firestore security rules the admin console relies on, not by anything in this
// hook. If the doc doesn't exist, this account isn't (yet) a recognised student.
export function useStudentProfile(uid) {
  const [state, setState] = useState({ loading: true, student: null, subjects: [], error: null });
  const [bump, setBump] = useState(0);
  const refresh = useCallback(() => setBump((n) => n + 1), []);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    // Only show the full loading state on the first load — a refresh() after saving a profile
    // edit shouldn't blank the whole screen out from under the student.
    if (bump === 0) setState({ loading: true, student: null, subjects: [], error: null });

    (async () => {
      try {
        const snap = await getDoc(doc(db, STUDENTS, uid));
        if (!snap.exists()) {
          if (!cancelled) setState({ loading: false, student: null, subjects: [], error: 'not-enrolled' });
          return;
        }
        const student = { uid: snap.id, ...snap.data() };
        const subjectIds = Array.isArray(student.subjectIds) ? student.subjectIds : [];
        const subjects = (
          await Promise.all(
            subjectIds.map(async (slug) => {
              const sSnap = await getDoc(doc(db, SUBJECTS, slug));
              return sSnap.exists() ? { slug, ...sSnap.data() } : { slug, name: slug };
            })
          )
        ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        if (!cancelled) setState({ loading: false, student, subjects, error: null });
      } catch (err) {
        if (!cancelled) setState({ loading: false, student: null, subjects: [], error: err.message || String(err) });
      }
    })();

    return () => { cancelled = true; };
  }, [uid, bump]);

  return { ...state, refresh };
}
