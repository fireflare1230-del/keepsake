# Keepsake PDR v1.3: "In Your Pocket"

**Product Design Requirements, July 14, 2026**
Builds on PDR v1.2 (applied). This release borrows the best patterns from popular consumer apps, and puts Keepsake on the caretaker's and the person's phone as an installable app.

---

## 0. Goals

1. **Photo moments** (pattern: GreyMatters life storybooks, Google Photos "Memories"): family photos become the warmest step of a visit.
2. **Daily reminders** (pattern: Duolingo/Calm daily nudges): help the visit become a ritual, built honestly within web-platform limits.
3. **Milestones & the keepsake shelf** (pattern: Duolingo streak milestones, Headspace journey): gentle celebration of showing up, never memory.
4. **On the phone** (pattern: every real app): published to a permanent URL, installable to the home screen, offline-capable.

Non-goals: accounts for the patient, server-sent push notifications (needs a backend; revisit if one ever exists), photo cloud sync (photos stay on-device by design).

---

## 1. Feature: photo moments

### 1.1 Behavior

- The caretaker adds up to 12 photos in the Profile editor, each with a short warm caption ("Your wedding day, 1972", "The lake house porch").
- A **photo moment** joins the special-moment rotation (music one visit, a favorite the next, a photo the next). Lane shares the caption warmly; the chips are feelings, never "do you remember" (photo reminiscence follows the same golden rules: share, then invite).
- The moment is recorded in the transcript ("Lane shared a photo: Your wedding day, 1972") so the visit log tells the whole story.

### 1.2 Technical

- **IndexedDB, not localStorage**: photos are far too big for localStorage's ~5 MB. New `lib/photos.ts` wraps a tiny IndexedDB store (`keepsake-photos` DB, `photos` object store keyed by id, records `{id, profileId, caption, blob, createdAt}`).
- Photos are **downscaled on import** (canvas, max edge 1280 px, JPEG quality 0.82), so a dozen photos costs a few MB, fine for a tablet.
- Deleting a profile deletes its photos. Photos are **not** in JSON backups or cloud backups v1 (size); the backup screen says so honestly.
- Metadata (`PhotoMeta` without the blob) is what routes see; object URLs are created and revoked per render.

### 1.3 Chips (honest, per PDR v1.2 §3)

"That's a lovely picture" / "Tell me about it" (Lane then re-shares the caption warmly plus one sentence) / "Next, please" (gentle exit, no pressure).

---

## 2. Feature: daily visit reminder

### 2.1 The honest constraint

Web apps cannot schedule a future notification client-side: the Notifications API has no scheduler, Notification Triggers never shipped, and Web Push requires a server to send each push. Keepsake has no server by design. Faking it would mean a reminder that silently never fires, the worst outcome for a caregiving app.

### 2.2 The design (pattern: what reliable apps do without a backend)

- Settings gains **"Daily visit reminder"**: pick a time, tap **Add to my phone's calendar**.
- Keepsake generates a standards-compliant **.ics file**: a daily-recurring `VEVENT` ("💛 Visit with Lane") with a `VALARM` at the chosen time, `RRULE:FREQ=DAILY`. Every phone's calendar (iPhone, Android, Outlook, Google) imports it and then **the OS delivers the reminder**, more reliably than any PWA push.
- The Settings copy explains the choice in one honest sentence.

---

## 3. Feature: milestones & the keepsake shelf

### 3.1 Milestones

- Thresholds: **3, 7, 14, 30, 60, 100** days in a row.
- When a completed visit's new streak lands exactly on a threshold, the done screen shows a **milestone card** beneath the streak: a bigger sunflower moment with a hand-written line per tier ("Three days in a row. A habit is taking root. 🌱").
- Never framed as a score; always about showing up. Missing a day never shames (no "streak lost" messaging anywhere).

### 3.2 The keepsake shelf (pattern: Headspace/Duolingo collectibles, made calm)

- Every completed visit leaves a **memento**: the theme's emoji.
- The caretaker Dashboard gains a **"Keepsake shelf"** card: mementos of the most recent visits arranged in a row, plus earned milestone badges. A quiet, warm record that the ritual is alive.
- Data is derived entirely from existing visits + progress; no new storage.

---

## 4. Feature: on the phone

### 4.1 Publishing (GitHub Pages)

- Repo pushed to GitHub; `dist/` published on the `gh-pages` branch. Vite `base: './'` and the HashRouter already make the build path-independent.
- HTTPS from Pages satisfies the service-worker requirement; the existing `sw.js` + manifest make it installable.
- One-time user actions (account security): create the GitHub repo and sign in when git pushes. Everything else is automated.

### 4.2 Install experience

- Manifest verified (name, icons 192/512 + maskable, standalone display; em dash in the name removed per house style).
- Settings gains **"Put Keepsake on your phone"**: the site URL as a QR-less copy button plus per-platform steps (iPhone: Share → Add to Home Screen; Android: menu → Install app).

### 4.3 Data reality (stated in UI copy)

Each device keeps its own data (localStorage + IndexedDB). The existing cloud backup (optional account) moves profiles/visits between devices; photos stay on the device that added them.

---

## 5. Acceptance criteria

1. Adding a photo in the Profile editor shows it in the grid with its caption; the next eligible visit's special moment is that photo with honest chips; the transcript records it.
2. Photos survive a reload (IndexedDB), and deleting the profile removes them.
3. The reminder downloads an .ics that imports as a daily repeating event with an alarm at the chosen time.
4. Completing a visit that lands on 3 days in a row shows the milestone card; the Dashboard shelf shows mementos and earned badges.
5. `tsc` + `vite build` clean; all flows verified in the browser.
6. The site loads from the GitHub Pages URL on a phone and can be added to the home screen (user-verified on their device).
7. No em dashes anywhere, including the manifest.

---

## 6. Backlog notes carried forward

Photo cloud sync, real push reminders (both need a backend), voice-first visits, care-team sharing: unchanged from PDR v1.2 §6.

---

*Written July 14, 2026. Where this conflicts with earlier documents, this wins for v1.3.*
