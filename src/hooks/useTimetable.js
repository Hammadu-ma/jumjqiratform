import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db, SETTINGS, TIMETABLES } from '../lib/firebase.js';

const TT_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function defaultConfig() {
  // Only used if /settings/timetable somehow doesn't exist yet — mirrors the admin console's
  // own fallback so a brand-new project still renders something sensible.
  return { days: ['mon', 'tue', 'wed', 'thu', 'fri'], periods: [], maxPerCell: 1 };
}

function normalizeConfig(d) {
  const def = defaultConfig();
  const days = Array.isArray(d.days) ? d.days.filter((x) => TT_DAYS.includes(x)) : def.days;
  const periods = Array.isArray(d.periods)
    ? d.periods.map((p) => ({ id: p.id, label: p.label || '', start: p.start || '', end: p.end || '', kind: p.kind === 'break' ? 'break' : 'class' }))
    : def.periods;
  return { days: days.length ? days : def.days, periods, hour12: !!d.hour12 };
}

function normalizeTable(id, d) {
  return { id, name: d.name || 'Timetable', department: d.department || '', batch: d.batch || '', slots: (d.slots && typeof d.slots === 'object') ? d.slots : {} };
}

export function useTimetable() {
  const [state, setState] = useState({ loading: true, config: null, tables: [], error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfgSnap = await getDoc(doc(db, SETTINGS, 'timetable'));
        const config = normalizeConfig(cfgSnap.exists() ? cfgSnap.data() : {});
        const snap = await getDocs(collection(db, TIMETABLES));
        const tables = snap.docs.map((d) => normalizeTable(d.id, d.data()));
        if (!cancelled) setState({ loading: false, config, tables, error: null });
      } catch (err) {
        if (!cancelled) setState({ loading: false, config: null, tables: [], error: err.message || String(err) });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}

export { TT_DAYS };
