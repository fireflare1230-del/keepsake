// ─── Lane AI engine ───────────────────────────────────────────────────────────
// Calls the Anthropic Messages API directly from the browser using the user's
// own API key — no server, no shared key, no billing surprises for the owner.
//
// When no key is available the app falls back to warm scripted exchanges so
// anyone can use Keepsake for free.

import type { PatientProfile, DisplayMessage, VisitSummary, SRTTarget } from '../types';
import { FALLBACK_EXCHANGES } from './themes';
import { getSettings } from './storage';

const API_URL = 'https://api.anthropic.com/v1/messages';

// ─── Response shape Lane must return ─────────────────────────────────────────

export interface LaneResponse {
  message: string;
  suggestions: string[];
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(
  profile: PatientProfile,
  themeName: string,
  srtTarget?: SRTTarget | null,
): string {
  const name    = profile.preferredName || profile.name;
  const family  = profile.familyPeople.map(p =>
    `${p.name} (${p.relationship})${p.memory ? ' — ' + p.memory : ''}`,
  ).join('; ') || 'none listed';
  const facts   = profile.gentleFactsToReinforce.join('; ') || 'none provided';
  const avoid   = profile.topicsToAvoid.join(', ')           || 'none listed';

  const srtSection = srtTarget ? `

═══ SRT INSTRUCTION FOR THIS VISIT ═══
Target: "${srtTarget.prompt}" → correct answer: "${srtTarget.answer}"

- Weave ONE confirmation-style ask of this early in the visit, stated warmly and inviting agreement — NOT a cold quiz. Example: "I just want to make sure I've got this right — ${srtTarget.answer} is ${srtTarget.prompt}, isn't it?"
- Later in the SAME visit, after other conversation has happened, ask once more in open form: "Earlier we were talking — can you remind me of ${srtTarget.prompt}?"
- If correct: celebrate genuinely like an adult achievement, not a child's. Move on naturally.
- If incorrect or unsure: immediately and warmly supply the answer. Ask them to repeat it once, then move on. NEVER say "no" or "that's wrong." Frame it as "That's alright — it's ${srtTarget.answer}. ${srtTarget.answer}. Can you say that with me?"
- This is the ONLY closed-recall question this visit. Every other question must stay open-ended with no wrong answer.

When generating your post-visit summary, note whether this target was: 'correct' (recalled without prompting), 'prompted' (answer needed to be supplied), or 'not-tested'.` : '';

  return `You are Lane, a warm and gentle AI companion for ${name}, who lives with Alzheimer's disease. You are having a friendly daily check-in conversation. Today's theme is: ${themeName}.

═══ EVIDENCE-BASED RULES — follow these exactly, every turn ═══

1. VALIDATION FIRST: Never correct, argue, or contradict. Always respond to the feeling behind their words. If something is factually wrong, find the emotional truth and respond to that warmly.

2. SHARE — NEVER TEST: NEVER ask "Do you remember…?" Instead, STATE memories warmly and invite reaction. Say "I heard you once loved…" or "You told me about…" — never quiz.

3. ERRORLESS LEARNING: Celebrate ANY response. If they can't recall something, never point it out — just share it yourself as a warm statement: "I know you have a son named James, and it sounds like he got your smile."

4. FAVOR EARLY-LIFE MEMORIES: Focus on childhood, young adult years, and long-ago moments, which are better preserved with Alzheimer's.

5. SENSORY ANCHORS: For reminiscence questions, anchor in sensation and feeling — "what did it smell like?", "how did that make you feel?" — rather than bare fact-recall questions like "where did you grow up?" which risk embarrassment if the patient draws a blank.

6. EASY CHOICES: Offer yes/no or either/or options — never open-ended questions requiring unaided recall. "Was it more sunny or cloudy?" not "What was the weather like?"

7. STAY ON THEME: Keep the conversation centered on today's theme: ${themeName}. If the conversation wanders, gently steer it back with warmth.

8. GENTLE FACT REINFORCEMENT: At some natural point in the conversation, warmly share ONE of these as a statement — never as a quiz or question: ${facts}

9. SHORT REPLIES: 1–3 short sentences maximum. Warm, slow, never rushed. No long lists. No clinical language.

10. TOPICS TO AVOID: ${avoid}
${srtSection}
═══ PATIENT PROFILE ═══
Name: ${profile.name} — prefers to be called: ${name}
Birth year: ${profile.birthYear ?? 'unknown'}
Hometown: ${profile.hometown ?? 'unknown'}
A happy memory they shared: ${profile.firstHappyMemory ?? 'none provided'}
Important family members: ${family}
Life story: ${profile.lifeStory || 'none provided'}

═══ RESPONSE FORMAT — REQUIRED ═══
You MUST respond ONLY with valid JSON in this exact shape — no markdown, no extra text:
{"message":"Your warm, short message here.","suggestions":["Option A","Option B","Option C","Could you say that again?"]}

The "suggestions" array — this is critically important:
- Write 3–4 SHORT phrases the PATIENT would naturally say in response to YOUR message.
- Each suggestion must be a DIRECT REACTION to what you just said — not a generic filler phrase.
- Match the emotion and topic: if you asked about a garden, suggestions might be "I loved the roses", "It was very peaceful", "We grew tomatoes too", "Say that again?"
- NEVER include generic phrases like "Tell me more", "That sounds lovely", "I'm not sure", or "Yes!" — these are meaningless to the patient.
- Always include ONE option for when they didn't follow — e.g. "Could you say that again?", "I didn't quite catch that", or "Can you rephrase that?"
- Keep every suggestion under 8 words. Write them as if the patient is speaking.

Remember: you are a companion, not a therapist. Be joyful, patient, and deeply human.`;
}

// ─── Direct Anthropic API call ────────────────────────────────────────────────

async function callAnthropic(
  messages: { role: 'user' | 'assistant'; content: string }[],
  system: string,
  apiKey: string,
  model: string,
  maxTokens = 512,
): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
      // Required for direct browser access — no server relay
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Anthropic API ${res.status}: ${body}`);
  }

  const data = await res.json() as { content: { text: string }[] };
  return data.content[0]?.text ?? '';
}

// ─── Parse Lane's JSON response safely ───────────────────────────────────────

function parseLaneResponse(raw: string): LaneResponse {
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned) as { message?: string; suggestions?: string[] };
    return {
      message: parsed.message ?? raw.slice(0, 300),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : ['Yes, I remember that', 'Could you say that again?', "I think so", "That's nice"],
    };
  } catch {
    return {
      message: raw.slice(0, 300),
      suggestions: ['Yes, that sounds right', "Could you rephrase that?", "I'm not sure", "Please continue"],
    };
  }
}

// ─── Public: get Lane's opening message for a visit ──────────────────────────

export async function getLaneOpening(
  profile: PatientProfile,
  themeName: string,
  apiKey: string,
  model: string,
  srtTarget?: SRTTarget | null,
): Promise<LaneResponse> {
  const system = buildSystemPrompt(profile, themeName, srtTarget);
  // Anthropic API requires messages to start with 'user'; we use a gentle kick-off
  const raw = await callAnthropic(
    [{ role: 'user', content: 'Please begin our visit with your themed opening message.' }],
    system,
    apiKey,
    model,
  );
  return parseLaneResponse(raw);
}

// ─── Public: continue the conversation ───────────────────────────────────────
// transcript is the display-format history; we convert for the API.
// The API messages array must start with 'user', so Lane's opening is captured
// in the system prompt — the first item in our API array is always the patient's
// first real response.

export async function getLaneReply(
  transcript: DisplayMessage[],
  profile: PatientProfile,
  themeName: string,
  apiKey: string,
  model: string,
  srtTarget?: SRTTarget | null,
): Promise<LaneResponse> {
  const system = buildSystemPrompt(profile, themeName, srtTarget);

  // Build alternating messages starting from the FIRST patient message
  const apiMessages: { role: 'user' | 'assistant'; content: string }[] = [];
  let expectUser = true;

  for (const msg of transcript) {
    const isPatient = msg.role === 'patient';
    if (expectUser && isPatient) {
      apiMessages.push({ role: 'user', content: msg.content });
      expectUser = false;
    } else if (!expectUser && msg.role === 'lane') {
      apiMessages.push({ role: 'assistant', content: msg.content });
      expectUser = true;
    }
  }

  // If last message was from Lane, add a nudge so the array ends on 'user'
  if (!expectUser) {
    apiMessages.push({ role: 'user', content: 'Please continue.' });
  }

  if (apiMessages.length === 0) {
    apiMessages.push({ role: 'user', content: 'Please begin.' });
  }

  const raw = await callAnthropic(apiMessages, system, apiKey, model);
  return parseLaneResponse(raw);
}

// ─── Public: post-visit caretaker summary ────────────────────────────────────

export async function generateVisitSummary(
  transcript: DisplayMessage[],
  profile: PatientProfile,
  apiKey: string,
  model: string,
  srtTarget?: SRTTarget | null,
): Promise<VisitSummary> {
  const name = profile.preferredName || profile.name;
  const text = transcript
    .map(m => `${m.role === 'lane' ? 'Lane' : name}: ${m.content}`)
    .join('\n');

  const srtInstruction = srtTarget
    ? `\nAlso, an SRT memory target was being practiced this visit: prompt="${srtTarget.prompt}", answer="${srtTarget.answer}". Classify the result as "srtResult": one of "correct" (patient recalled without prompting), "prompted" (answer had to be supplied), or "not-tested" (never came up). Include this field in your JSON.`
    : '';

  const system = `You are a compassionate caretaker assistant. Analyze this visit transcript and return ONLY valid JSON:
{"summary":"2–3 sentence warm summary for the caretaker","engagement":3,"highlights":["highlight 1"],"flags":["any concern, or leave empty"],"encouragement":"one warm encouraging sentence for the caretaker","srtResult":"not-tested"}

Engagement scale: 1=very low, 2=low, 3=moderate, 4=good, 5=excellent.
Flags: note confusion, distress, or unusual moments. Leave the array empty if none.
Be warm, brief, and professional. No markdown.${srtInstruction}`;

  try {
    const raw = await callAnthropic(
      [{ role: 'user', content: `Analyze this visit transcript:\n\n${text}` }],
      system,
      apiKey,
      model,
      1024,
    );
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned) as VisitSummary;
    return parsed;
  } catch {
    return {
      summary: 'Visit completed successfully.',
      engagement: 3,
      highlights: [],
      flags: [],
      encouragement: 'You are doing a wonderful job caring for your loved one.',
      srtResult: 'not-tested',
    };
  }
}

// ─── Scripted fallback (no API key) ──────────────────────────────────────────

export function getFallbackResponse(themeId: string, turnIndex: number): LaneResponse {
  const exchanges = FALLBACK_EXCHANGES[themeId] ?? FALLBACK_EXCHANGES['childhood'];
  return exchanges[turnIndex % exchanges.length];
}

// ─── Greeting (always scripted — fast, no API cost) ──────────────────────────

export function buildGreeting(profile: PatientProfile): LaneResponse {
  const name    = profile.preferredName || profile.name;
  const hour    = new Date().getHours();
  const part    = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const messages = [
    `Good ${part}, ${name}! It's so wonderful to see you today. I'm Lane, and I'm here to spend some lovely time with you.`,
    `Hello, ${name}! What a beautiful ${part} for a visit. I'm Lane, and I've been looking forward to our time together today.`,
    `${name}! I'm so glad you're here. I'm Lane, your companion, and this ${part} is going to be a lovely one.`,
  ];

  const idx = new Date().getDay() % messages.length;
  return {
    message: messages[idx],
    suggestions: ["Hello, Lane!", "I'm happy to be here", "Let's begin", "Good to see you too!"],
  };
}

