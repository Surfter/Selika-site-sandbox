import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { NAV } from "../lib/content";
import { useLenis } from "../lib/motion";
import { Icon } from "../lib/icons";
import { useSite } from "../lib/store";
import { Button, Logo, specMove } from "./ui";

export function Nav() {
  const lenis = useLenis();
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const entered = useSite((s) => s.entered);

  useEffect(() => {
    const ids = NAV.map((n) => n.href.slice(1));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6);
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);
  useEffect(() => { if (open) lenis?.stop(); else lenis?.start(); }, [open, lenis]);

  const go = (href: string) => { setOpen(false); lenis?.scrollTo(href, { duration: 1.6, offset: 0 }); };

  return (
    <motion.header className="fixed inset-x-0 top-0 z-40" initial={{ y: -24, opacity: 0 }} animate={entered ? { y: 0, opacity: 1 } : undefined} transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
      <div className="mx-auto flex h-[var(--nav-h)] w-full items-center justify-between gap-2.5 px-5 sm:px-8 lg:justify-center">
        <a href="#top" onClick={(e) => { e.preventDefault(); go("#top"); }} aria-label="selika, back to top" onPointerMove={specMove}
          className={`lg-glass flex h-11 items-center overflow-hidden rounded-full px-4 transition-[background-color] duration-500 ${solid ? "lg-glass-deep" : "lg-glass-dark"}`}>
          <span aria-hidden className="lg-spec" />
          <Logo size="md" />
        </a>
        <nav aria-label="Sections" onPointerMove={specMove} className={`lg-glass hidden h-11 items-center gap-0.5 overflow-hidden rounded-full p-1 transition-[background-color] duration-500 lg:flex ${solid ? "lg-glass-deep" : "lg-glass-dark"}`}>
          <span aria-hidden className="lg-spec" />
          {NAV.map((n) => {
            const on = active === n.href.slice(1);
            return (
              <a key={n.href} href={n.href} onClick={(e) => { e.preventDefault(); go(n.href); }} aria-current={on ? "true" : undefined}
                className={`relative flex h-9 items-center rounded-full px-4 text-[0.86rem] transition-colors duration-300 ${on ? "text-night" : "text-ink/75 hover:text-ink"}`}>
                {on && <motion.span layoutId="nav-thumb" className="absolute inset-0 -z-[1] rounded-full bg-white" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
                <span className="relative">{n.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block"><Button variant="accent" icon="ArrowRight" small className="!h-11 !px-5" onClick={() => go("#demo")}>Try the demo</Button></div>
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="lg-glass lg-glass-dark grid h-11 w-11 place-items-center rounded-full text-ink lg:hidden">
            <Icon name="Menu" size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close menu" className="no-press absolute inset-0 bg-night/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div role="dialog" aria-modal="true" aria-label="Menu" className="sg-glass sg-glass-strong absolute inset-x-3 top-3 rounded-[2rem] p-5"
              initial={{ y: -20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -14, opacity: 0, scale: 0.98 }} transition={{ type: "spring", stiffness: 340, damping: 30 }}>
              <div className="flex items-center justify-between">
                <Logo size="md" />
                <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="sg-glass grid h-11 w-11 place-items-center rounded-full"><Icon name="X" size={18} /></button>
              </div>
              <ul className="mt-6 flex flex-col">
                {NAV.map((n, i) => (
                  <motion.li key={n.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                    <a href={n.href} onClick={(e) => { e.preventDefault(); go(n.href); }} className="flex items-center justify-between border-b border-white/10 py-4 font-display text-[1.6rem] tracking-[-0.03em]">
                      {n.label}<Icon name="ArrowUpRight" size={20} className="text-mute" />
                    </a>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-6"><Button variant="accent" icon="ArrowRight" className="w-full" onClick={() => go("#demo")}>Try the demo</Button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
