# Keepsake — Product Requirements Document

**Reconnect. Remember.**
*A warm, simple AI memory companion for people living with Alzheimer's and their caretakers.*
*"Built by a grandson, for his grandfather."*

| | |
|---|---|
| **Product** | Keepsake — a client-side, bring-your-own-key web app |
| **Version** | v1.0 · July 11, 2026 · Status: Ready for build |
| **Owner** | Aven |
| **Intended builder** | Claude Fable 5, running in Claude Code |
| **Read first** | RESEARCH_AND_CONVERSATION_GUIDE.md (clinical evidence + playbook) |

> Keepsake is a wellbeing and companionship tool, not a medical device, and
> does not provide medical advice.

*(This is the repo's Markdown copy of the PRD, converted from the original
PDF per §16.1.)*

> **v1.1 amendment (July 12, 2026, decided by the product owner):** an
> *optional* cloud account (Supabase, free tier) was added for backup and
> cross-device restore. This deliberately amends §6.1's "no backend" for
> that one opt-in feature. The load-bearing part of §6 is unchanged: no
> shared or hardcoded AI key exists anywhere, the AI key never leaves the
> user's browser except to api.anthropic.com, and the app is fully usable
> with no account and no key. v1.1 also added per-answer branching to the
> scripted playbook, a "favorite things" profile section with a rotating
> special moment, natural-voice selection, new fonts, and two new themes
> (Sports & games, Movies & shows).

## 0. How to use this document (for the builder)

This is the complete specification for Keepsake. Read it top to bottom
before writing any code, then read RESEARCH_AND_CONVERSATION_GUIDE.md for
the evidence-based conversation rules that govern the AI's behavior.

Build in the milestone order given in Section 14. Work in clear, explained
steps — the product owner is still learning to code, so narrate what you
are doing in plain language. Put the application in a subfolder named
`keepsake-app/`.

Two things in this document are load-bearing and must never be compromised:
the **billing-safety architecture (Section 6)** and the **conversation
safety rules (Section 8)**. Everything else is negotiable if you find a
better approach — but flag it before deviating.

Sections 1–15 are the faithful specification. Section 16 is a separate
"Recommendations & Concerns" section containing the author's (Claude's)
engineering suggestions, cost notes, and explicit warnings. Treat Section
16 as advice, not requirements — the product owner decides what to adopt.

## 1. Executive summary

Keepsake is a calm, elderly-friendly web app that gives a person living
with Alzheimer's a short, pleasant daily "visit" with a gentle AI companion
named Lane. Lane follows evidence-based dementia-communication techniques:
it never quizzes or corrects, it shares memories rather than testing
recall, it favors early-life reminiscence, and it reinforces one reassuring
fact per visit. A caretaker sets up the person's profile and reviews mood,
engagement, and visit summaries from a simple dashboard.

The app is 100% client-side with no backend server and no shared API key.
Each user supplies their own Anthropic API key (stored only in their own
browser) or uses a free, no-key scripted mode. This means the product owner
is never billed when other people use it — the single most important
product constraint.

Keepsake is a wellbeing and companionship tool, not a medical device, and
it does not provide medical advice.

## 2. Background & motivation

The product was inspired by the owner's grandfather. People with
Alzheimer's progressively lose recent memories while early-life memories
are preserved longest. Conventional interaction often accidentally harms
them: asking "do you remember…?" forces a failed retrieval that produces
shame and anxiety, and correcting their reality ("no, Mom died years ago")
forces them to re-grieve news they cannot retain.

Decades of clinical practice point to a better pattern — support memory
instead of testing it: share, cue, repeat, reminisce, and validate
feelings. Keepsake packages those techniques into a friendly daily ritual
that a non-clinical family caretaker can run with a tablet, and that a
person with dementia can enjoy without ever feeling tested.

