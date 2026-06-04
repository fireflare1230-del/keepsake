# Keepsake — Reconnect. Remember.

> "Built by a grandson, for his grandfather."

A warm, calm AI memory companion for people living with Alzheimer's and their caretakers.
Keepsake uses evidence-based conversation techniques to spark joy, gentle reminiscence, and
connection — one visit at a time.

---

## Running the app locally

```bash
# 1. Install dependencies (one-time)
npm install

# 2. Start the development server
npm run dev

# 3. Open http://localhost:5173 in your browser
```

To build a production-ready static site:
```bash
npm run build
# Files land in dist/ — open dist/index.html directly, or host the folder anywhere.
```

---

## Getting an Anthropic API key (optional)

Keepsake works fully **for free** with warm scripted conversations — no key needed.

If you'd like Lane to have **personalised AI-powered conversations**, add your own key:

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up (free — you only pay for usage)
3. Go to **Settings → API Keys** and create a new key
4. **Immediately set a spend limit:**
   - Go to **Settings → Limits**
   - Set a **monthly spend limit of $5** (or whatever you're comfortable with)
   - At typical Haiku 4.5 rates a daily 5-minute visit costs roughly **$0.001–$0.003**
5. Paste the key into Keepsake → Caretaker Area → Settings

---

## The Bring-Your-Own-Key model — why you're never billed for others

Keepsake has **no backend server and no shared API key**.

- When you share the app (as a file or a hosted URL), each person who uses it must
  supply **their own** Anthropic key in their own browser settings.
- Your key is stored **only in the localStorage of your own browser** — it never
  leaves your device except in direct API calls from your browser to Anthropic.
- If someone else opens the app without adding a key, they simply get the free
  scripted mode — no cost to you whatsoever.

This means **you can host Keepsake publicly on GitHub Pages / Netlify / Vercel**
and you will only ever be billed for your own usage.

---

## Sharing the app

### Option A — Local file (simplest)

Run `npm run build`, then share the `dist/` folder (zip it up).
Anyone can unzip it and open `dist/index.html` in any browser — no install needed.

### Option B — Host free on Netlify

1. Run `npm run build`
2. Drag the `dist/` folder onto [netlify.com/drop](https://app.netlify.com/drop)
3. Done! You get a free URL like `https://keepsake-abc123.netlify.app`

### Option C — GitHub Pages

```bash
# In vite.config.ts, set:  base: '/your-repo-name/'
npm run build
# Then push dist/ to the gh-pages branch of your repo
```

---

## Evidence-based design

Every conversation Lane has follows these clinically validated principles:

| Principle | What Lane does |
|---|---|
| **Validation therapy** | Never corrects — always responds to the feeling |
| **No memory testing** | Never asks "Do you remember?" — states warmly and invites |
| **Errorless learning** | Celebrates any response; if they can't recall, Lane shares it herself |
| **Early-life memory bias** | Focuses on childhood/young-adult memories, better preserved in Alzheimer's |
| **Sensory anchoring** | Uses sights, smells, tastes to deepen engagement |
| **Easy choices** | Yes/no and either/or options — never open-ended free recall |
| **Spaced retrieval** | Warmly states one "gentle fact" per visit — never quizzes |
| **Shame-free streaks** | Streak rewards showing up, never whether they remembered |

---

## Tech stack

- **Vite + React 18 + TypeScript** — modern, fast, type-safe
- **Tailwind CSS** — utility-first styling, custom brand palette
- **React Router 6** (HashRouter) — works as a local file and on any static host
- **Recharts** — mood and engagement trend charts
- **Web Speech API** — mic input and read-aloud (browser-native, no third-party)
- **Anthropic Messages API** — called directly from the browser with `anthropic-dangerous-direct-browser-access: true`
- **localStorage only** — zero backend, zero database, zero accounts

---

## Disclaimer

**Keepsake is a wellness companion, not a medical device.**
It is not intended to diagnose, treat, cure, or prevent any medical condition.
Always consult qualified healthcare providers regarding Alzheimer's care and treatment.
