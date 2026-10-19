import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase.js';

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = signed out

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  return { user, checking: user === undefined };
}