The full evidence base — Spaced Retrieval Training, Reminiscence Therapy,
"share don't test" communication, Errorless Learning, Validation, Cognitive
Stimulation Therapy, the Montessori approach, and Music & Memory — is
documented in RESEARCH_AND_CONVERSATION_GUIDE.md and summarized in
Section 7.

## 3. Goals, non-goals, and success metrics

### 3.1 Goals

1. Give a person with Alzheimer's a short, emotionally positive daily
   interaction that never makes them feel tested or corrected.
2. Encode the evidence-based conversation rules so tightly that Lane cannot
   easily violate them.
3. Give caretakers a low-effort setup and an at-a-glance view of mood,
   engagement, and gentle "flags" over time.
4. Guarantee the owner is never billed for anyone else's usage
   (bring-your-own-key / no-key).
5. Be usable by elderly, low-tech, possibly visually- or motor-impaired
   users without training.
6. Run entirely offline-capable and privately, with all data on the user's
   own device.

### 3.2 Non-goals (v1)

1. No backend, accounts, database, or cloud sync.
2. No medical diagnosis, medication management, or clinical claims.
3. No caregiver social network, messaging, or multi-device sync.
4. No photo library, video calls, or telehealth (candidate for v2).
5. No monetization, ads, or analytics that transmit data off-device.

### 3.3 Success metrics (qualitative, since there is no telemetry)

Because Keepsake sends no data off-device, success is judged locally by the
caretaker: the person completes visits willingly and returns across days
(streak of "showing up"); mood readings trend flat-or-up; the caretaker
finds the summaries useful enough to keep reading them; the person shows no
signs of distress during visits. The owner may also use the build itself as
a computer-science portfolio and IWA/college-essay artifact.

## 4. Personas

**Persona A — The Caretaker (primary operator).** An adult family member or
professional caregiver. Sets up one or more patient profiles, enters
life-story details, manages the API key and settings, and reviews the
dashboard. Comfortable enough with a tablet to follow a checklist; not
necessarily technical. Enters the app through a simple local PIN.

**Persona B — The Person Living with Alzheimer's (primary experiencer).**
Elderly, mild-to-moderate cognitive impairment, possible
vision/hearing/motor decline. Never logs in — the caretaker hands them the
device already on the check-in screen. Needs very large targets, very
simple choices, calm pacing, and zero opportunity to "fail."

**Persona C — The Builder/Developer (the owner).** Learning to code; will
run Claude Code (Fable 5) to build and iterate, then test with a real
profile of their grandfather. Needs clean, commented, well-organized code
and a plain-language README.

## 5. Product overview & primary user flows

**Caretaker first-run:** Landing page → Get Started → onboarding wizard
(create first profile, optionally paste API key) → set a PIN → lands in the
caretaker dashboard.

**Daily use (the core loop):** Caretaker opens the app → hands the device
to the person on the Daily Check-in screen → the person completes a calm,
one-step-at-a-time visit with Lane → the visit auto-saves → later, the
caretaker opens the caretaker area (PIN) to read the summary and trends.

**The daily check-in shape** (echoes Cognitive Stimulation Therapy): warm
greeting by name → mood (5 big emoji) → AI conversation (3–5 turns,
anchored to the day's rotating theme) → music moment (embed a favorite
song) → reminiscence about one family member → celebration with a daily
streak → auto-save.

## 6. THE CRITICAL CONSTRAINT — billing safety (must never be violated)

This section overrides any convenience consideration. If any requirement
elsewhere appears to conflict with this section, this section wins.

1. **100% client-side.** No backend server, no serverless functions, no
   database, no shared/hardcoded API key anywhere in the code or repo.
2. **Bring-your-own-key.** Each user supplies their own Anthropic API key,
   stored only in their own browser via localStorage. The app calls the
   Anthropic Messages API directly from the browser using the header
   `anthropic-dangerous-direct-browser-access: true`.
3. **No-key mode always works.** With no key present, the app is fully
   usable via friendly built-in scripted prompts and canned suggestion
   chips — so anyone can use it for free and the person is never blocked by
   a missing key.
