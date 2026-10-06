import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { TWO, PRODUCTS } from "../lib/content";
import { useSite, type Product } from "../lib/store";
import { useLenis } from "../lib/motion";
import { Icon } from "../lib/icons";
import { Button, Eyebrow, Reveal, Section } from "../components/ui";

/* one word of the statement, lit as the scroll reaches it */
function Word({ w, i, n, p, accent }: { w: string; i: number; n: number; p: MotionValue<number>; accent?: boolean }) {
  const o = useTransform(p, [i / n, (i + 1) / n], [0.16, 1]);
  const b = useTransform(p, [i / n, (i + 1) / n], [6, 0]);
  const f = useTransform(b, (v) => `blur(${v}px)`);
  return <motion.span style={{ opacity: o, filter: f }} className={`inline-block pr-[0.22em] ${accent ? "accent-word" : ""}`}>{w}</motion.span>;
}

function Statement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words: { w: string; accent?: boolean }[] = [
    ...TWO.line[0].split(" ").map((w) => ({ w })),
    ...TWO.line[1].split(" ").map((w) => ({ w })),
    { w: TWO.line[2], accent: true },
  ];
  return (
    <div ref={ref} className="mx-auto max-w-[62rem] text-center">
      <p className="h-section text-[clamp(1.9rem,4.4vw,4rem)] leading-[1.05]">
        {words.map((x, i) => <Word key={i} w={x.w} i={i} n={words.length} p={scrollYProgress} accent={x.accent} />)}
      </p>
    </div>
  );
}

function Panel({ id }: { id: Product }) {
  const P = PRODUCTS[id];
  const D = id === "beauty" ? TWO.beauty : TWO.dev;
  const setProduct = useSite((s) => s.setProduct);
  const current = useSite((s) => s.product);
  const lenis = useLenis();
  const on = current === id;
  const tint = id === "beauty" ? "rgba(139,124,255,0.16)" : "rgba(77,141,255,0.16)";
  const ring = id === "beauty" ? "rgba(185,169,255,0.55)" : "rgba(142,197,255,0.55)";
  return (
    <motion.div className="sg-glass relative flex h-full flex-col overflow-hidden rounded-[2rem] p-7 sm:p-9" whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{ boxShadow: on ? `inset 0 0 0 1px ${ring}, 0 30px 70px -30px ${tint}` : undefined }}>
      <div className="relative flex items-center justify-between">
        <Eyebrow>{P.name}</Eyebrow>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-dim">{id === "beauty" ? "Prototype first" : "Same hardware, next"}</span>
      </div>
      <h3 className="h-section relative mt-6 text-[clamp(1.9rem,3.2vw,2.8rem)]">{P.headline[0]} <span className="accent-word" style={{ color: id === "beauty" ? "#C9B6FF" : "#A9D3FF" }}>{P.headline[1]}</span></h3>
      <p className="relative mt-4 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-ink/70">{D.who}</p>
      <p className="relative mt-3 text-[0.98rem] leading-relaxed text-mute">{D.body}</p>
      <ul className="relative mt-6 flex flex-col gap-2.5">
        {D.points.map((pt) => (
          <li key={pt} className="flex items-start gap-3 text-[0.92rem] text-ink/90">
            <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-white/10"><Icon name="Check" size={12} /></span>{pt}
          </li>
        ))}
      </ul>
      <div className="relative mt-auto pt-8">
        <Button variant={on ? "accent" : "glass"} icon="ArrowRight" onClick={() => { setProduct(id); lenis?.scrollTo("#demo", { duration: 1.5 }); }}>Try {P.name} in the demo</Button>
      </div>
    </motion.div>
  );
}

export function TwoProducts() {
  return (
    <Section id="products" stream={1}>
      <div className="wrap">
        <Reveal className="text-center">
          <Eyebrow className="justify-center">{TWO.eyebrow}</Eyebrow>
          <h2 className="h-section mt-5 text-[clamp(2.4rem,6vw,5.4rem)]">
            {TWO.title[0]} <span className="accent-word">{TWO.title[1]}</span>
          </h2>
        </Reveal>
        <div className="relative mt-14 grid gap-4 lg:grid-cols-2">
          <Reveal className="h-full"><Panel id="beauty" /></Reveal>
          <Reveal className="h-full" delay={0.1}><Panel id="dev" /></Reveal>
          {/* the shared core, between the two */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
            <div className="sg-glass sg-glass-strong grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full text-center font-mono text-[0.5rem] uppercase leading-tight tracking-[0.12em] text-ink/80">One<br />core</div>
          </div>
        </div>
        <Reveal><p className="mx-auto mt-8 max-w-[44rem] text-center text-[0.95rem] leading-relaxed text-mute">{TWO.shared}</p></Reveal>
        <div className="mt-24 md:mt-36"><Statement /></div>
      </div>
    </Section>
  );
}
