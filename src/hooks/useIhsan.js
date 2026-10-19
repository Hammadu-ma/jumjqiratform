import { useCallback, useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db, IHSAN_ACCOUNTS, IHSAN_CONFIG, IHSAN_PAYMENTS, IHSAN_SUBS } from '../lib/firebase.js';

// Subscription = a doc at ihsanSubscribers/{uid}. Only subscribed students can read the bank list /
// Telegram config or create payments (enforced by the security rules in the README).
export function useIhsanSub(student) {
  const [state, setState] = useState({ loading: true, subscribed: false, error: null });
  useEffect(() => {
    let off = false;
    getDoc(doc(db, IHSAN_SUBS, student.uid))
      .then((snap) => { if (!off) setState({ loading: false, subscribed: snap.exists(), error: null }); })
      .catch((e) => { if (!off) setState({ loading: false, subscribed: false, error: e.message || String(e) }); });
    return () => { off = true; };
  }, [student.uid]);

  const subscribe = useCallback(async () => {
    await setDoc(doc(db, IHSAN_SUBS, student.uid), {
      uid: student.uid, name: student.name || '', department: student.department || '',
      batch: student.batch || '', gender: student.gender || '', subscribedAt: serverTimestamp(),
    });
    setState({ loading: false, subscribed: true, error: null });
  }, [student]);
  const unsubscribe = useCallback(async () => {
    await deleteDoc(doc(db, IHSAN_SUBS, student.uid));
    setState({ loading: false, subscribed: false, error: null });
  }, [student.uid]);
  return { ...state, subscribe, unsubscribe };
}

async function telegram(token, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', body });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) throw new Error(json.description || 'Telegram rejected the upload');
  return json.result;
}

export function useIhsan(student) {
  const [state, setState] = useState({ loading: true, accounts: [], config: null, items: [], error: null });
  const [bump, setBump] = useState(0);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const [acc, cfg, pays] = await Promise.all([
          getDocs(collection(db, IHSAN_ACCOUNTS)),
          getDoc(doc(db, IHSAN_CONFIG, 'telegram')),
          getDocs(query(collection(db, IHSAN_PAYMENTS), where('uid', '==', student.uid))),
        ]);
        const accounts = acc.docs.map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => a.active !== false).sort((a, b) => String(a.bank).localeCompare(String(b.bank)));
        const items = pays.docs.map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        if (!off) setState({ loading: false, accounts, config: cfg.exists() ? cfg.data() : null, items, error: null });
      } catch (e) {
        if (!off) setState((s) => ({ ...s, loading: false, error: e.message || String(e) }));
      }
    })();
    return () => { off = true; };
  }, [student.uid, bump]);

  // Receipts are sent to Telegram (admin chats/channels); Firestore only keeps the payment
  // metadata plus Telegram file ids, so admins can fetch the photo back from Telegram to review.
  const submit = useCallback(async ({ account, amount, files, onProgress }) => {
    const { botToken, chatIds } = state.config || {};
    if (!botToken || !chatIds?.length) throw new Error('Payments are not set up yet — please ask your admin.');
    const payRef = doc(collection(db, IHSAN_PAYMENTS));
    const fileIds = [];
    for (let i = 0; i < files.length; i++) {
      const caption = `💳 Ihsan payment\nID: ${payRef.id}\nStudent: ${student.name}${student.department ? `\nDept/Batch: ${student.department} ${student.batch || ''}` : ''}\nAmount: ${amount} ETB\nBank: ${account.bank}\nReceipt ${i + 1}/${files.length}`;
      let fileId = null; let delivered = 0; let lastErr;
      for (const chat of chatIds) {
        try {
          const fd = new FormData();
          fd.append('chat_id', chat); fd.append('caption', caption);
          if (fileId) fd.append('photo', fileId); else fd.append('photo', files[i], files[i].name);
          const res = await telegram(botToken, 'sendPhoto', fd);
          if (!fileId) fileId = res.photo[res.photo.length - 1].file_id;
          delivered++;
        } catch (e) { lastErr = e; }
      }
      if (!delivered) throw lastErr || new Error('Could not reach Telegram');
      fileIds.push(fileId);
      onProgress?.((i + 1) / files.length);
    }
    await setDoc(payRef, {
      uid: student.uid, studentName: student.name || '', department: student.department || '', batch: student.batch || '',
      accountId: account.id, accountLabel: account.bank, amount: Number(amount),
      receipts: fileIds.map((fileId) => ({ fileId })), status: 'pending', createdAt: serverTimestamp(),
    });
    setBump((n) => n + 1);
  }, [student, state.config]);

  return { ...state, submit };
}