4. **Consequence:** because no key is ever in the code, the built static
   site is safe to host publicly — the owner is never billed when someone
   else uses it; each visitor uses their own key or the free no-key mode.
5. The key is never transmitted anywhere except directly to
   api.anthropic.com from the user's own browser. No proxy, no logging
   service, no third party.

*Verified July 2026: Anthropic's API supports browser-direct CORS calls via
the `anthropic-dangerous-direct-browser-access: true` header, and Anthropic
explicitly calls out "bring your own API key" as the intended safe pattern
for it. See Section 16 for the security caveats.*

## 7. Clinical grounding → feature mapping

Full detail lives in RESEARCH_AND_CONVERSATION_GUIDE.md. The builder must
ensure each technique below is actually reflected in the product, not just
the marketing copy.

| Technique | What it means | Where it lives in Keepsake |
|---|---|---|
| Spaced Retrieval Training (SRT) | Reinforce one reassuring fact by restating it at intervals; leans on procedural memory. | "Gentle facts to reinforce" profile field. Lane warmly restates one fact per visit — never as a quiz. |
| Reminiscence Therapy | Revisit preserved early-life memories via prompts. | Each visit rotates to a new life theme, favoring early life; shown as a "topic card." |
| Share, don't test | Never ask "do you remember?"; state the memory and invite a feeling. | Hard-coded into Lane's system prompt; enforced by the JSON suggestion format. |
| Errorless learning & Validation | Remove chances to "fail"; never correct or argue — respond to the emotion. | "Topics to gently avoid" field; validation rules in Lane's prompt. |
| Cognitive Stimulation Therapy (CST) | Structured themed sessions: warm-up, song, topic. | The fixed visit shape: greeting+mood warm-up, rotating theme, a song, consistent daily structure. |
| Montessori approach | Respect, sensory engagement, structured choice, "demonstrate more, talk less," match pace. | Tap-able answer chips (structured choice), sensory prompts, short language, self-paced steps. |
| Music & Memory | Personalized era-appropriate music reaches emotional memory. | The music step embeds the person's own favorite songs (YouTube). |

## 8. Conversation design specification — "Lane" (safety-critical)

Lane's behavior is a safety feature. These rules must be baked into the
system prompt and, where possible, enforced structurally by the
UI/response format.

### 8.1 The seven golden rules (encode all of them)

1. **Never quiz.** No "do you remember?", "what's my name?", or any test of recall.
2. **Share, then invite.** State a warm memory, then invite a feeling — never demand a fact.
3. **Aim at early life.** Childhood and young adulthood are the strongest, safest ground.
4. **Use the senses.** Smell, taste, sound, touch open doors facts can't.
5. **Offer choices, not blanks.** "The seaside or the mountains?" beats "Where did you go on holiday?"
6. **Validate feelings; never correct facts.** Meet the person where they are.
7. **Any answer is a win.** If they can't recall, warmly share it yourself and move on.

### 8.2 System-prompt construction

Build Lane's system prompt at runtime from: (a) the fixed golden rules
above, plus (b) the active patient profile — preferred name, family &
important people, life-story notes, the day's rotating theme, the one
"gentle fact to reinforce" for this visit, and the "topics to gently avoid"
list. Additional style constraints: keep replies to 1–3 short sentences;
warmly restate exactly one gentle fact per visit as a statement (never a
quiz); anchor the conversation in today's theme; always offer an easy exit
("I'm not sure" / "Tell me more").

### 8.3 The JSON response contract (structural safety)

Lane must reply only as strict JSON so the UI can render tap-able chips
instead of a blank text field (blanks invite failure):

```json
{ "message": "string — 1 to 3 short, warm sentences",
  "suggestions": ["short chip 1", "short chip 2", "…up to 4"] }
```

- Always include a gentle "I'm not sure" / "Tell me more" style option
  among the suggestions.
