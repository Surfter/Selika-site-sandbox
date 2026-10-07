import { create } from "zustand";

export type LightId = "selika" | "daylight" | "office" | "restaurant" | "evening";
export type LookId = "natural" | "office" | "evening" | "bold";
export type Region = "brows" | "eyes" | "cheeks" | "lips" | "nose" | "skin" | null;

export const LIGHTS: { id: LightId; name: string; k: number; cri: string; note: string; intensity: number }[] = [
  { id: "selika", name: "Selika", k: 5000, cri: "95+", note: "The mirror's own high-CRI light: the reference for choosing colour.", intensity: 1.0 },
  { id: "daylight", name: "Daylight", k: 6500, cri: "~100", note: "Cool and bright. How a look reads by a window at midday.", intensity: 1.1 },
  { id: "office", name: "Office", k: 4000, cri: "~82", note: "Flat overhead panels. Warm tones go a little grey.", intensity: 0.9 },
  { id: "restaurant", name: "Restaurant", k: 3000, cri: "~90", note: "Warm and low. Reds deepen, blush reads stronger.", intensity: 0.7 },
  { id: "evening", name: "Evening", k: 2700, cri: "~90", note: "The warm end of the range. Check the look holds up.", intensity: 0.6 },
];

export const LOOKS: { id: LookId; name: string; lip: string; lipA: number; blush: string; blushA: number; liner: number; wing: number; shadow: string; shadowA: number; brow: number }[] = [
  { id: "natural", name: "Natural", lip: "#c47d7a", lipA: 0.42, blush: "#e58f86", blushA: 0.22, liner: 0.6, wing: 0.2, shadow: "#a88a7a", shadowA: 0.18, brow: 0.55 },
  { id: "office", name: "Office", lip: "#a65a62", lipA: 0.6, blush: "#d9867f", blushA: 0.26, liner: 0.8, wing: 0.45, shadow: "#8c7468", shadowA: 0.3, brow: 0.7 },
  { id: "evening", name: "Evening", lip: "#8c2a3d", lipA: 0.8, blush: "#c96f7e", blushA: 0.3, liner: 1, wing: 1, shadow: "#6b3f6e", shadowA: 0.5, brow: 0.8 },
  { id: "bold", name: "Bold", lip: "#a8264c", lipA: 0.74, blush: "#d8708c", blushA: 0.28, liner: 1.1, wing: 1.15, shadow: "#5b4699", shadowA: 0.42, brow: 0.85 },
];

export const TONES = ["#f2d6c6", "#e3b89f", "#c78f6f", "#9a6446", "#613d29"];

export const STEPS: { id: string; name: string; region: Region; line: string; voice: string }[] = [
  { id: "prep", name: "Prep", region: "skin", line: "Selika maps your face and sets the light to 5000K, so colour is chosen in light you can trust.", voice: "Ready when you are." },
  { id: "brows", name: "Brows", region: "brows", line: "Follow the three guides: start above the nose, arch through the centre of your eye, tail at the outer corner.", voice: "Brows first. Follow the arch." },
  { id: "eyes", name: "Eyes", region: "eyes", line: "Trace the liner along the lash line, then flick it out along the wing guide.", voice: "Liner next. Flick out at the end." },
  { id: "cheeks", name: "Cheeks", region: "cheeks", line: "Blush lands on the highlighted zone, blended up toward the temple.", voice: "Blush on the glowing zone." },
  { id: "lips", name: "Lips", region: "lips", line: "Line the lips along the guide, then fill in.", voice: "Lips last. Line, then fill." },
  { id: "done", name: "Done", region: null, line: "Look complete. Check it under office, restaurant and evening light before you leave.", voice: "Done. Want to see it in evening light?" },
];

export type ModuleId = "clock" | "weather" | "calendar" | "build" | "agent" | "home";
export type Perm = "camera" | "mic" | "calendar" | "network";
export const MODULES: { id: ModuleId; name: string; needs: Perm[]; icon: string }[] = [
  { id: "clock", name: "Clock", needs: [], icon: "Clock" },
  { id: "weather", name: "Weather", needs: ["network"], icon: "CloudSun" },
  { id: "calendar", name: "Calendar", needs: ["calendar"], icon: "Calendar" },
  { id: "build", name: "Build status", needs: ["network"], icon: "GitBranch" },
  { id: "agent", name: "Agent brief", needs: ["calendar", "mic", "network"], icon: "Bot" },
  { id: "home", name: "Home", needs: ["network"], icon: "House" },
];
export type ModelId = "device" | "endpoint" | "agent";

type DemoState = {
  step: number;
  look: LookId;
  light: LightId;
  tone: number;
  /** which photographic face (when packs exist) */
  face: number;
  hover: Region;
  smile: number; // increments to trigger a smile
  reply: { text: string; id: number } | null;
  // dev
  on: Record<ModuleId, boolean>;
  perms: Record<ModuleId, Record<Perm, boolean>>;
  selected: ModuleId;
  model: ModelId;
  pos: Record<ModuleId, { x: number; y: number }>;
  /** has the visitor dragged a module yet (hides the hint) */
  moved: boolean;
  set: (p: Partial<DemoState>) => void;
  say: (text: string) => void;
};

const narrowScreen = typeof window !== "undefined" && window.innerWidth < 640;
const allowAll = (needs: Perm[]) => ({ camera: false, mic: needs.includes("mic"), calendar: needs.includes("calendar"), network: needs.includes("network") });

export const useDemo = create<DemoState>((set) => ({
  step: 0, look: "office", light: "selika", tone: 1, face: 2, hover: null, smile: 0, reply: null, moved: false,
  // a phone's mirror is small: it starts with four modules (the others are a tap away)
  on: { clock: true, weather: true, calendar: true, build: !narrowScreen, agent: true, home: !narrowScreen },
  perms: Object.fromEntries(MODULES.map((m) => [m.id, allowAll(m.needs)])) as Record<ModuleId, Record<Perm, boolean>>,
  selected: "agent",
  model: "device",
  pos: {
    clock: { x: 0.05, y: 0.075 }, weather: { x: 0.51, y: 0.075 }, calendar: { x: 0.05, y: 0.325 },
    build: { x: 0.51, y: 0.325 }, agent: { x: 0.05, y: 0.575 }, home: { x: 0.51, y: 0.575 },
  },

  set: (p) => set(p),
  say: (text) => set((s) => ({ reply: { text, id: (s.reply?.id ?? 0) + 1 } })),
}));
