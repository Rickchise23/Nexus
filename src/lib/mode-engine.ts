import type { NexusMode, ModeConfig } from '@/types/nexus';

export const modes: Record<NexusMode, ModeConfig> = {
  morning: { label: "Morning", icon: "☀️", color: "#f59e0b", hours: [5, 9] },
  focus:   { label: "Focus",   icon: "🎯", color: "#06b6d4", hours: [9, 17] },
  home:    { label: "Home",    icon: "🏠", color: "#10b981", hours: [17, 20] },
  evening: { label: "Evening", icon: "🌅", color: "#8b5cf6", hours: [20, 23] },
  weekend: { label: "Weekend", icon: "🏈", color: "#f59e0b", hours: [9, 20], weekendOverride: true },
  night:   { label: "Night",   icon: "🌙", color: "#6366f1", hours: [23, 5] },
};

export function determineMode(override?: NexusMode | null): NexusMode {
  if (override) return override;

  const now = new Date();
  const h = now.getHours();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;

  // Weekend override for daytime
  if (isWeekend && h >= 9 && h < 20) return "weekend";

  if (h >= 5 && h < 9) return "morning";
  if (h >= 9 && h < 17) return "focus";
  if (h >= 17 && h < 20) return "home";
  if (h >= 20 && h < 23) return "evening";
  return "night";
}

export function getGreeting(h: number): string {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}