- The UI renders suggestions as 2–4 large tap-able answer buttons, plus a
  free-text box, a microphone (voice input), and a speaker (read-aloud) —
  see Section 9.4.
- The client must defensively parse this JSON (models occasionally wrap it
  in prose or code fences) and fall back gracefully if parsing fails
  (Section 16.4).

### 8.4 Post-visit caretaker summary (second AI call)

After the visit, make one additional call that returns a caretaker summary
as strict JSON:

```json
{ "summary": "2–4 sentence plain-language recap for the caretaker",
  "engagement": 3,
  "highlights": ["notable warm moment", "…"],
  "flags": ["gentle concern, if any — e.g., seemed sad about a topic"],
  "encouragement": "one supportive line for the caretaker" }
```

Store this on the visit record. The summary never scores memory
performance — only engagement and emotional tone.

### 8.5 Rotating themes

Rotate the reminiscence theme each visit across: Childhood, Family, Work &
pride, Music, Food & senses, Places, Holidays, Pets, Nature, Fun. Favor
early-life themes. Persist which theme was last used per profile and
advance to the next each visit. Show the day's theme as a friendly topic
card.

### 8.6 No-key scripted mode

When no API key is set, Lane runs from a built-in scripted playbook derived
from the themed question bank in the research guide: pre-written
share-then-invite lines per theme, each with 2–4 canned suggestion chips,
still obeying every golden rule. The visit shape, music step, reminiscence,
streak, and save all work identically; only the summary is a simple
templated recap rather than an AI-generated one.

## 9. Functional requirements

### 9.1 Public landing page
- **FR-1** Hero headline: "Help your loved one remember the moments that matter."
- **FR-2** A "Built by a grandson, for his grandfather" story section.
- **FR-3** A 3-step "How it works" section.
- **FR-4** A prominent "Get Started" button leading into onboarding.
- **FR-5** Footer disclaimer: "Keepsake is a wellness companion, not a medical device. Always consult healthcare providers."

### 9.2 Onboarding wizard (first run)
- **FR-6** Create the first profile: name and preferred name (required); optional birth year, hometown, and one happy memory.
- **FR-7** Optional field to paste an Anthropic API key, with clear "you can do this later" messaging.
- **FR-8** On completion, prompt to set a caretaker PIN, then land in the caretaker dashboard.
- **FR-9** The wizard is skippable to the minimum (just names) so setup takes under two minutes.

### 9.3 Multiple patient profiles
- **FR-10** Support multiple profiles, each with independent data and visit logs.
- **FR-11** Easy switching between profiles from the caretaker area.
- **FR-12** Each profile is fully editable and deletable (with confirmation).

### 9.4 Patient daily check-in (the core experience)
- **FR-13** A calm, one-step-at-a-time guided flow with a progress bar and the companion "Lane."
- **FR-14** Step order: warm greeting by name → mood (5 big emoji) → AI conversation (3–5 turns) → music moment → reminiscence about one family member → celebration with the daily streak → auto-save the visit.
- **FR-15** After each Lane message, show 2–4 large tap-able answer buttons matching the question, plus a free-text box, a microphone button (Web Speech API voice input), and a speaker button (read message aloud).
- **FR-16** Rotate the reminiscence theme each visit (Section 8.5) and display it as a topic card.
- **FR-17** No login for the patient — the caretaker hands over the device already on this screen.
- **FR-18** The music moment embeds one of the profile's favorite YouTube songs, in-app.
- **FR-19** The flow must be fully completable with no API key (scripted mode) and with a key (AI mode).
- **FR-20** Auto-save the full visit (mood, theme, transcript, timestamps, streak) on completion; also save partial progress if the visit is interrupted.

