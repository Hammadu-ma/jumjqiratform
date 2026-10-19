import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db, ANNOUNCEMENTS } from '../lib/firebase.js';

// Posted events/notices for the ticker: announcements/{id} = { title, body, date },
// newest first, capped at 20. This is a nice-to-have strip, so any failure (collection
// missing, rules not deployed yet) quietly yields "no events" instead of breaking the
// dashboard — the ticker simply doesn't render.
export function useEvents() {
  const [state, setState] = useState({ loading: true, events: [], error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, ANNOUNCEMENTS), orderBy('date', 'desc'), limit(20)));
        const events = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((e) => e.title);
        if (!cancelled) setState({ loading: false, events, error: null });
      } catch (err) {
        if (!cancelled) setState({ loading: false, events: [], error: err.message || String(err) });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}
