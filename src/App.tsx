import { LayoutGroup } from "framer-motion";
import { Background } from "./components/ui/Background";
import { Nav } from "./components/Nav";
import { MirrorStage } from "./components/MirrorStage";
import { Pillars, Problem } from "./components/sections/Problem";
import { About, Footer, Layers, Objection, Prototype, Roadmap } from "./components/sections/Later";

export default function App() {
  return (
    <LayoutGroup>
      <Background />
      <Nav />
      <main>
        <MirrorStage />
        <Problem />
        <Pillars />
        <Layers />
        <Objection />
        <Prototype />
        <Roadmap />
        <About />
      </main>
      <Footer />
    </LayoutGroup>
  );
}