### 9.5 Caretaker area (PIN-protected)
- **FR-21** Gate the caretaker area behind a simple local PIN, with a "reset PIN" path.
- **FR-22** A quick-start checklist for new caretakers.
- **FR-23** Profile editor with: name & preferred name; family & important people; favorite music as YouTube links; life story; topics to gently avoid; and gentle facts to reinforce (for spaced retrieval).
- **FR-24** Dashboard showing: last visit summary; mood and engagement trend charts; a flags panel; and the current daily streak.
- **FR-25** Visit log listing every visit with full transcripts, openable individually.
- **FR-26** Export visit data to JSON and CSV.
- **FR-27** Settings: API key field with a "forget key" button; model picker; PIN change; read-aloud toggle; and a "Test connection" action.

### 9.6 Streak & rewards
- **FR-28** A daily streak that rewards showing up, incremented once per calendar day a visit is completed.
- **FR-29** The app must never score whether the person remembered anything correctly — no memory grading, ever.

### 9.7 AI integration (Lane)
- **FR-30** Build the system prompt per Section 8.2 from the active profile plus the golden rules.
- **FR-31** Call the Anthropic Messages API directly from the browser with the user's own key and the browser-access header.
- **FR-32** Enforce the JSON response contract (Section 8.3) with defensive parsing and graceful fallback.
- **FR-33** Make the model configurable via the model picker (Section 12.4); default to the cheapest.
- **FR-34** Generate the post-visit caretaker summary (Section 8.4).
- **FR-35** Handle errors visibly and kindly: missing key, invalid key, rate limit, network failure, and malformed response each show a calm message and never crash the visit.

## 10. Non-functional requirements

### 10.1 Accessibility (elderly users — non-negotiable)
- **NFR-1** Body text 18–20px; headers 28px+; buttons at least 48px tall.
- **NFR-2** Color contrast ≥ 4.5:1 for all text; never rely on color alone to convey meaning.
- **NFR-3** No pure-white and no busy/patterned backgrounds; rounded 12px corners; generous spacing.
- **NFR-4** Full keyboard operability and visible focus states; semantic HTML and ARIA labels on all controls.
- **NFR-5** Read-aloud (speech synthesis) for Lane's messages; voice input (speech recognition) for answers.
- **NFR-6** One primary action per screen; calm pacing; no time pressure, no auto-advancing that could confuse.
- **NFR-7** Target WCAG 2.1 AA as the working standard.

### 10.2 Brand & design system
- **NFR-8** Name "Keepsake"; tagline "Reconnect. Remember."; story line "Built by a grandson, for his grandfather."
- **NFR-9** Color tokens: background `#FAF6F0`; text `#1A2332`; brand accent `#5E93AC`; primary buttons amber `#E8A04C`; secondary sage `#8FB39A`; success moss `#6B9F71`; alerts rust `#C56A53`.
- **NFR-10** Typography: Inter. Warm, uncluttered, high-contrast, spacious.

### 10.3 Privacy & data
- **NFR-11** All personal data and visit logs stay in the user's browser (localStorage); nothing is transmitted off-device except the direct API calls to Anthropic.
- **NFR-12** No analytics, trackers, or third-party calls that carry personal data.
- **NFR-13** Provide export (JSON/CSV) so the caretaker owns and can back up their data.
- **NFR-14** A "forget key" control removes the stored API key immediately.

### 10.4 Performance & platform
- **NFR-15** Builds to a static site (`npm run build`) that opens locally or hosts free.
- **NFR-16** Loads fast on a modest tablet; smooth on touch; responsive from phone to desktop, optimized for tablet.
- **NFR-17** Works offline for everything except the live AI calls.

### 10.5 Security
- **NFR-18** The PIN gates casual access to the caretaker area on a shared device; it is not hard security.
- **NFR-19** The API key lives only in localStorage and is sent only to Anthropic; the owner should use a dedicated workspace with a low spend cap.

## 11. Technical architecture

**11.1 Stack:** Vite + React + TypeScript + Tailwind CSS. No backend. All
state in the browser via localStorage. No accounts, no database. Static
build output.

