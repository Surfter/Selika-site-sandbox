import { motion } from "framer-motion";
import { springFor } from "../../lib/physics";
import { GlassButton, GlassCard } from "../ui/Glass";
import { Item, Reveal, Stagger, Words } from "../ui/Reveal";
import { ExpandCards, IconAct, IconReflect, IconUnderstand } from "./ExpandCards";
import { Logo } from "../Logo";

function Head({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <>
      <Reveal><p className="eyebrow mb-4">{eyebrow}</p></Reveal>
      <Words as="h2" className="h-section text-[clamp(2rem,5vw,3.6rem)] text-ink" text={title} />
      {lede && <Reveal delay={0.2}><p className="mt-6 max-w-2xl text-[clamp(1rem,1.4vw,1.15rem)] leading-relaxed text-mute">{lede}</p></Reveal>}
    </>
  );
}

/* ---------------- Reflect / Understand / Act ---------------- */
export function Layers() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="wrap">
        <Head eyebrow="How it works" title="Reflect. Understand. Act." />
        <Reveal delay={0.15} className="mt-12">
          <ExpandCards items={[
            { key: "reflect", tag: "Layer 01", title: "Reflect", icon: <IconReflect />, body: "The mirror stays a mirror. Your reflection is the interface, lit by high-colour-rendering light that Selika controls.", more: "A phone shows you a camera image of yourself. Selika works on the reflection you already trust, with both hands free." },
            { key: "understand", tag: "Layer 02", title: "Understand", icon: <IconUnderstand />, body: "A camera behind a physical shutter is designed to track your face and compare shade and undertone in controlled light. Voice carries the intent.", more: "The heavy compute runs on your phone, so the mirror never becomes an obsolete computer bolted to a wall." },
            { key: "act", tag: "Layer 03", title: "Act", icon: <IconAct />, body: "Selika draws step-by-step guidance onto your reflection, previews a look before you apply it, and sets the light.", more: "On the platform side, it runs the looks, lessons and modules you have given it permission to run." },
          ]} />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- The objection ---------------- */
