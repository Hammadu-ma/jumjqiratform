import { useEffect, useRef, useState } from 'react';
import { useIhsan, useIhsanSub } from '../hooks/useIhsan.js';

const IHSAN_CURRENCY = 'ETB';
const IHSAN_QUICK_AMOUNTS = [100, 250, 500, 1000];

const MAX_FILES = 5;
const MAX_MB = 5;
const STATUS = { pending: 'Under review', approved: 'Confirmed', rejected: 'Rejected' };
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

function IhsanPay({ student }) {
  const { loading, accounts, items, error, submit } = useIhsan(student);
  const [accountId, setAccountId] = useState(null);
  const [amount, setAmount] = useState('');
  const [files, setFiles] = useState([]); // [{ file, url }]
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState('');
  const input = useRef(null);
  const filesRef = useRef(files);
  filesRef.current = files;
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  const account = accounts.find((a) => a.id === accountId) || accounts[0];
  const pending = items.filter((i) => (i.status || 'pending') === 'pending').length;
  const total = items.filter((i) => i.status === 'approved').reduce((s, i) => s + (i.amount || 0), 0);

  function addFiles(list) {
    const next = [...files];
    let note = null;
    Array.from(list).forEach((file) => {
      if (!file.type.startsWith('image/')) note = 'Only image files (JPG, PNG, WEBP) can be uploaded.';
      else if (file.size > MAX_MB * 1024 * 1024) note = `Each image must be under ${MAX_MB} MB.`;
      else if (next.length >= MAX_FILES) note = `You can attach up to ${MAX_FILES} images.`;
      else next.push({ file, url: URL.createObjectURL(file) });
    });
    setFiles(next);
    setMsg(note ? { kind: 'err', text: note } : null);
  }
  function removeFile(i) {
    URL.revokeObjectURL(files[i].url);
    setFiles(files.filter((_, idx) => idx !== i));
  }
  async function copy(num) {
    try { await navigator.clipboard.writeText(num); setCopied(num); setTimeout(() => setCopied(''), 1600); } catch { /* clipboard unavailable */ }
  }
  async function onSubmit(e) {
    e.preventDefault();
    if (!account) return setMsg({ kind: 'err', text: 'Choose an account to pay into.' });
    if (!(Number(amount) > 0)) return setMsg({ kind: 'err', text: 'Enter the amount you paid.' });
    if (!files.length) return setMsg({ kind: 'err', text: 'Add a photo of your payment receipt.' });
    setBusy(true); setMsg(null); setProgress(0);
    try {
      await submit({ account, amount, files: files.map((f) => f.file), onProgress: setProgress });
      files.forEach((f) => URL.revokeObjectURL(f.url));
      setFiles([]); setAmount('');
      setMsg({ kind: 'ok', text: 'Receipt sent. JazakAllahu khayran — your payment is under review.' });
    } catch (err) {
      setMsg({ kind: 'err', text: err.message || 'Upload failed — check your connection and try again.' });
    } finally { setBusy(false); }
  }

  return (
    <div className="tab-pane">
      <section className="ih-hero">
        <div className="ih-hero-icon"><i className="fa-solid fa-hand-holding-heart" /></div>
        <div>
          <div className="ih-hero-label">Confirmed contributions</div>
          <div className="ih-hero-figure">{fmt(total)} <small>{IHSAN_CURRENCY}</small></div>
          <div className="ih-hero-sub">{pending} awaiting review</div>
        </div>
      </section>

      <div className="section-label">1 · Choose an account</div>
      {!loading && !accounts.length && <div className="ih-msg err" style={{ marginTop: 0 }}>No payment accounts have been added yet. Please check back soon.</div>}
      <div className="ih-accounts">
        {accounts.map((a) => (
          <button type="button" key={a.id} className={`ih-account ${a.id === account?.id ? 'active' : ''}`} onClick={() => setAccountId(a.id)}>
            <span className="ih-account-icon"><i className={`fa-solid fa-building-columns`} /></span>
            <span className="ih-account-bank">{a.bank}</span>
            <span className="ih-account-holder">{a.holder}</span>
            <span className="ih-account-num">
              <span className="mono">{a.number}</span>
              <span role="button" tabIndex={0} className="ih-copy" aria-label={`Copy ${a.bank} number`}
                onClick={(e) => { e.stopPropagation(); copy(a.number); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); copy(a.number); } }}>
                <i className={`fa-solid ${copied === a.number ? 'fa-check' : 'fa-copy'}`} />
              </span>
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit}>
        <div className="section-label">2 · How much did you pay?</div>
        <section className="card ih-amount">
          <div className="ih-amount-box">
            <span>{IHSAN_CURRENCY}</span>
            <input type="number" inputMode="decimal" min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" aria-label="Amount paid" />
          </div>
          <div className="chip-row" style={{ marginBottom: 0 }}>
            {IHSAN_QUICK_AMOUNTS.map((q) => (
              <button type="button" key={q} className={`chip ${Number(amount) === q ? 'active' : ''}`} onClick={() => setAmount(String(q))}>{fmt(q)}</button>
            ))}
          </div>
        </section>

        <div className="section-label" style={{ marginTop: 18 }}>3 · Upload your receipt</div>
        <div
          className={`ih-drop ${drag ? 'drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          onClick={() => input.current?.click()}
          role="button" tabIndex={0} aria-label="Upload receipt images"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
        >
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          <div className="ih-drop-icon"><i className="fa-solid fa-cloud-arrow-up" /></div>
          <div className="ih-drop-title">{drag ? 'Drop to upload' : 'Drag & drop your receipt here'}</div>
          <div className="ih-drop-sub">or tap to browse · JPG, PNG, WEBP · up to {MAX_FILES} images, {MAX_MB} MB each</div>
        </div>

        {files.length > 0 && (
          <div className="ih-previews">
            {files.map((f, i) => (
              <div className="ih-thumb" key={f.url}>
                <img src={f.url} alt={`Receipt ${i + 1}`} />
                <button type="button" onClick={() => removeFile(i)} aria-label={`Remove receipt ${i + 1}`}><i className="fa-solid fa-xmark" /></button>
              </div>
            ))}
          </div>
        )}

        {msg && <div className={`ih-msg ${msg.kind}`}>{msg.text}</div>}
        {busy && <div className="ih-progress"><div style={{ width: `${Math.round(progress * 100)}%` }} /></div>}
        <button className="login-btn" type="submit" disabled={busy} style={{ marginTop: 14 }}>
          {busy ? `Uploading… ${Math.round(progress * 100)}%` : `Send payment${Number(amount) > 0 ? ` · ${fmt(amount)} ${IHSAN_CURRENCY}` : ''}`}
        </button>
      </form>

      <div className="section-label" style={{ marginTop: 26 }}>Payment history</div>
      {loading ? <div className="empty" style={{ padding: 30 }}><div className="sub">Loading…</div></div>
        : error ? <div className="empty" style={{ padding: 30 }}><div className="title">Could not load history</div><div className="sub">{error}</div></div>
        : !items.length ? <div className="empty" style={{ padding: 30 }}><div className="glyph"><i className="fa-solid fa-receipt" /></div><div className="title">No payments yet</div><div className="sub">Receipts you send will appear here with their review status.</div></div>
        : (
          <section className="card">
            {items.map((it) => (
              <div className="ih-row" key={it.id}>
                <span className="ih-row-img"><i className="fa-solid fa-receipt" /></span>
                <div className="ih-row-main">
                  <div className="ih-row-amt">{fmt(it.amount)} {IHSAN_CURRENCY}</div>
                  <div className="ih-row-sub">{it.accountLabel}{it.createdAt?.toDate ? ` · ${it.createdAt.toDate().toLocaleDateString()}` : ''}</div>
                </div>
                <span className={`ih-status ${it.status}`}>{STATUS[it.status] || it.status}</span>
              </div>
            ))}
          </section>
        )}
    </div>
  );
}

function SubscribeGate({ onSubscribe, busy, error }) {
  return (
    <div className="tab-pane">
      <div className="ih-gate">
        <div className="ih-gate-icon"><i className="fa-solid fa-hand-holding-heart" /></div>
        <h2>Join Ihsan</h2>
        <p>Subscribe to send your contributions and upload payment receipts. You can unsubscribe at any time from your profile.</p>
        {error && <div className="ih-msg err">{error}</div>}
        <button className="login-btn" type="button" onClick={onSubscribe} disabled={busy}>{busy ? 'Subscribing…' : 'Subscribe to Ihsan'}</button>
      </div>
    </div>
  );
}

export default function IhsanTab({ student }) {
  const sub = useIhsanSub(student);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (sub.loading) return <div className="tab-pane"><div className="empty"><div className="glyph"><i className="fa-solid fa-spinner fa-spin" /></div></div></div>;
  if (!sub.subscribed) {
    const go = async () => {
      setBusy(true); setErr('');
      try { await sub.subscribe(); } catch (e) { setErr(e.message || 'Could not subscribe — try again.'); } finally { setBusy(false); }
    };
    return <SubscribeGate onSubscribe={go} busy={busy} error={err || sub.error} />;
  }
  return <IhsanPay student={student} />;
}