**11.2 Project structure:** routes/, components/, features/
(profiles/checkin/lane/caretaker), lib/ (storage, schema/versioning,
csv/json export, themes, speech, youtube), styles/, data/.

**11.3 State & storage:** React state/context for the running session and
a thin typed storage.ts wrapper over localStorage. Namespace all keys under
`keepsake:` and store a schema version so future migrations are safe.

**11.4 API layer:** A single `lane/apiClient.ts` performs
`POST https://api.anthropic.com/v1/messages` with headers `x-api-key`,
`anthropic-version: 2023-06-01`, `content-type: application/json`, and
`anthropic-dangerous-direct-browser-access: true`. It centralizes model
selection, error mapping, and JSON extraction. No other module talks to the
network.

## 12. Data model

TypeScript interfaces for Person, MusicLink, Profile, Message,
VisitSummary, Visit, Settings, and app state — see `src/types.ts` for the
implemented shapes (per the PRD: names may be refined; shapes and the
schema-version field are kept).

### 12.4 Model picker — current model IDs (verified July 2026)

| Label in picker | Model ID | ~Input/Output per 1M tokens | Use |
|---|---|---|---|
| Haiku (cheapest) — default | `claude-haiku-4-5-20251001` | ~$1 / ~$5 | Everyday visits; lowest cost. |
| Sonnet (balanced) | `claude-sonnet-5` | ~$2 / ~$10 (intro thru Aug 31, 2026; then ~$3 / ~$15) | Warmer, more natural conversation. |
| Opus (premium, optional) | `claude-opus-4-8` | ~$5 / ~$25 | Highest quality; rarely needed here. |

Default to Haiku for cost. Always show a note to confirm current prices on
Anthropic's pricing page.

### 12.5 Cost expectation

A daily visit is short (a few thousand tokens across 3–5 turns plus one
summary call). On Haiku this is typically a fraction of a cent to a few
cents per visit, i.e. roughly $1–2/month for one visit a day. The owner
should set a monthly spend cap (≈$5) on a dedicated workspace.

## 13. Error handling & edge cases (must be handled, not crashed)

Missing key → offer scripted no-key mode, don't block. Invalid/expired key
→ calm "let's check your key" message pointing to Settings → Test
connection. Rate limit / 429 → gentle "let's pause a moment" retry. Network
failure → fall back to scripted mode for the current turn if possible.
Malformed AI JSON → defensive parse (strip code fences, extract first JSON
object); if still unparseable, show a safe scripted fallback message rather
than raw text. YouTube video not embeddable → friendly "couldn't play this
one" handling and continue. Speech API unsupported → hide mic/speaker
gracefully. Interrupted visit → save partial progress and allow resume or a
clean restart.

## 14. Milestones (build in this order)

- **M0 — Scaffold.** Vite + React + TS + Tailwind; brand tokens; routing; empty screens; git init + .gitignore.
- **M1 — Data layer.** storage.ts, schema + versioning, Profile model, onboarding wizard, multi-profile switching.
- **M2 — Landing page.** FR-1…FR-5, brand-accurate and accessible.
- **M3 — Caretaker area.** PIN gate, quick-start checklist, profile editor, settings.
- **M4 — Check-in flow (scripted mode).** Full step machine working end-to-end with no key first.
- **M5 — Lane AI integration.** apiClient.ts, prompt builder, JSON contract + defensive parsing, error handling, post-visit summary call.
- **M6 — Dashboard & data.** Mood/engagement charts, flags panel, streak display, visit log with transcripts, JSON/CSV export.
- **M7 — Accessibility & polish.** WCAG pass, voice in/out, contrast/target-size audit, README, type-check + build clean, final commit.

Commit at the end of each milestone with a clear message.

## 15. Acceptance criteria, Definition of Done & test plan

### 15.1 Definition of Done

