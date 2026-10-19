# JUMJ Student Portal

Sign-in-gated dashboard for students: their own overview, attendance history
(with the same day-of-week filter as the admin console), and enrolled
subjects. Same warm-paper "ledger" look as the admin roster, mobile-first,
built to read the **same Firestore project** the JUMJ admin console writes
to — no separate backend.

## Run it

```bash
npm install
cp .env.example .env   # then fill in the six values from JUMJ-admin.html's firebaseConfig
npm run dev
```

`npm run build` produces a static `dist/` you can deploy (Firebase Hosting
is the natural choice since it's already the same project).

## Schedule

Reads `settings/timetable` (the shared day/period config) and the
`timetables` collection (one doc per department/batch weekly grid) — same
data the admin console's Timetable screen edits. A session counts as this
student's if its subject is one they're enrolled in *and* the table's
department/batch isn't more specific than theirs (empty = everyone) — the
same rule the admin console uses to build a session's roster. The Overview
tab surfaces just today's sessions; the Schedule tab has every day. Both
are plain reads, no separate security concern like attendance has.

"Full timetable" (button on the Schedule tab) shows the whole weekly grid
for the student's class — every subject on their department/batch table,
not filtered down to just their own enrollment, so they can see the full
week the way the admin's Timetable screen shows it. It resolves subject
names from the whole `subjects` collection (not just the student's own
enrolled list) since a table can include subjects they aren't personally
in — that collection is already meant to be readable by any signed-in
user, so this needs no rule change beyond what's below.

## Results

Grades read from `students/{uid}/moduleResults/{subjectSlug}` — the same
per-component breakdown, total, and (if the admin console's cohort
recompute has run) rank/cohort-average the admin sees. Unlike attendance,
this one is safe to open up directly: it already lives *under* the
student's own document, so a rule scoping `students/{uid}/**` to
`request.auth.uid == uid` covers it with no denormalization needed.

## Events

The header is deliberately minimal — no greeting, no detail pills, just
the avatar (tap for profile) and sign out. Above it, an auto-scrolling
ticker shows posted events from a new `announcements` collection
(`{ title, body, date }`, newest first, capped at 20) — if it's empty the
ticker just doesn't render, so the header stays a plain thin bar with
nothing awkward left in its place.

**Nothing currently writes to `announcements`** — there's no "post an
event" screen in the admin console yet. Add docs directly in the
Firestore console for now to test it, or ask for that admin-side screen
to be built next. Suggested rule, read-only from this portal same as the
timetable:

```
match /announcements/{id} {
  allow read: if request.auth != null;
  allow write: if false; // no admin UI for this yet
}
```

## Profile

Tap the avatar in the header to open it. Name, email, department, batch
and gender are shown read-only — those are the admin's record of you, so
changing them happens on the admin console's side, not here. Phone number
and password are the two things a student can change themselves.

## How a student gets in

They sign in with the same email/password an admin created for their
`/students/{uid}` document. There's no self-signup here — that mirrors how
the admin console creates accounts.

## ⚠️ Before you point this at production data: fix the attendance rule

This is the one part of the wiring that needs a real decision, not just
config. Attendance docs are shaped like:

```
/attendance/{docId}  { subjectSlug, date, records: { uid1: "present", uid2: "absent", ... } }
```

Firestore security rules can only allow or deny a whole document — they
can't hide individual keys inside `records`. So if a rule allows a student
to read an attendance doc at all (e.g. "you can read it if your uid is a
key in `records`"), they can read **everyone else's status in that same
session**, not just their own. That's fine for the admin console (admins
only), but wrong for a portal students use directly.

Two ways to fix it properly:

1. **Denormalize on write (recommended).** When the admin console saves
   attendance, also write a small per-student doc, e.g.
   `/students/{uid}/attendanceLog/{docId}` containing just that student's
   own status for that session. Then this portal — and its security rules
   — only ever touch `students/{uid}/attendanceLog/*`, which is trivially
   safe to scope with `request.auth.uid == uid`. `useAttendance.js` would
   read that subcollection instead of querying `/attendance` directly.
2. **A Cloud Function.** A callable function reads `/attendance` with
   admin privileges and returns only the calling student's rows. More
   moving parts, but no schema change needed.

Until one of those is in place, **do not** open up broad read access to
`/attendance` for student accounts — leave the portal on the sample flow,
or restrict it to a test subject first.

A starting rules block for the parts that *are* safe to open up. Note the
`allow update` only affects the `phone` field — the profile screen only
ever writes `phone`, and the rule should enforce that too, so a modified
client can't rewrite `subjectIds`, `idConfirmed`, `department`, etc.:

```
match /students/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow update: if request.auth != null && request.auth.uid == uid
                && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['phone']);
}
match /subjects/{slug} {
  allow read: if request.auth != null;
}
match /settings/timetable {
  allow read: if request.auth != null;
  allow write: if false; // admin console only — never from this portal
}
match /timetables/{tableId} {
  allow read: if request.auth != null;
  allow write: if false; // admin console only — never from this portal
}
```

The Schedule tab and the "Today" card only ever call `getDoc`/`getDocs` on
these two — there's no save/edit path in this portal's code for the
timetable at all, so `allow write: if false` here doesn't take anything
away from a student; it just makes explicit, at the rules level, what's
already true in the app.

Password changes go through Firebase Auth directly (`reauthenticateWithCredential`
+ `updatePassword`), not Firestore, so they don't need a rule — Firebase
already only lets a signed-in user change their own password.

## Ihsan (payment receipts)

Students tap **Ihsan → Subscribe** (one button) to join; they can unsubscribe from their profile.
Banks, Telegram settings, subscribers and payment review are all managed in the **admin console → Ihsan**.
Receipts are **never stored in Firebase**: the app sends them to your Telegram chats/channels with the bot, and
Firestore keeps only the payment metadata + Telegram `file_id`s (admins fetch the photo back from Telegram to review).

Collections: `ihsanSubscribers/{uid}`, `ihsanAccounts/{id}`, `ihsanConfig/telegram` (`botToken`, `chatIds`), `ihsanPayments/{id}`.

Suggested rules (replace `isAdmin()` with your existing admin check):

```
function ihsanSub(){ return exists(/databases/$(database)/documents/ihsanSubscribers/$(request.auth.uid)); }
match /ihsanSubscribers/{uid} {
  allow create, delete: if request.auth != null && request.auth.uid == uid;
  allow read: if request.auth != null && (request.auth.uid == uid || isAdmin());
  allow delete: if isAdmin();
}
match /ihsanAccounts/{id} { allow read: if request.auth != null && (ihsanSub() || isAdmin()); allow write: if isAdmin(); }
match /ihsanConfig/{id}   { allow read: if request.auth != null && (ihsanSub() || isAdmin()); allow write: if isAdmin(); }
match /ihsanPayments/{id} {
  allow create: if request.auth != null && ihsanSub() && request.resource.data.uid == request.auth.uid && request.resource.data.status == 'pending';
  allow read: if request.auth != null && (resource.data.uid == request.auth.uid || isAdmin());
  allow update: if isAdmin();
}
```

⚠️ The bot token must be readable by subscribed students' browsers so the app can call Telegram — anyone
technical could extract it. Use a dedicated bot that only posts to your chats, and rotate it if it leaks.
A Cloud Function proxy would remove this exposure.
