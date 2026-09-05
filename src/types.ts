export interface JournalMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export type SentimentType =
  | 'Energized'
  | 'Accomplished'
  | 'Reflective'
  | 'Calm'
  | 'Neutral'
  | 'Anxious'
  | 'Fatigued'
  | 'Overwhelmed';

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  tags?: string[];
  messages: JournalMessage[];
  moodScore?: number; // 0-100
  focusScore?: number; // 0-100
  sentiment?: SentimentType | string;
  emotionalKeywords?: string[];
  productivityTips?: string[];
}

export interface DayMetricPoint {
  date: string;
  title: string;
  mood: number;
  focus: number;
  sentiment: string;
}

export interface IntelligenceReport {
  averageMood: number;
  averageFocus: number;
  dominantSentiment: string;
  totalAnalyzed: number;
  emotionalTrends: DayMetricPoint[];
  actionableInsights: string[];
  suggestedMicroHabits: string[];
  keyStrengths: string[];
  riskSignals: string[];
  weeklySynthesis: string;
  generatedAt: string;
  modelUsed?: string;
}

export type ReflectionMode = 'reflection' | 'brainstorm' | 'summary';

export type ThemeMode = 'light' | 'dark';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

