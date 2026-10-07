import { MotionDriver } from "./lib/motion";
import { Background } from "./gl/Background";
import { GlassFilters } from "./components/ui";
import { Preloader } from "./components/Preloader";
import { Nav } from "./components/Nav";
import { Hero } from "./sections/Hero";
import { OnlyMirror, Problem } from "./sections/Problem";
import { DemoSection } from "./sections/demo/DemoSection";
import { TwoProducts } from "./sections/TwoProducts";
import { Compare } from "./sections/Compare";
import { Inside } from "./sections/Inside";
import { Privacy } from "./sections/Privacy";
import { About, Footer, Roadmap } from "./sections/Roadmap";

export default function App() {
  return (
    <>
      <MotionDriver />
      <GlassFilters />
      <Background />
      <Preloader />
      <a href="#demo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-night">Skip to the demo</a>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <DemoSection />
        <OnlyMirror />
        <TwoProducts />
        <Compare />
        <Inside />
        <Privacy />
        <Roadmap />
        <About />
      </main>
      <Footer />
    </>
  );
}
