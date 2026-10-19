
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import ShieldArt from './ShieldArt.jsx';

const ERROR_COPY = {
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/user-not-found': 'No account found for that email.',
  'auth/wrong-password': 'Wrong password. Try again.',
  'auth/invalid-credential': 'Email or password is wrong.',
  'auth/too-many-requests': 'Too many attempts — wait a bit and try again.',
};

export default function LoginScreen() {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function onSubmit(e){
    e.preventDefault(); if(!email||!password)return; setBusy(true);setError('');
    try{await signInWithEmailAndPassword(auth,email.trim(),password)}
    catch(err){setError(ERROR_COPY[err.code]||'Could not sign in — check your details and try again.')}
    finally{setBusy(false)}
  }
  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-brand"><div className="mark">J</div><div><div className="name">JUMJ</div><span className="tag">Student Portal</span></div></div>
        <div className="login-art"><ShieldArt /></div>
        <h1 className="login-title">Your university, at a glance.</h1>
        <p className="login-sub">Sign in to access your schedule, attendance, results and enrolled subjects.</p>
        <label className="field-label" htmlFor="email">University email</label>
        <input id="email" type="email" autoComplete="username" inputMode="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@ju.edu.et" required />
        <label className="field-label" htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required />
        {error && <div className="login-error"><i className="fa-solid fa-circle-exclamation" />&nbsp; {error}</div>}
        <button className="login-btn" type="submit" disabled={busy}>{busy ? 'Signing you in…' : 'Enter student portal  →'}</button>
      </form>
    </div>
  );
}
