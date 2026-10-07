import type { Product } from "./store";

/* Every line on the site lives here. Source of truth: the final CoCreate
   application text (Draft 8). Planned features are described as planned. */

export type Feature = {
  id: string;
  icon: string; // lucide icon name (vanilla `lucide` package)
  label: string;
  short: string;
  detail: string;
};

export type ProductCopy = {
  id: Product;
  name: string;
  eyebrow: string;
  headline: [string, string]; // the second part is set in the italic accent
  body: string;
  big: [string, string];
  card: string;
  cta: string;
  features: Feature[];
};

export const PRODUCTS: Record<Product, ProductCopy> = {
  beauty: {
    id: "beauty",
    name: "Selika Beauty",
    eyebrow: "Selika Beauty",
    headline: ["A mirror that", "guides you."],
    body: "Step-by-step makeup guidance drawn on your own reflection. Hands-free with voice, in light you control.",
    big: ["Guided on", "you."],
    card: "Makeup, guided on your reflection",
    cta: "Try Selika Beauty",
    features: [
      { id: "guided", icon: "ListChecks", label: "Guided steps", short: "One step at a time, on your reflection.",
        detail: "Selika draws each step onto your own reflection: where the liner goes, how far the blush reaches, when to move on. No phone to prop up and pause with product on your fingers." },
      { id: "light", icon: "SunMedium", label: "High-CRI light", short: "Colour chosen in light you control.",
        detail: "Tunable, high-colour-rendering light from 2700K to 6500K, built into the mirror, so colour decisions are made in controlled light rather than whatever the bathroom has." },
      { id: "voice", icon: "Mic", label: "Hands-free", short: "Next step, repeat, warmer light.",
        detail: "Your hands are busy, so you talk to it. Voice moves you through the steps and changes the light without touching a thing." },
      { id: "tryon", icon: "WandSparkles", label: "Try-on", short: "See a look before you commit.",
        detail: "After guidance comes try-on: preview a look on your reflection first, then follow the steps that create it." },
      { id: "presets", icon: "MoonStar", label: "Light presets", short: "Office, restaurant, evening.",
        detail: "Check how a look reads under office, restaurant and evening presets before you leave the house." },
      { id: "creators", icon: "Palette", label: "Creator looks", short: "New looks from artists.",
        detail: "New looks from makeup artists and creators arrive on the mirror over time, so it keeps getting better after you buy it." },
      { id: "shutter", icon: "CameraOff", label: "Privacy shutter", short: "A real shutter over the lens.",
        detail: "A physical shutter blocks the camera whenever you want it closed, and processing stays local by default." },
    ],
  },
  dev: {
    id: "dev",
    name: "Selika Dev",
    eyebrow: "Selika Dev",
    headline: ["A mirror you can", "build on."],
    body: "Finished hardware and an open platform for developers and makers: modules, your own models and agents, voice, and permissions you set.",
    big: ["Built by", "you."],
    card: "An open mirror platform",
    cta: "Try Selika Dev",
    features: [
      { id: "modules", icon: "LayoutGrid", label: "Modules", short: "Small, declarative, yours.",
        detail: "Build modules for the surface you stand at twice a day. A few lines describe what shows, where, and when." },
      { id: "models", icon: "Cpu", label: "Your models", short: "Bring your own AI.",
        detail: "Choose your own AI models and endpoints instead of being locked to ours." },
      { id: "agents", icon: "Bot", label: "Agents", short: "Your agents, on the glass.",
        detail: "Point the mirror at your own agents for briefings, reminders and routines, running only with the permissions you grant." },
      { id: "voice", icon: "AudioLines", label: "Voice", short: "Talk to what you build.",
        detail: "Voice interaction is part of the platform, so the modules you build can listen and answer, hands-free." },
      { id: "perms", icon: "ShieldCheck", label: "Permissions", short: "Each module sees only what you allow.",
        detail: "Explicit, per-module permissions for the camera, the microphone and your data. Nothing gets access you did not grant." },
      { id: "hardware", icon: "Layers", label: "Finished hardware", short: "No more DIY two-way mirrors.",
        detail: "Makers already build smart mirrors from a Raspberry Pi, a two-way mirror and MagicMirror², which has over 20,000 stars on GitHub. Selika Dev is designed to give them finished hardware and an open platform." },
      { id: "ecosystem", icon: "Share2", label: "Beyond beauty", short: "A route well beyond beauty.",
        detail: "If Selika Beauty builds the first installed base, developers could later build tools, lessons and agents for those owners. In parallel, Selika Dev takes the mirror well beyond beauty." },
    ],
  },
};

export const NAV = [
  { href: "#products", label: "Products" },
  { href: "#demo", label: "Demo" },
  { href: "#inside", label: "Hardware" },
  { href: "#privacy", label: "Privacy" },
  { href: "#roadmap", label: "Roadmap" },
];

