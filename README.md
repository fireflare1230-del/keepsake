# Keepsake 🧡

**Reconnect. Remember.**

A warm, simple AI memory companion for people living with Alzheimer's and
their caretakers — *built by a grandson, for his grandfather.*

Keepsake gives your loved one a short, pleasant daily "visit" with **Lane**,
a gentle companion who follows evidence-based dementia-care communication:
it **never quizzes, never corrects**, shares memories instead of testing
them, and celebrates *showing up* — never memory performance. A caretaker
sets up the profile and reads gentle summaries, mood trends, and flags from
a simple PIN-protected dashboard.

> Keepsake is a wellness companion, **not a medical device**, and does not
> provide medical advice.

---

## Running it

You need [Node.js](https://nodejs.org) (any recent version).

```bash
cd keepsake-app
npm install       # first time only
npm run dev       # opens at http://localhost:5173
```

To make the shareable production build:

```bash
npm run build     # type-checks, then builds the static site into dist/
```

The `dist/` folder is a plain static site — you can open `dist/index.html`
straight from the file system, or host it anywhere static files live
(GitHub Pages, Netlify, Vercel — all free). No server is ever needed.

## What's new in v1.1

- **Two-sided conversations.** Lane now responds to the exact answer that
  was tapped or typed (each answer chip carries its own warm
  acknowledgment), following the "shared experiences" exchange pattern
  from Alzheimer Society caregiver guidance and validation therapy.
- **Favorite things.** Profiles now hold sports teams, drinks, foods,
  movies and shows, and hobbies. Each visit's special moment rotates:
  a favorite song one day, a chat about their team or a favorite dish
  the next.
- **A warmer voice.** Keepsake auto-picks the most natural voice your
  device offers (on Windows, Edge's "natural" voices sound best), and
  Settings has a voice picker with a sample button.
- **Optional account.** Caretakers can create a free account
  (Settings → Keepsake account) to keep a private cloud backup of
  profiles and visits and restore them on any device. The app works
  fully without one; the AI key and PIN never leave the device.
- **A calmer look.** New fonts (Fraunces headings, Atkinson Hyperlegible
  body, designed for low-vision readers) and a shorter landing page.

## The two modes

| | |
|---|---|
| **No-key mode (free)** | Works immediately, fully offline. Lane speaks from a built-in playbook of themed, research-based conversation starters. Every feature works — visits, music, streaks, summaries. |
| **AI mode (your own key)** | Paste your Anthropic API key in **Settings** and Lane holds a natural, personal conversation built around the profile you created. |

### Getting an API key (and why you'll never be surprised by a bill)

1. Create an account at **console.anthropic.com**.
2. Make a **dedicated workspace** for Keepsake and set a **monthly spend cap
   of about $5** — that's the safety net.
3. Create an API key in that workspace and paste it into Keepsake's
   Settings → **Test connection** should say "Connected."

A daily visit on the default model (Haiku) costs **a fraction of a cent to a
few cents** — roughly $1–2/month of everyday use.

### Why sharing Keepsake never bills *you*

There is **no server and no shared key**. Each person who uses Keepsake
supplies their *own* key (or uses the free no-key mode), and that key is
stored only in *their* browser and sent only to Anthropic. You can host the
built site publicly and hand the link to anyone — their usage goes on their
key, never yours. There is deliberately no key anywhere in this code.

## Privacy

Everything — profiles, visits, transcripts, settings — lives in the
browser's local storage on your own device. Nothing is transmitted anywhere
except the direct AI calls to Anthropic (only in AI mode). No accounts, no
analytics, no tracking.

**Do back up:** browsers occasionally clear local storage. Settings → *Your
data* → **Download backup** saves everything to a file; **Restore from
backup** brings it back. Backups never include your API key.

## Using it day to day

1. **Caretaker**: open Keepsake → *Start today's visit* → hand the tablet over.
2. **Your loved one**: taps through a calm visit — hello, how they feel, a
   themed chat with Lane, a favorite song, a reminder of someone who loves
   them, and a little celebration.
3. **Caretaker, later**: open the caretaker area (PIN) to read the summary,
   watch mood/engagement trends, and check gentle flags. One tap prints a
   report for family or the doctor.

**Tip — pin it to the tablet's home screen:** in Chrome/Edge on a tablet,
open Keepsake → browser menu → **Add to Home screen** (or "Install app").
It then launches full-screen with one tap, like a real app.

## For the curious: how the safety works

- **Conversation rules** ("the seven golden rules") are hard-coded into
  Lane's system prompt *and* enforced structurally: Lane replies as strict
  JSON rendered as big tap-able answer chips, so there's never a blank box
  to fail at. See [RESEARCH_AND_CONVERSATION_GUIDE.md](RESEARCH_AND_CONVERSATION_GUIDE.md).
- **If anything goes wrong** — no key, bad key, no internet, malformed AI
  reply — the visit continues seamlessly from the built-in playbook. A
  visit can never crash or show raw AI output.
- **The streak** counts days a visit happened. Nothing in Keepsake ever
  scores whether something was remembered "correctly."

## Project structure

```
keepsake-app/
  src/
    routes/            landing, onboarding, the visit (CheckIn), caretaker/*
    features/lane/     prompt builder, API client, JSON parser, conversation engine
    components/        buttons, chips, mood picker, music embed, charts…
    lib/               storage, PIN, speech, YouTube, exporters, dates
    data/themes.ts     the 10 rotating themes + scripted playbook
  docs/KEEPSAKE_PRD.md the full product requirements document
  RESEARCH_AND_CONVERSATION_GUIDE.md   the clinical evidence base
```

Built with Vite + React + TypeScript + Tailwind CSS. All state in
localStorage. `npm run typecheck` and `npm run build` should always pass.
