import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Same project as the JUMJ admin console — copy these six values out of
// JUMJ-admin.html's own firebaseConfig block into .env (see .env.example).
// Firebase web config is a public identifier (access is enforced by your Firestore/Auth rules,
// not by hiding these values), so sensible defaults are baked in. Set the VITE_FIREBASE_* env
// vars at build time to point this portal at a different project.
const env = import.meta.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyC5jJppRaYhXw-J2bwrqdAxY0fyJsgiHZs',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'ethiowhere.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'ethiowhere',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'ethiowhere.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '437239697706',
  appId: env.VITE_FIREBASE_APP_ID || '1:437239697706:web:865192832f1b3709224e53',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Unlike the admin console (which deliberately uses in-memory persistence so an admin
// session never survives a closed tab), students staying signed in across visits is normal,
// expected behaviour — so this uses Firebase's standard local persistence.
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Collection names — must match the admin console exactly.
export const STUDENTS = 'students';
export const SUBJECTS = 'subjects';
export const ATTENDANCE = 'attendance';
export const MODULE_RESULTS = 'moduleResults'; // subcollection: students/{uid}/moduleResults/{subjectSlug}
export const SETTINGS = 'settings';   // settings/timetable holds the shared day/period config
export const TIMETABLES = 'timetables'; // one doc per department/batch weekly grid
export const ANNOUNCEMENTS = 'announcements'; // posted events/notices — newest first
export const IHSAN_PAYMENTS = 'ihsanPayments';   // metadata only — receipts live in Telegram, never in Firebase
export const IHSAN_ACCOUNTS = 'ihsanAccounts';   // bank accounts, managed in the admin console
export const IHSAN_SUBS = 'ihsanSubscribers';    // students who joined Ihsan (doc id = uid)
export const IHSAN_CONFIG = 'ihsanConfig';        // ihsanConfig/telegram = { botToken, chatIds }
