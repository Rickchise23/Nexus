// ─── NEXUS CORE TYPES ───

export type NexusMode = "morning" | "focus" | "home" | "evening" | "weekend" | "night";

export interface ModeConfig {
  label: string;
  icon: string;
  color: string;
  hours: [number, number]; // start, end (24h)
  weekendOverride?: boolean;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  icon: string;
  high: number;
  low: number;
  humidity: number;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  end: string;
  type: "work" | "ralli" | "personal" | "health";
  allDay: boolean;
}

export interface Signal {
  id: string;
  source: string; // "Ralli AI" | "Toscana" | "Launch Pad" | "Portfolio"
  text: string;
  type: "lead" | "booking" | "product" | "finance" | "alert" | "deploy" | "agent";
  time: string; // ISO
  read: boolean;
}

export interface ContentItem {
  id: string;
  url: string;
  title: string;
  source: string; // "YouTube" | "Podcast" | "Article"
  type: "video" | "podcast" | "article";
  duration: string;
  thumbnail?: string;
  tags: string[];
  status: "queued" | "in_progress" | "done";
  progress: number; // 0-100
  savedBy: string;
  savedAt: string; // ISO
  modeAffinity?: NexusMode;
}

export interface Goal {
  id: string;
  label: string;
  done: boolean;
  date: string; // YYYY-MM-DD
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  updatedAt: string;
}

export interface NexusState {
  mode: NexusMode;
  modeOverride: NexusMode | null;
  weather: WeatherData | null;
  calendar: CalendarEvent[];
  signals: Signal[];
  content: ContentItem[];
  goals: Goal[];
  stocks: StockQuote[];
  user: string;
}

// WebSocket message types
export type WSMessage =
  | { type: "mode_switch"; mode: NexusMode }
  | { type: "mode_auto" }
  | { type: "content_drop"; url: string; title?: string }
  | { type: "content_play"; id: string }
  | { type: "content_progress"; id: string; progress: number }
  | { type: "content_toggle" }
  | { type: "goal_toggle"; id: string }
  | { type: "goal_add"; label: string }
  | { type: "signal_dismiss"; id: string }
  | { type: "signal_next" }
  | { type: "refresh" }
  | { type: "view_toggle"; view: "pulse" | "dashboard" }
  | { type: "state_update"; state: Partial<NexusState> }
  | { type: "connected"; timestamp: string }
  | { type: "deploy_result"; ok: boolean; message?: string }
  | { type: "agent_reply"; preview?: string };
