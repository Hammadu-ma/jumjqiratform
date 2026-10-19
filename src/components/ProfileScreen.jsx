import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth, db, STUDENTS } from '../lib/firebase.js';
import { useIhsanSub } from '../hooks/useIhsan.js';

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export default function ProfileScreen({ student, onClose, onUpdated }) {
  const [phone, setPhone] = useState(student.phone || '');
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState(null); // {kind:'ok'|'err', text}

  const ihsan = useIhsanSub(student);
  const [confirmOff, setConfirmOff] = useState(false);
  const [ihBusy, setIhBusy] = useState(false);
  async function unsubscribe() {
    if (!confirmOff) { setConfirmOff(true); setTimeout(() => setConfirmOff(false), 4000); return; }
    setIhBusy(true);
    try { await ihsan.unsubscribe(); } finally { setIhBusy(false); setConfirmOff(false); }
  }

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  async function savePhone(e) {
    e.preventDefault();
    setPhoneBusy(true); setPhoneMsg(null);
    try {
      await updateDoc(doc(db, STUDENTS, student.uid), { phone: phone.trim() });
      setPhoneMsg({ kind: 'ok', text: 'Saved.' });
      onUpdated?.();
    } catch (err) {
      setPhoneMsg({ kind: 'err', text: err.message || 'Could not save — try again.' });
    } finally {
      setPhoneBusy(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw.length < 6) return setPwMsg({ kind: 'err', text: 'New password needs at least 6 characters.' });
    if (newPw !== confirmPw) return setPwMsg({ kind: 'err', text: 'New passwords don’t match.' });
    setPwBusy(true);
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, curPw);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPw);
      setCurPw(''); setNewPw(''); setConfirmPw('');
      setPwMsg({ kind: 'ok', text: 'Password changed.' });
    } catch (err) {
      const code = err.code || '';
      const text = code.includes('wrong-password') || code.includes('invalid-credential')
        ? 'Current password is wrong.'
        : (err.message || 'Could not change password — try again.');
      setPwMsg({ kind: 'err', text });
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="app profile-screen">
      <header className="sp-hero">
        <div className="sp-hero-row">
          <button className="sp-signout" onClick={onClose} aria-label="Back">
            <i className="fa-solid fa-arrow-left" />
          </button>
          <div className="sp-avatar">{initials(student.name)}</div>
          <div>
            <div className="sp-hero-name">Your profile</div>
            <div className="sp-hero-sub">{student.name}</div>
          </div>
        </div>
      </header>

      <main className="content" style={{ paddingBottom: 40 }}>
        <div className="section-label">Academic record</div>
        <section className="card" style={{ marginBottom: 12 }}>
          <InfoRow label="Full name" value={student.name} />
          <InfoRow label="Email" value={student.email} />
          <InfoRow label="Department" value={student.department} />
          <InfoRow label="Batch" value={student.batch} />
          <InfoRow label="Gender" value={student.gender === 'F' ? 'Sister' : student.gender === 'M' ? 'Brother' : student.gender} last />
          <p className="profile-hint">These are set by your admin — ask them if any of this needs correcting.</p>
        </section>

        <div className="section-label">Contact number</div>
        <form className="card" style={{ marginBottom: 12 }} onSubmit={savePhone}>
          <label className="field-label" htmlFor="phone">Phone</label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xx xx xx" />
          {phoneMsg && <div className={phoneMsg.kind === 'ok' ? 'field-ok' : 'field-err'}>{phoneMsg.text}</div>}
          <button className="login-btn" type="submit" disabled={phoneBusy} style={{ marginTop: 4 }}>
            {phoneBusy ? 'Saving…' : 'Save phone number'}
          </button>
        </form>

        <div className="section-label">Ihsan</div>
        <section className="card" style={{ marginBottom: 12 }}>
          <p className="profile-hint" style={{ marginTop: 0 }}>
            {ihsan.loading ? 'Checking your subscription…' : ihsan.subscribed
              ? 'You are subscribed to Ihsan and can send payments from the Ihsan tab.'
              : 'You are not subscribed. Open the Ihsan tab to subscribe.'}
          </p>
          {ihsan.subscribed && (
            <button type="button" className="login-btn ih-unsub" onClick={unsubscribe} disabled={ihBusy}>
              {ihBusy ? 'Unsubscribing…' : confirmOff ? 'Tap again to confirm' : 'Unsubscribe from Ihsan'}
            </button>
          )}
        </section>

        <div className="section-label">Change password</div>
        <form className="card" onSubmit={changePassword}>
          <label className="field-label" htmlFor="curPw">Current password</label>
          <input id="curPw" type="password" autoComplete="current-password" value={curPw} onChange={(e) => setCurPw(e.target.value)} required />
          <label className="field-label" htmlFor="newPw">New password</label>
          <input id="newPw" type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
          <label className="field-label" htmlFor="confirmPw">Confirm new password</label>
          <input id="confirmPw" type="password" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
          {pwMsg && <div className={pwMsg.kind === 'ok' ? 'field-ok' : 'field-err'}>{pwMsg.text}</div>}
          <button className="login-btn" type="submit" disabled={pwBusy} style={{ marginTop: 4 }}>
            {pwBusy ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </main>
    </div>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <div className="info-row" style={last ? { borderBottom: 0 } : undefined}>
      <span className="info-label">{label}</span>
      <span className="info-value">{value || '—'}</span>
    </div>
  );
}
