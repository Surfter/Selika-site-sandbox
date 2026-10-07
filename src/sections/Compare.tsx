import { COMPARE } from "../lib/content";
import { Icon } from "../lib/icons";
import { Headline, Reveal, Section } from "../components/ui";

/* One table instead of five boxes: what is already on sale against what Selika is designed to do.
   Every competitor cell comes from the product's own page or a UK retailer listing (see the
   competitor evidence note); "Not listed" means the pages we checked do not mention it. */
type Cell = { ok: boolean | null; t: string };
const COLS = ["Beautifect Glow Mirror", "simplehuman Sensor Mirror Pro", "MIRARI Smart Makeup Mirror", "Selika"];
const SHORT = ["Beautifect", "simplehuman", "MIRARI"];
const ROWS: { k: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  { k: "Light set for where you're going", cells: [{ ok: true, t: "Evening, daylight, bright sun" }, { ok: true, t: "Light captured from real places, since 2016" }, { ok: true, t: "3500K to 6000K modes" }, { ok: true, t: "2700K to 6500K, high colour rendering" }] },
  { k: "Try a look before you commit", cells: [{ ok: null, t: "Not listed" }, { ok: null, t: "Not listed" }, { ok: true, t: "AR try-on on an 8-inch touchscreen" }, { ok: true, t: "On your own reflection" }] },
  { k: "Step-by-step makeup guidance", cells: [{ ok: null, t: "Not listed" }, { ok: null, t: "Not listed" }, { ok: null, t: "Not listed" }, { ok: true, t: "Drawn on your reflection, by voice" }] },
  { k: "Attaches to the mirror you own", cells: [{ ok: false, t: "Standalone mirror" }, { ok: false, t: "Standalone mirror" }, { ok: false, t: "Tabletop unit" }, { ok: true, t: "Clamp or adhesive mount" }] },
  { k: "Open to developers", cells: [{ ok: null, t: "Not listed" }, { ok: null, t: "Not listed" }, { ok: null, t: "Not listed" }, { ok: true, t: "Selika Dev: modules, models, permissions" }] },
];

function Mark({ ok, sel }: { ok: boolean | null; sel: boolean }) {
  if (ok) return <span className={`grid h-5 w-5 flex-none place-items-center rounded-full ${sel ? "cmp-pop bg-accent text-white" : "bg-white/12 text-ink/85"}`}><Icon name="Check" size={11} stroke={2.6} /></span>;
  return <span className="grid h-5 w-5 flex-none place-items-center rounded-full border border-white/12 text-dim"><Icon name={ok === false ? "X" : "Minus"} size={10} stroke={2.2} /></span>;
}

export function Compare() {
  return (
    <Section stream={-1}>
      <div className="wrap">
        <Reveal>
          <Headline lead={COMPARE.title[0]} accent={COMPARE.title[1]} className="h-section text-[clamp(1.9rem,4vw,3.9rem)]" />
          <p className="body-lg mt-5 max-w-[44rem]">{COMPARE.body}</p>
        </Reveal>
        <Reveal className="mt-10">
          <div className="sg-glass overflow-hidden rounded-[2rem]">
            {/* phones: one card per question, Selika's answer first, the three others beneath */}
            <div className="divide-y divide-white/[0.08] md:hidden">
              {ROWS.map((r) => (
                <div key={r.k} className="p-5">
                  <h3 className="text-[1rem] font-medium leading-snug text-ink/95">{r.k}</h3>
                  <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-white/[0.06] p-3 ring-1 ring-accent2/35">
                    <Mark ok={r.cells[3].ok} sel />
                    <div><div className="text-[0.74rem] font-medium text-accent2">Selika, designed to</div><div className="mt-0.5 text-[0.86rem] leading-snug text-ink">{r.cells[3].t}</div></div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {r.cells.slice(0, 3).map((c, ci) => (
                      <div key={ci} className="rounded-xl bg-white/[0.03] p-2.5">
                        <div className="text-[0.68rem] text-mute">{SHORT[ci]}</div>
                        <div className="mt-1.5 flex items-start gap-1.5"><Mark ok={c.ok} sel={false} /><span className={`text-[0.72rem] leading-snug ${c.ok ? "text-ink/80" : "text-dim"}`}>{c.t}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="cmp w-full min-w-[46rem] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="w-[22%] p-5 align-bottom font-normal"><span className="sr-only">Capability</span></th>
                    {COLS.map((c, i) => (
                      <th key={c} scope="col" className={`p-5 align-bottom text-[0.92rem] font-medium leading-snug ${i === 3 ? "cmp-sel text-ink" : "text-ink/75"}`}>
                        {i === 3 ? <span className="inline-flex items-center gap-2"><i className="dot-accent block h-2 w-2 rounded-full" />Selika<span className="font-normal text-mute">, designed to</span></span> : c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r, ri) => (
                    <tr key={r.k} className="cmp-row border-t border-white/[0.08]" style={{ ["--i" as string]: ri }}>
                      <th scope="row" className="p-5 text-[0.95rem] font-medium leading-snug text-ink/90">{r.k}</th>
                      {r.cells.map((c, ci) => (
                        <td key={ci} className={`p-5 align-top ${ci === 3 ? "cmp-sel" : ""}`}>
                          <span className="flex items-start gap-2.5">
                            <Mark ok={c.ok} sel={ci === 3} />
                            <span className={`text-[0.86rem] leading-snug ${c.ok ? (ci === 3 ? "text-ink" : "text-ink/80") : "text-dim"}`}>{c.t}</span>
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 border-t border-white/[0.08] p-5 text-[0.82rem] leading-relaxed md:grid-cols-[1fr_1.2fr] md:gap-8">
              <p className="text-ink/80">{COMPARE.moat}</p>
              <p className="text-dim">From each product's own page or UK retailer listings, checked 30 September and 2 October 2026. Not listed means the pages we checked don't mention it. Selika's column is what it is designed to do.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