// ─── Voice selection ──────────────────────────────────────────────────────────
// Browsers load voices asynchronously. We cache the best match and refresh when
// the voice list changes or when the gender preference changes in settings.

let _voiceCache: SpeechSynthesisVoice | null = null;
let _voicePrefMale: boolean | null = null;

const QUALITY_TERMS  = ['neural', 'natural', 'enhanced', 'premium', 'google'];
const MALE_TERMS     = ['guy', 'david', 'mark', 'james', 'fred', 'daniel', 'ryan', 'eric', 'aaron', 'tom'];
const FEMALE_TERMS   = ['samantha', 'victoria', 'karen', 'kate', 'lisa', 'zira', 'eva', 'susan', 'alex', 'siri'];

function scoreVoice(v: SpeechSynthesisVoice, preferMale: boolean): number {
  const n = v.name.toLowerCase();
  let s = 0;
  if (QUALITY_TERMS.some(t => n.includes(t))) s += 10;
  if (preferMale  && MALE_TERMS.some(t => n.includes(t)))   s += 5;
  if (!preferMale && FEMALE_TERMS.some(t => n.includes(t))) s += 5;
  if (v.lang === 'en-US') s += 2;
  return s;
}

function pickVoice(preferMale: boolean): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  if (voices.length === 0) return null;
  const enUS = voices.filter(v => v.lang === 'en-US');
  const en   = voices.filter(v => v.lang.startsWith('en'));
  const pool = enUS.length > 0 ? enUS : (en.length > 0 ? en : voices);
  return [...pool].sort((a, b) => scoreVoice(b, preferMale) - scoreVoice(a, preferMale))[0];
}

