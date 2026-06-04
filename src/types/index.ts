// ─── Core data shapes for Keepsake ───────────────────────────────────────────
// All data lives in localStorage — no server, no accounts.

export interface PatientProfile {
  id: string;
  name: string;
  preferredName: string;          // what to call them day-to-day
  birthYear?: number;
  hometown?: string;
  firstHappyMemory?: string;      // a seed memory from onboarding
  familyPeople: FamilyMember[];
  favoriteMusic: YouTubeLink[];
  lifeStory: string;              // free-text life narrative
  topicsToAvoid: string[];        // e.g. "recent death of spouse"
  gentleFactsToReinforce: string[]; // spaced-retrieval statements, never quizzed
  createdAt: string;              // ISO date
  lastVisitAt?: string;
  streak: number;
  lastStreakDate?: string;        // YYYY-MM-DD — used to calculate streak
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;           // "son", "granddaughter", "best friend", …
  memory?: string;                // a happy memory involving this person
}

export interface YouTubeLink {
  id: string;
  title: string;
  url: string;
}

// ─── Visit / check-in ────────────────────────────────────────────────────────

export interface Visit {
  id: string;
  patientId: string;
  date: string;                   // ISO
  mood: number;                   // 1–5
  theme: string;                  // theme id, e.g. "childhood"
  transcript: DisplayMessage[];
  summary?: VisitSummary;
  engagement?: number;            // 1–5, from AI summary call
}

// What we show on screen and store in the transcript
export interface DisplayMessage {
  role: 'lane' | 'patient';
  content: string;
  timestamp: string;
}

// Returned by the post-visit AI summary call
export interface VisitSummary {
  summary: string;
  engagement: number;             // 1–5
  highlights: string[];
  flags: string[];
  encouragement: string;
}

// ─── App-wide settings ───────────────────────────────────────────────────────

export interface AppSettings {
  apiKey?: string;
  model: string;                  // default: claude-haiku-4-5-20251001
  readAloud: boolean;
  caretakerPin?: string;          // 4-digit string, or undefined = no PIN
}