export const PROBLEM = {
  eyebrow: "The problem",
  title: ["You get ready in a mirror.", "The help is everywhere else."],
  body: "Makeup happens in a mirror, but the help is on a phone you have to prop up and pause, and colours are chosen under bathroom light that looks different once you leave.",
  cards: [
    { n: "01", icon: "Smartphone", front: "The help isn't on the mirror.", back: "Tutorials play on a phone you prop up, pause and scroll with product on your fingers. The guidance and the face it is meant for are in two different places." },
    { n: "02", icon: "Lightbulb", front: "Colour is chosen in the wrong light.", back: "Shades are picked under whatever light the bathroom has, then judged under different light once you have left the house." },
    { n: "03", icon: "Hourglass", front: "The mirror never gets better.", back: "Every other screen you own gains new tools after you buy it. The surface you stand in front of every day is finished the day it is made." },
  ],
};

export const ONLY_MIRROR = {
  eyebrow: "Why a mirror",
  title: ["What can only", "a mirror do?"],
  body: "Every feature has to justify needing a mirror. Three answers held up.",
  items: [
    { k: "Reflect", icon: "ScanFace", title: "Guide you on your actual reflection", body: "A phone shows you a camera image of yourself. Selika works on the reflection you already trust, while both hands are busy." },
    { k: "Light", icon: "SunMedium", title: "Light your face from the glass", body: "The light comes from the surface you are looking at, tuned from 2700K to 6500K with high colour rendering, so colour reads true at home." },
    { k: "Return", icon: "Repeat", title: "See you from the same place every day", body: "The same angle, the same distance, the same light, every morning. A phone camera never gets that, and the heavy compute still runs on your phone." },
  ],
};

export const TWO = {
  eyebrow: "One platform",
  title: ["One mirror.", "Two products."],
  line: ["Beauty proves why the mirror needs to exist.", "Dev proves what the mirror can", "become."],
  beauty: {
    who: "For people who do their own makeup and grooming",
    body: "Guidance on your reflection for the moments that matter, such as interviews, presentations and weddings, and for professional makeup artists, for whom consistent colour matters every working day.",
    points: ["Guided steps for makeup and grooming", "Shade and undertone in controlled, high-CRI light", "Try a look before you commit", "Office, restaurant and evening presets"],
  },
  dev: {
    who: "For developers and makers",
    body: "People already build their own smart mirrors from a Raspberry Pi, a two-way mirror and open-source software. Selika Dev is designed to give them finished hardware and an open platform.",
    points: ["Modules as small declarative definitions", "Bring your own models, APIs and agents", "Voice interaction built in", "Per-module permissions: each sees only what you allow"],
  },
  shared: "Both are designed around the same core hardware, so they can share one supply chain. Beauty launches first as the clearest physical demonstration; the hardware is designed for Dev from the start.",
};

export const COMPARE = {
  eyebrow: "The honest answer",
  title: ["Isn't this a lit mirror", "with extra steps?"],
  body: "Fair question. Lit mirrors with named lighting already sell, and one adds a touchscreen with try-on. Here is how they compare with what Selika is designed to do.",
  rivals: [
    { name: "Beautifect Glow Mirror", what: "A lit mirror with named lighting environments." },
    { name: "simplehuman Sensor Mirror Pro", what: "Has recreated light captured from real places since 2016." },
    { name: "MIRARI Smart Makeup Mirror", what: "An 8-inch touchscreen with AR try-on and skin analysis on a tabletop unit, around £305." },
  ],
  selika: "Guidance on your own reflection, in light it controls, on a mirror others can build on, attached to the mirror you already own.",
  note: "None of the products we checked attaches to a mirror you already own or opens itself to developers.",
  moat: "Making guidance land precisely on your reflection, not just on the display behind it, is our core technical work and, once solved, a potential moat.",
};

