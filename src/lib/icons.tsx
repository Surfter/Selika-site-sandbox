import {
  ListChecks, SunMedium, Mic, WandSparkles, MoonStar, Palette, CameraOff, LayoutGrid, Cpu, Bot, AudioLines, ShieldCheck, Layers, Share2,
  Smartphone, Lightbulb, Hourglass, ScanFace, Repeat, Aperture, CircleDot, HardDrive, KeyRound, CloudOff, VideoOff, ArrowRight, ArrowLeft,
  ArrowUpRight, ChevronDown, X, Plus, Check, Sparkles, Camera, Calendar, CloudSun, GitBranch, House, Clock, Code, Lock, Unlock, Play, Pause,
  RotateCcw, Menu, Eye, Scan, Minus, Move, Hand, ChevronUp, MessageCircle,
} from "lucide";

type Node = [string, Record<string, string | number>, Node[]?];

/** One icon set for the DOM and for canvas textures, from the same lucide data. */
const ICONS: Record<string, Node> = {
  ListChecks, SunMedium, Mic, WandSparkles, MoonStar, Palette, CameraOff, LayoutGrid, Cpu, Bot, AudioLines, ShieldCheck, Layers, Share2,
  Smartphone, Lightbulb, Hourglass, ScanFace, Repeat, Aperture, CircleDot, HardDrive, KeyRound, CloudOff, VideoOff, ArrowRight, ArrowLeft,
  ArrowUpRight, ChevronDown, X, Plus, Check, Sparkles, Camera, Calendar, CloudSun, GitBranch, House, Clock, Code, Lock, Unlock, Play, Pause,
  RotateCcw, Menu, Eye, Scan, Minus, Move, Hand, ChevronUp, MessageCircle,
} as unknown as Record<string, Node>;

function children(node: Node): Node[] { return (node[2] ?? []) as Node[]; }

/** The icon as an SVG string (for drawing into canvas textures). */
export function iconSvg(name: string, color = "#fff", stroke = 1.6, size = 96): string {
  const n = ICONS[name] ?? ICONS.Sparkles;
  const inner = children(n).map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ")}/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

/** The icon as a React element. */
export function Icon({ name, size = 18, stroke = 1.75, className = "" }: { name: string; size?: number; stroke?: number; className?: string }) {
  const n = ICONS[name] ?? ICONS.Sparkles;
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children(n).map(([tag, attrs], i) => {
        const T = tag as "path";
        const props: Record<string, string | number> = {};
        for (const [k, v] of Object.entries(attrs)) props[k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
        return <T key={i} {...props} />;
      })}
    </svg>
  );
}

/** Rasterise a set of icons into one square atlas canvas (columns x rows of cells). */
export async function iconAtlas(names: string[], cell = 128, color = "#fff", stroke = 1.5): Promise<{ canvas: HTMLCanvasElement; cols: number; rows: number }> {
  const cols = Math.ceil(Math.sqrt(names.length)), rows = Math.ceil(names.length / cols);
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell; canvas.height = rows * cell;
  const ctx = canvas.getContext("2d")!;
  await Promise.all(names.map((name, i) => new Promise<void>((res) => {
    const img = new Image();
    img.onload = () => { const pad = cell * 0.16; ctx.drawImage(img, (i % cols) * cell + pad, Math.floor(i / cols) * cell + pad, cell - pad * 2, cell - pad * 2); res(); };
    img.onerror = () => res();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(iconSvg(name, color, stroke, cell));
  })));
  return { canvas, cols, rows };
}
