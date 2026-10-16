import { useEffect, useRef, useState } from "react";
import { Icon } from "../lib/icons";
import { pub } from "../lib/pub";
import { isCoarse } from "../lib/perf";
import { Eyebrow, Headline, Reveal, Section } from "../components/ui";

/* ---------------- The product video ----------------
   The film is 16:9 only. On a phone held upright it opens full screen and asks
   the browser to turn to landscape (Android honours the lock; iOS plays it in
   its own full-screen player, which follows the phone's rotation). */
const SRC = pub("/visuals/selika-film.mp4"), POSTER = pub("/visuals/selika-film.jpg");

type FsVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void; webkitRequestFullscreen?: () => Promise<void> };
type LockOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void>; unlock?: () => void };

const portraitPhone = () => typeof window !== "undefined" && isCoarse && window.matchMedia("(orientation: portrait)").matches;

async function goFullscreenLandscape(box: HTMLElement | null, v: FsVideo) {
  try {
    if (box && box.requestFullscreen) await box.requestFullscreen({ navigationUI: "hide" });
    else if (v.webkitRequestFullscreen) await v.webkitRequestFullscreen();
    else if (v.webkitEnterFullscreen) { v.webkitEnterFullscreen(); return; }
  } catch {
    if (v.webkitEnterFullscreen) { try { v.webkitEnterFullscreen(); } catch { /* the inline player still works */ } }
    return;
  }
  try { await (screen.orientation as LockOrientation)?.lock?.("landscape"); } catch { /* not every browser can lock */ }
}

export function Film() {
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [rotateHint, setRotateHint] = useState(false);

  // pause when it scrolls well out of view; release the landscape lock on leaving full screen
  useEffect(() => {
    const v = vid.current; if (!v) return;
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting && !document.fullscreenElement && !v.paused) v.pause(); }, { threshold: 0.15 });
    io.observe(v);
    const onFs = () => { if (!document.fullscreenElement) { try { (screen.orientation as LockOrientation)?.unlock?.(); } catch { /* fine */ } } };
    document.addEventListener("fullscreenchange", onFs);
    const mq = window.matchMedia("(orientation: portrait)");
    const onRot = () => setRotateHint(isCoarse && mq.matches);
    onRot(); mq.addEventListener?.("change", onRot);
    return () => { io.disconnect(); document.removeEventListener("fullscreenchange", onFs); mq.removeEventListener?.("change", onRot); };
  }, []);

  const play = async () => {
    const v = vid.current as FsVideo | null; if (!v) return;
    setStarted(true);
    v.controls = true;
    if (portraitPhone()) await goFullscreenLandscape(box.current, v);
    try { await v.play(); } catch { /* the controls are there to press play */ }
  };

  return (
    <Section id="film" stream={1} className="z-10 -mt-[40svh] md:-mt-[50svh]">
      <div className="wrap">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <Eyebrow>The product video</Eyebrow>
            <Headline lead="Meet Selika," accent="in under two minutes." className="h-section mt-3 text-[clamp(1.9rem,4.4vw,4.2rem)]" />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-[30rem] text-[0.95rem] leading-relaxed text-mute lg:text-right">Why we are building it, how it guides you on your own reflection, and what Selika Dev opens up. Sound on.</p>
          </Reveal>
        </div>
        <Reveal delay={0.08} className="mt-8">
          <div className="sg-glass mx-auto w-full max-w-[calc((100svh-15rem)*16/9)] rounded-[2rem] p-2 sm:p-3 lg:min-w-[60rem]">
            <div ref={box} className="film-box relative aspect-video w-full overflow-hidden rounded-[1.5rem] bg-night">
              <video ref={vid} className="absolute inset-0 h-full w-full object-contain" src={SRC} poster={POSTER}
                preload="metadata" playsInline aria-label="Selika product video, 1 minute 54 seconds" />
              {!started && (
                <button type="button" onClick={play} aria-label="Watch the product video"
                  className="group absolute inset-0 flex items-end justify-start bg-[linear-gradient(to_top,rgba(5,6,10,.75),rgba(5,6,10,0)_45%)] p-4 sm:p-7">
                  <span className="flex items-center gap-3 sm:gap-4">
                    <span className="lg-glass lg-glass-dark relative grid h-14 w-14 place-items-center overflow-hidden rounded-full text-ink transition-transform duration-500 ease-out-expo group-hover:scale-110 sm:h-20 sm:w-20">
                      <span aria-hidden className="lg-spec" />
                      <svg width="26" height="26" viewBox="0 0 24 24" className="relative ml-1"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>
                    </span>
                    <span className="lg-glass lg-glass-dark relative flex h-9 items-center gap-2 overflow-hidden whitespace-nowrap rounded-full px-3.5 text-[0.8rem] font-medium text-ink sm:h-11 sm:px-5 sm:text-[0.95rem]">
                      <span aria-hidden className="lg-spec" />
                      <span className="relative">Watch the product video</span>
                      <span className="relative text-mute">1:54</span>
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </Reveal>
        {rotateHint && (
          <p className="mt-4 flex items-center gap-2 text-[0.85rem] text-mute">
            <Icon name="RotateCcw" size={15} /> Made for landscape: it opens full screen. Turn your phone sideways to watch.
          </p>
        )}
      </div>
    </Section>
  );
}