export const INSIDE = {
  eyebrow: "The hardware",
  title: ["What's inside", "the glass."],
  body: "Both products are designed around the same core hardware, with your phone doing the heavy compute. The first Selika Beauty prototype is specified, with candidate Alibaba.com suppliers identified for all nine components.",
  layers: [
    { id: "mirror", name: "Two-way mirror", spec: "Acrylic or glass, about 35 × 45 cm. Reflection and transmission to be measured on samples.", cost: "£3 to £9" },
    { id: "display", name: "Display", spec: "A 13.3-inch 1080p panel and driver board behind the two-way mirror. Brightness through the mirror is the first thing we test.", cost: "£22 to £37" },
    { id: "light", name: "Light", spec: "95+ CRI tunable LEDs, 2700K to 6500K, on a dual-channel driver.", cost: "£4 to £17" },
    { id: "camera", name: "Camera & shutter", spec: "A 1080p wide-angle module behind a physical privacy shutter, which is a custom part.", cost: "£9 to £26" },
    { id: "audio", name: "Microphone & power", spec: "A MEMS microphone for hands-free voice and a 12 V USB-C power supply.", cost: "£3 to £7" },
    { id: "controller", name: "Controller", spec: "An ESP32-S3 runs the lighting and peripherals. Your phone does the heavy compute.", cost: "£1 to £4" },
    { id: "frame", name: "Frame & mount", spec: "Aluminium profile, diffuser, and a clamp or adhesive mount for the mirror you own.", cost: "£3 to £9" },
  ],
  stats: [
    { k: "£249 to £299", v: "Price hypothesis" },
    { k: "9 of 9", v: "Components with candidate suppliers" },
    { k: "£69 to £163", v: "Estimated landed cost a unit at 1,000" },
  ],
  costNote: "Per-unit estimates at 1,000 units from Accio Work's sourcing of Alibaba.com listings, converted at $1 = £0.7474. With assembly, freight, duty and import VAT, roughly £69 to £163 a unit landed, against a price hypothesis of £249 to £299.",
};

export const PRIVACY = {
  eyebrow: "Privacy",
  title: ["Private", "by design."],
  body: "A mirror with a camera lives in the most private rooms of a home, and an open platform means letting other people's software run on it. Both are security problems first, and deciding who and what gets access to what is our day job.",
  points: [
    { icon: "Aperture", t: "Physical shutter", d: "A real shutter that blocks the lens, not a software toggle." },
    { icon: "CircleDot", t: "Visible capture light", d: "You can always see when the camera is in use." },
    { icon: "HardDrive", t: "Local by default", d: "Processing stays on your devices unless you choose otherwise." },
    { icon: "KeyRound", t: "Per-module permissions", d: "Each module sees only what you allow, nothing more." },
    { icon: "CloudOff", t: "No surprise cloud", d: "No cloud path you did not explicitly turn on." },
    { icon: "VideoOff", t: "No always-on recording", d: "The mirror is not a security camera, and never acts like one." },
  ],
};

export const ROADMAP = {
  eyebrow: "Roadmap",
  title: ["HUD, then mirror,", "then platform."],
  stages: [
    { k: "01", name: "Selika HUD", tag: "First build", body: "A modular attachment for an existing mirror, with your phone doing the compute. It tests the hardest part first: guidance that lands accurately on your reflection, in controlled light." },
    { k: "02", name: "Selika Mirror", tag: "Next", body: "Purpose-built hardware: an integrated display, tunable high-CRI lighting, better optics, a physical privacy shutter and industrial design that belongs in the room." },
    { k: "03", name: "Selika Platform", tag: "Then", body: "The mirror as an extensible surface: looks and lessons from artists and creators, a module SDK, and bring-your-own model and agent endpoints." },
  ],
  next: ["Supplier samples", "A working Selika Beauty prototype", "Testing with fifteen target users", "Selika Dev opens the hardware"],
};

export const ABOUT = {
  eyebrow: "Founder & status",
  title: ["Where this", "actually is."],
  origin: [
    "Selika started with an ordinary moment. I looked fine in the mirror, took a photo, and the photo looked like someone else. I wanted a mirror that could capture what I actually saw.",
    "That idea did not survive testing: capturing photos ranked last of six use cases, and the first version looked like an expensive phone stand. So we asked a better question: what can only a mirror do? Guidance on your reflection, light from the glass, and the same view every day.",
    "I'm a cyber security degree apprentice working in identity and access management. That is why a camera-equipped mirror gets a physical shutter and local-first processing as requirements, and why every Selika Dev module only gets the permissions you grant it.",
  ],
  status: [
    { k: "Stage", v: "Concept & research" },
    { k: "Products", v: "Beauty & Dev" },
    { k: "Next", v: "First prototype" },
  ],
  cards: [
    { t: "Where it stands", a: "Concept and research stage, with the first Selika Beauty prototype specified and its components identified on Alibaba.com. The demo on this page is an interactive simulation of the planned product.", b: "Next: supplier samples, a working prototype, and a structured test with fifteen target users." },
    { t: "Alibaba CoCreate Pitch 2026", a: "Selika has applied to the CoCreate Pitch 2026 Students Track, with the London finals in November 2026.", b: "Finalists are announced on 20 October 2026." },
  ],
};

export const FOOTER = {
  line: "Today, mirrors reflect you. Selika is designed to understand you.",
  note: "The demo is an interactive simulation of the planned product. Lighting values are illustrative.",
  credits: "3D face: ICT-FaceKit, © 2020 USC Institute for Creative Technologies, MIT licence.",
};
