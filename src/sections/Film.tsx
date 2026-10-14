import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eyebrow, Headline, Reveal, Section } from "../components/ui";
import { Icon } from "../lib/icons";
import { pub } from "../lib/pub";

/* The film: our 64 second showreel. It loads nothing until it is asked for (the poster is the only
   download), plays with sound on the first tap, and serves the 9:16 cut on phones so it fills the
   screen the way people hold them. Captions ship with it. */
const FILM = {
  land: { src: "/visuals/selika-film-16x9.mp4", poster: "/visuals/selika-film-16x9.jpg", vtt: "/visuals/selika-film.vtt" },
  port: { src: "/visuals/selika-film-9x16.mp4", poster: "/visuals/selika-film-9x16.jpg", vtt: "/visuals/selika-film.vtt" },
};
const spring = { type: "spring" as const, stiffness: 260, damping: 18 };

export function Film() {
  const [portrait, setPortrait] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches);
  const [started, setStarted] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const on = () => { if (!video.current || video.current.paused) setPortrait(mq.matches); };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // pause when it scrolls well out of view, so the sound never plays behind other sections
  useEffect(() => {
    const v = video.current; if (!v || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused) v.pause(); }, { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const f = portrait ? FILM.port : FILM.land;
  const play = () => {
    const v = video.current; if (!v) return;
    setStarted(true);
    v.muted = false;
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
  };

  return (
    <Section id="film" className="!pt-10 md:!pt-16">
      <div className="wrap">
        <Reveal className="mx-auto max-w-[60rem] text-center">
          <Eyebrow>The film · About a minute, with sound</Eyebrow>
          <Headline lead="The whole idea," accent="in one film." className="h-section mt-5 text-[clamp(2.3rem,5.2vw,4.4rem)] [text-wrap:balance]" />
          <p className="body-lg mx-auto mt-5 max-w-[34rem]">The problem, the mirror, a demo and the outcome.</p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 md:mt-14">
          <div className={`film-frame relative mx-auto overflow-hidden rounded-[1.6rem] bg-night sm:rounded-[2.2rem] ${portrait ? "aspect-[9/16] w-full max-w-[24rem]" : "aspect-video w-full max-w-[1120px]"}`}>
            <video key={f.src} ref={video} className="absolute inset-0 h-full w-full object-cover" poster={pub(f.poster)} preload="none" playsInline controls={started}
              aria-label="Selika film: a narrated introduction to Selika Beauty and Selika Dev">
              <source src={pub(f.src)} type="video/mp4" />
              <track kind="captions" srcLang="en" label="English" src={pub(f.vtt)} />
            </video>
            <AnimatePresence>
              {!started && (
                <motion.button key="play" type="button" onClick={play} aria-label="Play the film with sound"
                  className="no-press group absolute inset-0 grid place-items-center"
                  initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
                  <span className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_55%,rgba(5,6,10,0)_0%,rgba(5,6,10,0.45)_100%)]" />
                  <motion.span className="lg-glass lg-glass-dark relative grid h-20 w-20 place-items-center rounded-full text-ink sm:h-24 sm:w-24"
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} transition={spring}>
                    <span className="film-ring absolute -inset-2 rounded-full" />
                    <Icon name="Play" size={30} stroke={1.9} className="translate-x-[2px]" />
                  </motion.span>
                  <span className="absolute inset-x-0 bottom-4 flex justify-center sm:bottom-6">
                    <span className="lg-glass lg-glass-dark inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink/90">
                      <Icon name="Volume2" size={14} /> Sound on · 1:04
                    </span>
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <p className="mx-auto mt-4 max-w-[40rem] text-center text-[0.78rem] leading-relaxed text-dim">
            Selika is in development. The film uses concept visualisations and AI-generated people, an AI narrator and an original score.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
