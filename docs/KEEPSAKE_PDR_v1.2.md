# Keepsake PDR v1.2: "Ready to Post"

**Product Design Requirements, July 13, 2026**
Builds on `KEEPSAKE_PRD.md` (v1.0/v1.1). This document covers the v1.2 release: the release that makes Keepsake feel like a real, shipped product rather than a prototype.

---

## 0. Goals of this release

1. **Lane learns.** Profile data the caretaker never filled out can be discovered by Lane through natural conversation, reviewed by the caretaker, and folded into the profile over time.
2. **Nothing prefires.** No answer chip ever puts a claim in the person's mouth ("We watched every game", "I drank tea"). Chips are honest responses: feelings, preferences between offered options, and gentle exits.
3. **Launch-quality feel.** Motion, polish, empty states, and copy at the level of a published consumer app, while staying calm and dementia-appropriate.

Non-goals for v1.2: native mobile apps, multi-caretaker accounts, photo storage (listed in §7 Backlog).

---

## 1. Competitive grounding (research, July 2026)

| Product | What it does well | What Keepsake takes from it |
|---|---|---|
| Memory Lane Games | Nostalgia games, zero-failure design | Errorless interaction (already core) |
| GreyMatters | Caregiver-built "life storybooks" | Profile as living document, now co-written by Lane |
| Kathy (memory-care AI) | Daily caregiver reports, mood tracking, proactive flags | Post-visit summaries + a review inbox with actionable items |
| inTouch | Analyzes conversation to find the most positive topics | Learned "what lights them up" signals per profile |
| Living Memory Home (research app) | Collaborative reminiscence reduces caregiver grief | Caretaker sees warm highlights, never memory scores |

Common thread in every real product: **the app gets more personal the more it is used, and the caregiver stays in the loop.** That is exactly the v1.2 learning system.

---

## 2. Feature: Lane learns (the discovery loop)

### 2.1 Behavior

- After every completed AI-mode visit, the same API call that writes the caretaker summary also extracts **candidate facts**: things the person volunteered that are not yet in the profile (hometown, a happy memory, a favorite food/drink/team/show/hobby, a life-story detail, a topic that clearly delighted or upset them).
- Candidates land in a **"Lane noticed" review inbox** on the caretaker dashboard. Nothing is applied automatically. This is a safety requirement: a misheard fact repeated back to a person with Alzheimer's is worse than no fact.
- The caretaker taps **Add to profile** or **Not right**. Approved facts merge into the correct profile field; dismissed facts are remembered so they are not re-suggested.
- Approved facts flow into Lane's system prompt on the next visit exactly like caretaker-entered data. Over many visits, an almost-empty profile fills itself out.

### 2.2 Extraction contract (AI)

The summary JSON gains one field:

```json
"learned": [
  {"category": "hometown", "value": "Macon, Georgia", "quote": "I grew up outside Macon"}
]
```

- `category` ∈ `hometown | happyMemory | food | drink | sport | show | hobby | lifeStory | delight | avoid`
- `value`: short, plain phrasing suitable for the profile.
- `quote`: the person's own words that support it (shown to the caretaker as evidence).
- Rules: only what the PERSON said (never Lane), no inferences from silence, no medical content, maximum 3 per visit, empty array when nothing new.

### 2.3 Merge rules (on approve)

| Category | Merge target |
|---|---|
| hometown / happyMemory | Fill the field if empty; otherwise append to Life story |
| food / drink / sport / show / hobby | Append to the matching Favorites list (deduped, case-insensitive) |
| lifeStory / delight | Append as a line to Life story notes |
| avoid | Append to Topics to avoid |

### 2.4 Data & storage

- New type `LearnedFact { id, profileId, category, value, quote, sourceVisitId, visitDate, status: 'pending'|'approved'|'dismissed', decidedAt? }`
- Stored at `keepsake:learned:<profileId>`, included in backups and cloud sync, capped at the newest 200 records.
- Scripted (no-key) mode performs **no extraction**. The inbox explains this honestly.

### 2.5 UX

- Dashboard card "Lane noticed" with a count badge, only rendered when pending items exist.
- Each item: the proposed fact, the category chip, the supporting quote in the person's voice, Approve / Dismiss buttons, and which visit it came from.
- A quiet history link shows previously approved/dismissed items (undo = remove from profile field is manual via Profile editor; the inbox history is the audit trail).

