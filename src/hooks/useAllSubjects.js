import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, SUBJECTS } from '../lib/firebase.js';

// Subject names aren't sensitive (the admin console's own rule note already treats
// /subjects/{slug} as readable by any authenticated user), so this is a plain, safe read —
// unlike attendance, nothing here is scoped to "just this student".
export function useAllSubjects() {
  const [state, setState] = useState({ loading: true, bySlug: {}, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, SUBJECTS));
        const bySlug = {};
        snap.forEach((d) => { bySlug[d.id] = d.data().name || d.id; });
        if (!cancelled) setState({ loading: false, bySlug, error: null });
      } catch (err) {
        if (!cancelled) setState({ loading: false, bySlug: {}, error: err.message || String(err) });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}