export function initVoice(): void {
  if (!window.speechSynthesis) return;
  const { voicePreferMale } = getSettings();
  const preferMale = voicePreferMale !== false;

  const load = () => {
    const v = pickVoice(preferMale);
    if (v) { _voiceCache = v; _voicePrefMale = preferMale; }
  };
  load();
  window.speechSynthesis.addEventListener('voiceschanged', load);
}

export function getSelectedVoiceName(): string {
  if (!_voiceCache) return 'Default system voice';
  return `${_voiceCache.name} (${_voiceCache.lang})`;
}

// ─── Text-to-speech helper ────────────────────────────────────────────────────
// Splits text on sentence boundaries and queues utterances with a brief pause
// between them so sentences don't blur together.

function speakSentences(
  sentences: string[],
  voice: SpeechSynthesisVoice | null,
  rate: number,
  idx: number,
): void {
  if (idx >= sentences.length) return;
  const u = new SpeechSynthesisUtterance(sentences[idx]);
  u.rate  = rate;
  u.pitch = 0.95;
  u.lang  = 'en-US';
  if (voice) u.voice = voice;
  u.onend = () => setTimeout(() => speakSentences(sentences, voice, rate, idx + 1), 150);
  window.speechSynthesis.speak(u);
}

export function speakText(text: string): void {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const settings   = getSettings();
  const preferMale = settings.voicePreferMale !== false;
  const rate       = settings.voiceRate ?? 0.85;

  // Refresh cache if gender preference changed
  if (_voicePrefMale !== preferMale) {
    const v = pickVoice(preferMale);
    if (v) { _voiceCache = v; _voicePrefMale = preferMale; }
  } else if (!_voiceCache) {
    const v = pickVoice(preferMale);
    if (v) { _voiceCache = v; _voicePrefMale = preferMale; }
  }

  // Split on sentence boundaries safely (no lookbehind needed)
  const sentences = text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  speakSentences(sentences, _voiceCache, rate, 0);
}

export function stopSpeaking(): void {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

// ─── YouTube embed helper ─────────────────────────────────────────────────────

export function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}