---

## 3. Feature: honest chips (no prefired claims)

### 3.1 The rule

> A chip may express a **feeling now** ("That sounds lovely"), a **choice between offered options** ("Outdoors, always"), or a **gentle exit** ("I'm not sure"). A chip may never assert a **specific autobiographical event or habit** the person has not themselves stated ("We watched every game", "I drank tea", "Many happy hours").

Preference-choice chips remain allowed when they answer a direct either/or question Lane just asked; that is the person choosing, not the app claiming.

### 3.2 Scope of the audit

- `data/themes.ts`: all 12 themes × 3 turns × 3 chips. Choice chips answering either/or questions stay; claim-style chips are rewritten.
- `features/checkin/moments.ts`: all 5 favorites categories. These were the worst offenders ("We watched every game", "My favorite", "I loved it", "Many happy hours") and are fully rewritten to present-tense responses ("That sounds wonderful", "Tell me more about that", "Not today").
- `routes/CheckIn.tsx` family step: "I love them" stays (a feeling, freely chosen), "They make me smile" stays; audit for anything event-like.
- **AI path:** `REPLY_FORMAT` in `prompt.ts` gains the explicit rule with examples; `parser.ts` gains a guard that rewrites/filters chips matching claim patterns (e.g. starting with "We " + past tense, "I used to", "I always") as defense in depth.

---

## 4. Feature: launch-quality polish

### 4.1 Motion language (calm, purposeful)

- All motion respects `prefers-reduced-motion` (already global).
- Patient screens: slightly softer/slower easing, gentle fade-rise on step change (existing `step-enter`, tuned), a soft scale-in for Lane's bubble, a gentle sunflower/confetti-free celebration on the done step (slow floating petals, not confetti bursts).
- Buttons/chips: subtle press scale (0.98), hover lift, focus ring unchanged.
- Caretaker screens: card hover elevation, staggered list entrance on dashboard, count-up on streak numbers.

### 4.2 Landing page

- Tightened hero, believable product vignette, trust strip (Private by design, Works offline, Free), a short "How it works" with three steps, a gentle FAQ, and a real footer (version, privacy note, GitHub-style credits).

### 4.3 Caretaker area

- Dashboard: "Lane noticed" inbox (above insights), warmer empty states before the first visit, checklist stays.
- Visit log: mode/duration/mood at a glance, learned-fact markers on visits that produced discoveries.
- Profile editor: fields show a small "Learned by Lane" hint next to values that came from approvals (via inbox history match).

### 4.4 App-feel details

- Page `<title>` per route, favicon/PWA icons verified, 404 fallback route, keyboard navigation pass, empty-state illustrations from the existing logo language.

---

## 5. Acceptance criteria

1. A visit where the person types "I grew up in Macon" produces a pending "Lane noticed" item after the summary call; approving it sets Hometown = "Macon, Georgia" (or appends when occupied); the next visit's system prompt contains it.
2. Dismissing an item prevents the same value from re-appearing across future visits.
3. With no API key, the inbox shows the honest explanation and never fabricates learned facts.
4. No chip anywhere in scripted content asserts an autobiographical event; the AI chip contract states the rule; the parser filters violations.
5. `tsc` and `vite build` pass clean; a full visit and the inbox flow verified in-browser.
6. All copy remains free of em dashes.

---

## 6. Out of scope for v1.2 (backlog for v1.3+)

- **Photo moments**: caretaker uploads family photos; a visit step shows one with a warm caption (needs storage strategy; localStorage is too small, likely IndexedDB).
- **Voice-first visits**: full hands-free mode with wake-on-silence turn taking.
- **Weekly caretaker email digest** (needs a backend or notification API).
- **Multi-device sync of visits** beyond the existing manual/cloud backup.
- **Care-team sharing**: multiple caretakers, roles, and handoff notes.
- **Longitudinal mood/engagement report export for clinicians** (PDF of trends; a printable report exists today).

---

*Written July 13, 2026. Amends PRD v1.1; where this document conflicts with the PRD, this document wins for v1.2.*
