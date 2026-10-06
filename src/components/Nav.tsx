import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { springFor } from "../lib/physics";
import { scrollToId } from "./ui/Glass";

const LINKS = [
  { href: "#demo", label: "Demo" },
  { href: "#problem", label: "Problem" },
  { href: "#hardware", label: "Hardware" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#about", label: "About" },
];

export function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight * 0.4;
      let cur = "";
      for (const l of LINKS) {
        const el = document.querySelector(l.href);
        if (el && el.getBoundingClientRect().top <= mid) cur = l.href;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (href: string) => (e: React.MouseEvent) => { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); scrollToId(href); };

  return (
    <motion.header
      className="fixed left-0 right-0 z-50 flex justify-center px-4"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 14px)" }}
      initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...springFor(0.7, 1), delay: 0.2 }}
    >
      <motion.nav
        className="glass rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-1"
        animate={{ backgroundColor: scrolled ? "rgba(10,12,20,0.55)" : "rgba(10,12,20,0.25)" }}
        transition={{ duration: 0.4 }}
      >
        <a href="#top" onClick={go("#top")} className="mr-3 text-ink" aria-label="selika, back to top"><Logo size="sm" /></a>
        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => {
            const on = active === l.href;
            return (
              <motion.a
                key={l.href} href={l.href} onClick={go(l.href)}
                className={`relative rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium transition-colors ${on ? "text-ink" : "text-mute hover:text-ink"}`}
                whileHover={{ y: -1.5 }} whileTap={{ scale: 0.95 }} transition={springFor(0.28, 1)}
              >
                {on && (
                  <motion.span layoutId="nav-thumb" className="absolute inset-0 rounded-full glass-tint" style={{ position: "absolute", zIndex: -1 }} transition={springFor(0.45, 0.9)} />
                )}
                {l.label}
              </motion.a>
            );
          })}
        </div>
        <motion.a
          href="#demo" onClick={go("#demo")}
          className="ml-1 glass glass-tint rounded-full px-4 py-1.5 text-[0.82rem] font-semibold text-ink"
          whileHover={{ y: -1.5, scale: 1.03, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 1px rgba(142,197,255,0.4), 0 12px 32px -10px rgba(77,141,255,0.6)" }}
          whileTap={{ scale: 0.96 }} transition={springFor(0.28, 1)}
        >
          Try it
        </motion.a>
      </motion.nav>
    </motion.header>
  );
}