`npm run dev` runs cleanly; `tsc --noEmit` is clean; `npm run build`
succeeds and produces a static site; no backend, no shared/hardcoded key
anywhere (grep the repo to prove it); no-key mode and BYO-key mode both
complete a full visit; accessibility targets met; README complete and
friendly; git initialized with sensible history.

### 15.2 Manual test script (summary)

1. Fresh load → landing → onboarding → profile → PIN → dashboard. (FR-1…9)
2. Add family, songs, life story, a topic to avoid, a fact to reinforce. (FR-23)
3. No-key visit end to end; graceful mic/speaker degradation; save + streak. (FR-13…20, 28)
4. Valid key → Test connection → "Connected." (FR-27)
5. AI visit: never quizzes, restates exactly one gentle fact, honors theme, respects avoid-list, 1–3 sentences, always an "I'm not sure" chip. (FR-30…33, §8)
6. Post-visit summary saves with engagement 1–5, never grades memory. (FR-34, FR-29)
7. Dashboard charts, flags, streak; visit log transcripts; JSON + CSV export. (FR-24…26)
8. Edge cases: invalid key, airplane mode, non-embeddable YouTube link, malformed JSON, interrupted visit resume, second profile isolation, "forget key." (§13)
9. Billing-safety audit: search the built output for any key or server endpoint; the only network target is api.anthropic.com. (§6)

### 15.3 Deliverables

A working app and a static build; a clear friendly README (run
instructions, free key + ~$5 spend cap, why BYOK means the owner is never
billed for others, free hosting/sharing); git history; clean, commented,
well-organized code.

## 16. Recommendations & concerns (Claude's engineering notes — advice, not requirements)

- **16.1** Hand Claude Code the Markdown, not the PDF (this file is that copy).
- **16.2** Use the July 2026 model IDs in §12.4 and confirm against Anthropic's live models page at build time.
- **16.3** BYO-key security reality: a key in the browser can be read by anyone with access to that browser profile; never hardcode a key; use a dedicated workspace with a ~$5 cap; treat "forget key" as a real feature; a shared hosted version needs a backend proxy — deliberately v2.
- **16.4** Make JSON parsing bulletproof: strip fences, extract the first balanced object, and fall back to a safe scripted line rather than showing raw model text.
- **16.5** localStorage is fragile: nudge backups, ship an import counterpart to export, move to IndexedDB if media is ever added.
- **16.6** The PIN is casual deterrence, not security: hash it, offer a friendly reset, never oversell it.
- **16.7** Web Speech API varies by browser (recognition especially; needs HTTPS/localhost) — feature-detect and hide cleanly.
- **16.8** YouTube embeds can fail: validate URLs on entry, store the video id, offer a preview in the editor, and always degrade gracefully.
- **16.9** Guard the medical boundary: visible disclaimer; Lane never gives medical/medication/diagnostic advice (explicit system-prompt line).
- **16.10** Don't: add telemetry; hardcode a key; let anything grade memory; auto-advance on timers; over-collect profile data.
- **16.11** Nice extras: import/restore, printable caretaker report, "preview Lane" for caretakers, home-screen pinning note. *(All four shipped in v1.0.)*

## 17. Out of scope / future (v2+)

A shared hosted version where users don't paste their own key (needs a
small backend proxy); photo and audio reminiscence (needs IndexedDB);
multi-device sync/accounts; a formal developer-workflow write-up for the CS
portfolio; localization; and any clinical validation. None of these should
be started until v1 meets its Definition of Done.

## Appendices

**Appendix A — Themed question bank** and **Appendix B — Annotated sample
conversation** live in [RESEARCH_AND_CONVERSATION_GUIDE.md](../RESEARCH_AND_CONVERSATION_GUIDE.md).

**Appendix C — Sources.** Clinical grounding is compiled in the research
guide. Current Anthropic model IDs, browser-direct API access, and pricing
were verified against Anthropic's platform docs and pricing pages in
July 2026.

> Keepsake is a wellbeing and companionship tool, not a medical device, and
> does not provide medical advice.