export function Objection() {
  return (
    <section id="hardware" className="relative py-24 md:py-32">
      <div className="wrap">
        <Head eyebrow="The obvious objection" title="“Isn't this a lit vanity mirror with extra steps?”"
          lede="It is a fair question and it deserves a straight answer rather than a slogan. Mirrors with named lighting environments already sell: Beautifect's Glow Mirror offers evening, daylight and bright sun, simplehuman's Sensor Mirror Pro has recreated light captured from real places since 2016, and MIRARI's smart mirror adds a touchscreen with AR try-on. Phone apps do try-on for free. Here is the honest accounting of what is different and what is not." />
        <Reveal delay={0.15} className="mt-12">
          <ExpandCards minHeight="16rem" items={[
            { key: "no", tag: "Not the difference", title: "Having a light", body: "Adjustable colour temperature is a commodity, and recreating the light of a destination already ships. A mirror also lights you only from the front, so it can approximate a room's light, not reproduce it.", more: "So light is the enabler, not the product: it is what makes shade decisions and the camera's reading consistent." },
            { key: "part", tag: "The difference to prove", title: "Guidance on your reflection", body: "Try-on on a screen already exists. Selika's bet is guidance drawn onto your actual reflection, step by step, on the mirror you already use, while both hands are busy.", more: "It is also the hardest part: your reflection sits twice as far away as the glass. Landing guidance on it accurately is exactly what the first prototype is built to test." },
            { key: "real", tag: "The long game", title: "Being programmable", body: "A mirror with a dial is finished the day it ships. Selika is a surface with an open interface: looks and lessons from creators, your own modules, models and agents.", more: "That is the property a closed appliance cannot copy by adding a feature, and it is why the hardware is worth building." },
          ]} />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Prototype ---------------- */
const SPEC = [
  ["Display", "13.3\" 1080p panel and driver board, behind the two-way mirror", "£22 to £37"],
  ["Two-way mirror", "Acrylic or glass, about 35 x 45 cm; reflection and transmission to be measured", "£3 to £9"],
  ["Lighting", "95+ CRI tunable LEDs, 2700K to 6500K, dual-channel driver", "£4 to £17"],
  ["Camera", "1080p wide-angle module; the physical shutter is a custom part", "£9 to £26"],
  ["Controller", "ESP32-S3 for lighting and peripherals", "£1 to £4"],
  ["Mic and power", "MEMS microphone, 12 V USB-C power supply", "£3 to £7"],
  ["Frame and mount", "Aluminium profile, diffuser, clamp or adhesive mount", "£3 to £9"],
  ["Compute", "Your phone", "existing"],
];
export function Prototype() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="wrap">
        <Head eyebrow="Planned first build" title="Selika HUD, the first build"
          lede="The first build is deliberately not a piece of furniture. It is planned as a modular head-up display that mounts to a mirror you already own, with your phone doing the heavy compute. It tests the hardest part first, guidance that lands accurately on your reflection in controlled light, before committing capital to an appliance." />
        <Reveal delay={0.15} className="mt-12">
          <GlassCard className="overflow-hidden p-0">
            <div className="grid grid-cols-[8rem_1fr_auto] gap-4 border-b border-white/10 px-6 py-3 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-dim md:grid-cols-[10rem_1fr_6rem]">
              <span>Component</span><span>Specification</span><span className="text-right">Per unit</span>
            </div>
            <Stagger gap={0.07} amount={0.2}>
              {SPEC.map(([a, b, c]) => (
                <Item key={a}>
                  <motion.div className="grid grid-cols-[8rem_1fr_auto] gap-4 border-b border-white/5 px-6 py-4 text-[0.9rem] last:border-0 md:grid-cols-[10rem_1fr_6rem]"
                    whileHover={{ backgroundColor: "rgba(142,197,255,0.05)" }} transition={{ duration: 0.2 }}>
                    <span className="font-medium text-ink">{a}</span><span className="text-mute">{b}</span><span className="tabular text-right text-sky">{c}</span>
                  </motion.div>
                </Item>
              ))}
            </Stagger>
          </GlassCard>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl border-l border-white/10 pl-4 text-[0.78rem] leading-relaxed text-dim">
            Per-unit estimates at 1,000 units from Accio Work's sourcing of Alibaba.com listings, converted at $1 = £0.7474. With assembly, freight, duty and import VAT, roughly £69 to £163 a unit landed, against a price hypothesis of £249 to £299.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Roadmap ---------------- */
const PHASES = [
  { n: "Phase 01", s: "In design", t: "Selika HUD", d: "A modular attachment for an existing mirror. Tests the hardest part first: step-by-step guidance that lands accurately on your reflection, in controlled light, at the lowest possible capital cost.", now: true },
  { n: "Phase 02", s: "Next", t: "Selika Mirror", d: "Purpose-built hardware: integrated display, tunable high-CRI lighting, better optics, physical privacy shutter and industrial design that belongs in the room." },
  { n: "Phase 03", s: "Direction", t: "Selika Platform", d: "The mirror as an extensible surface: looks and lessons from artists and creators, brand shade guides, a module SDK, and bring-your-own model and agent endpoints, so the hardware outlives any one software generation." },
];
export function Roadmap() {
  return (
    <section id="roadmap" className="relative py-24 md:py-32">
      <div className="wrap">
        <Head eyebrow="Sequence" title="HUD, then mirror, then platform." />
        <div className="relative mt-14">
          {/* the line, and a pulse that walks it */}
          <div aria-hidden className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-sky/50 via-violet/50 to-transparent lg:block" />
          <motion.div aria-hidden className="absolute top-6 hidden h-2 w-2 -translate-y-1/2 rounded-full bg-sky shadow-[0_0_14px_#8EC5FF] lg:block"
            animate={{ left: ["0%", "100%"] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
          <Stagger className="grid gap-5 lg:grid-cols-3" gap={0.14} amount={0.2}>
            {PHASES.map((p) => (
              <Item key={p.n}>
                <GlassCard tint={p.now} hover className="relative p-7 pt-12">
                  <motion.span className="absolute left-7 top-[1.4rem] h-3 w-3 -translate-y-1/2 rounded-full border-2 border-sky bg-night"
                    animate={p.now ? { boxShadow: ["0 0 0 0 rgba(142,197,255,0.6)", "0 0 0 10px rgba(142,197,255,0)"] } : undefined} transition={{ duration: 1.8, repeat: Infinity }} />
                  <div className="flex items-center justify-between text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-dim">
                    <span>{p.n}</span><span className={p.now ? "text-sky" : ""}>{p.s}</span>
                  </div>
                  <h3 className="h-card mt-3 text-[1.35rem] text-ink">{p.t}</h3>
                  <p className="mt-3 text-[0.88rem] leading-relaxed text-mute">{p.d}</p>
                </GlassCard>
              </Item>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

/* ---------------- About ---------------- */
export function About() {
  return (
    <section id="about" className="relative py-24 md:py-32">
      <div className="wrap">
        <Head eyebrow="Founder & status" title="Where this actually is." />
        <div className="mt-12 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <GlassCard className="flex h-full flex-col p-8 lg:p-10">
              <div className="eyebrow mb-4">The origin</div>
              <p className="text-[1.02rem] leading-relaxed text-ink/90">
                Selika started with a small, stupid frustration. I looked in the mirror one morning, thought I looked good, took a photo to keep it, and the photo was of someone else. That led to a question I could not let go of: why can't a mirror capture what I actually see?
              </p>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-mute">
                Research took that question apart. The mirror-to-photo gap turned out to be a great story and a weak business, but chasing it surfaced a better one. Mirrors are the only interface we all use daily that has never been asked to do anything, and the moment they matter most is getting ready. So Selika guides that moment on your own reflection, and opens the surface to anyone who wants to build on it.
              </p>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-mute">
                I'm a cyber security degree apprentice working in identity and access management while studying for my degree. That is why a camera-equipped mirror gets a physical shutter and local-first processing as requirements rather than features, and why every Selika Dev module only gets the permissions you grant it.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <GlassButton primary href="#demo">Explore the demo</GlassButton>
                <GlassButton href="#top">Back to top</GlassButton>
              </div>
              {/* the card's own footing: where the project actually stands, at a glance */}
              <div className="mt-auto grid grid-cols-3 gap-3 border-t border-white/10 pt-6" style={{ marginTop: "auto" }}>
                {[["Stage", "Concept & research"], ["Products", "Beauty & Dev"], ["Next", "First prototype"]].map(([k, v]) => (
                  <div key={k}>
                    <div className="eyebrow mb-1.5 text-[0.62rem]">{k}</div>
                    <div className="h-card text-[0.98rem] leading-snug text-ink">{v}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>
          <Stagger className="flex flex-col gap-5" gap={0.12}>
            {[
              ["Where it stands", "Concept and research stage, with the first prototype specified and its components identified on Alibaba.com. The demo on this page is an interactive simulation of the planned product.", "Next: supplier samples, the first prototype, and a structured test with target users."],
              ["Privacy, by requirement", "A camera in a bathroom or bedroom is a harder ask than a camera in your pocket, and pretending otherwise is how smart mirrors have failed before.", "Physical shutter, visible capture indicator, no always-on recording, local-first processing, and no cloud path you did not explicitly turn on."],
              ["Alibaba CoCreate Pitch 2026", "Selika is applying to the CoCreate Pitch 2026 Students Track, with the London finals in November 2026.", "Finalists are announced on 20 October 2026."],
            ].map(([t, a, b]) => (
              <Item key={t}>
                <GlassCard hover className="p-6 lg:p-7">
                  <h3 className="h-card text-[1.15rem] text-ink">{t}</h3>
                  <p className="mt-2.5 text-[0.86rem] leading-relaxed text-mute">{a}</p>
                  <p className="mt-2.5 text-[0.86rem] leading-relaxed text-mute">{b}</p>
                </GlassCard>
              </Item>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative pb-14 pt-10">
      <div className="wrap">
        <Reveal>
          <GlassCard className="flex flex-wrap items-end justify-between gap-6 p-8">
            <div>
              <Logo />
              <p className="mt-3 max-w-md text-[0.84rem] leading-relaxed text-mute">Today, mirrors reflect you. Selika is designed to understand you.</p>
            </div>
            <p className="text-[0.66rem] uppercase tracking-[0.18em] text-dim">Concept site · prototype &amp; validation stage · 2026</p>
          </GlassCard>
        </Reveal>
      </div>
    </footer>
  );
}
