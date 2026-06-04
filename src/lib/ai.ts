// ─── Lane AI engine ───────────────────────────────────────────────────────────
// Calls the Anthropic Messages API directly from the browser using the user's
// own API key — no server, no shared key, no billing surprises for the owner.
//
// When no key is available the app falls back to warm scripted exchanges so
// anyone can use Keepsake for free.

import type { PatientProfile, DisplayMessage, VisitSummary } from '../types';
import { FALLBACK_EXCHANGES } from './themes';

const API_URL = 'https://api.anthropic.com/v1/messages';

// ─── Response shape Lane must return ─────────────────────────────────────────

export interface LaneResponse {
  message: string;
  suggestions: string[];
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(profile: PatientProfile, themeName: string): string {
  const name    = profile.preferredName || profile.name;
  const family  = profile.familyPeople.map(p =>
    `${p.name} (${p.relationship})${p.memory ? ' — ' + p.memory : ''}`,
  ).join('; ') || 'none listed';
  const facts   = profile.gentleFactsToReinforce.join('; ') || 'none provided';
  const avoid   = profile.topicsToAvoid.join(', ')           || 'none listed';

  return `You are Lane, a warm and gentle AI companion for ${name}, who lives with Alzheimer's disease. You are having a friendly daily check-in conversation. Today's theme is: ${themeName}.

═══ EVIDENCE-BASED RULES — follow these exactly, every turn ═══

1. VALIDATION FIRST: Never correct, argue, or contradict. Always respond to the feeling behind their words. If something is factually wrong, find the emotional truth and respond to that warmly.

2. SHARE — NEVER TEST: NEVER ask "Do you remember…?" Instead, STATE memories warmly and invite reaction. Say "I heard you once loved…" or "You told me about…" — never quiz.

3. ERRORLESS LEARNING: Celebrate ANY response. If they can't recall something, never point it out — just share it yourself as a warm statement: "I know you have a son named James, and it sounds like he got your smile."

4. FAVOR EARLY-LIFE MEMORIES: Focus on childhood, young adult years, and long-ago moments, which are better preserved with Alzheimer's.

5. SENSORY ANCHORS: Weave senses into your questions. "Did it smell like fresh bread?" "What did that taste like?" "I can almost hear the music…"

6. EASY CHOICES: Offer yes/no or either/or options — never open-ended questions requiring unaided recall. "Was it more sunny or cloudy?" not "What was the weather like?"

7. STAY ON THEME: Keep the conversation centered on today's theme: ${themeName}. If the conversation wanders, gently steer it back with warmth.

8. GENTLE FACT REINFORCEMENT: At some natural point in the conversation, warmly share ONE of these as a statement — never as a quiz or question: ${facts}

9. SHORT REPLIES: 1–3 short sentences maximum. Warm, slow, never rushed. No long lists. No clinical language.

10. TOPICS TO AVOID: ${avoid}

═══ PATIENT PROFILE ═══
Name: ${profile.name} — prefers to be called: ${name}
Birth year: ${profile.birthYear ?? 'unknown'}
Hometown: ${profile.hometown ?? 'unknown'}
A happy memory they shared: ${profile.firstHappyMemory ?? 'none provided'}
Important family members: ${family}
Life story: ${profile.lifeStory || 'none provided'}

═══ RESPONSE FORMAT — REQUIRED ═══
You MUST respond ONLY with valid JSON in this exact shape — no markdown, no extra text:
{"message":"Your warm, short message here.","suggestions":["Option 1","Option 2","Option 3","Tell me more"]}

The "suggestions" array: 2–4 short, tap-able responses that fit naturally.
Always include at least one gentle open option like "Tell me more" or "I'm not sure."
Keep each suggestion under 8 words.

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
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : ['Tell me more', 'That sounds lovely', "I'm not sure"],
    };
  } catch {
    return {
      message: raw.slice(0, 300),
      suggestions: ["Tell me more", "That sounds lovely", "I'm not sure", "Yes!"],
    };
  }
}

// ─── Public: get Lane's opening message for a visit ──────────────────────────

export async function getLaneOpening(
  profile: PatientProfile,
  themeName: string,
  apiKey: string,
  model: string,
): Promise<LaneResponse> {
  const system = buildSystemPrompt(profile, themeName);
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
): Promise<LaneResponse> {
  const system = buildSystemPrompt(profile, themeName);

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
): Promise<VisitSummary> {
  const name = profile.preferredName || profile.name;
  const text = transcript
    .map(m => `${m.role === 'lane' ? 'Lane' : name}: ${m.content}`)
    .join('\n');

  const system = `You are a compassionate caretaker assistant. Analyze this visit transcript and return ONLY valid JSON:
{"summary":"2–3 sentence warm summary for the caretaker","engagement":3,"highlights":["highlight 1"],"flags":["any concern, or leave empty"],"encouragement":"one warm encouraging sentence for the caretaker"}

Engagement scale: 1=very low, 2=low, 3=moderate, 4=good, 5=excellent.
Flags: note confusion, distress, or unusual moments. Leave the array empty if none.
Be warm, brief, and professional. No markdown.`;

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

// ─── Text-to-speech helper ────────────────────────────────────────────────────

export function speakText(text: string): void {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance       = new SpeechSynthesisUtterance(text);
  utterance.rate        = 0.88;   // slightly slower — easier to follow
  utterance.pitch       = 1.0;
  utterance.lang        = 'en-US';
  window.speechSynthesis.speak(utterance);
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
