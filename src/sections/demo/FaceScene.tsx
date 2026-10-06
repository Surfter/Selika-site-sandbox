import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { frame } from "../../lib/frame";
import { addTick } from "../../lib/motion";
import { dprFor, getTier, reducedMotion } from "../../lib/perf";
import { kelvinToRGB } from "../../lib/physics";
import { useSite } from "../../lib/store";
import { LIGHTS, STEPS, useDemo, type Region } from "./state";
import { TEX, paintEye, paintFace, paintGuides, paintLashes, regionAt } from "./makeup";
import { applyHair } from "./hair";

const MODEL = "/models/face.glb";
const EYE_CENTRES: Record<string, [number, number, number]> = { eye_L: [0.0319, 0.0362, 0.0843], eye_R: [-0.0319, 0.0362, 0.0843] };

function Driver({ active }: { active: boolean }) {
  const advance = useThree((s) => s.advance);
  useEffect(() => (active ? addTick((t) => advance(t)) : undefined), [active, advance]);
  return null;
}

/** Where the cursor is relative to the face canvas, -1..1, y up. */
function useLocalPointer() {
  const gl = useThree((s) => s.gl);
  const out = useRef({ x: 0, y: 0 });
  useFrame(() => {
    const r = gl.domElement.getBoundingClientRect();
    const p = frame.pointer;
    if (!p.seen) return;
    const x = ((p.x - (r.left + r.width / 2)) / (r.width * 0.75)), y = -((p.y - (r.top + r.height * 0.42)) / (r.height * 0.75));
    out.current.x = Math.max(-1, Math.min(1, x)); out.current.y = Math.max(-1, Math.min(1, y));
  });
  return out;
}

function Head({ onHover }: { onHover: (r: Region, at?: { x: number; y: number }) => void }) {
  const { scene } = useGLTF(MODEL, false, true);
  const gl = useThree((s) => s.gl);
  const local = useLocalPointer();
  const root = useRef<THREE.Group>(null);

  // textures: colour (skin and makeup), guides (emissive), eyes
  const tex = useMemo(() => {
    const mk = (size: number) => { const c = document.createElement("canvas"); c.width = c.height = size; const t = new THREE.CanvasTexture(c); t.flipY = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy()); return { c, t, ctx: c.getContext("2d")! }; };
    const face = mk(TEX); face.t.colorSpace = THREE.SRGBColorSpace;
    const guide = mk(getTier() === "low" ? 512 : TEX);
    const eye = mk(512); eye.t.colorSpace = THREE.SRGBColorSpace; paintEye(eye.ctx); eye.t.needsUpdate = true;
    const lash = mk(getTier() === "low" ? 256 : 512); lash.t.wrapS = THREE.RepeatWrapping; paintLashes(lash.ctx); lash.t.needsUpdate = true;
    return { face, guide, eye, lash };
  }, [gl]);

  // materials and the eye pivots
  const rig = useMemo(() => {
    const skin = new THREE.MeshPhysicalMaterial({ map: tex.face.t, emissiveMap: tex.guide.t, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 1, roughness: 0.5, sheen: 0.6, sheenRoughness: 0.55, sheenColor: new THREE.Color("#ffd6cc"), clearcoat: 0.06, clearcoatRoughness: 0.5, specularIntensity: 0.4 });
    const eye = new THREE.MeshPhysicalMaterial({ map: tex.eye.t, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04 });
    // lash cards: strands from an alpha texture, not solid strips
    const lash = new THREE.MeshStandardMaterial({ color: new THREE.Color("#140e0c"), alphaMap: tex.lash.t, roughness: 0.7, side: THREE.DoubleSide, transparent: true, depthWrite: false, alphaTest: 0.02 });
    let skinMesh: THREE.Mesh | null = null, lashMesh: THREE.Mesh | null = null;
    const pivots: Record<string, THREE.Group> = {};
    scene.traverse((o) => {
      const m = o as THREE.Mesh; if (!m.isMesh) return;
      const name = (m.name || m.parent?.name || "").toLowerCase();
      if (name.includes("skin")) { m.material = skin; skinMesh = m; }
      else if (name.includes("lash")) { m.material = lash; lashMesh = m; m.renderOrder = 2; }
      else if (name.includes("eye")) m.material = eye;
    });
    // eyes rotate about their true centres (compression moved their node origins)
    for (const key of Object.keys(EYE_CENTRES)) {
      const node = scene.getObjectByName(key); if (!node || !node.parent) continue;
      if (node.parent.userData.eyePivot) { pivots[key] = node.parent as THREE.Group; continue; }
      const pivot = new THREE.Group(); pivot.userData.eyePivot = true; pivot.position.set(...EYE_CENTRES[key]);
      node.parent.add(pivot); pivot.attach(node); pivots[key] = pivot;
    }
    // hair is drawn in the skin shader, in the head's own space (independent of how the node is quantised or posed)
    if (skinMesh) {
      scene.updateMatrixWorld(true);
      const headM = scene.matrixWorld.clone().invert().multiply((skinMesh as THREE.Mesh).matrixWorld);
      applyHair(skin, headM);
      if (import.meta.env.DEV) Object.assign(window, { __face: { scene, headM, skinMesh } });
    }
    return { skin, skinMesh: skinMesh as THREE.Mesh | null, lashMesh: lashMesh as THREE.Mesh | null, pivots };
  }, [scene, tex]);

  // morph helpers
  const setMorph = (name: string, v: number) => {
    for (const m of [rig.skinMesh, rig.lashMesh]) {
      if (!m || !m.morphTargetDictionary || !m.morphTargetInfluences) continue;
      const i = m.morphTargetDictionary[name]; if (i !== undefined) m.morphTargetInfluences[i] = v;
    }
  };

  // paint colour whenever the look, tone or step changes
  const step = useDemo((s) => s.step), look = useDemo((s) => s.look), tone = useDemo((s) => s.tone), hover = useDemo((s) => s.hover);
  const product = useSite((s) => s.product);
  useEffect(() => { paintFace(tex.face.ctx, tone, look, step); tex.face.t.needsUpdate = true; }, [tone, look, step, tex]);
  const guideState = useRef({ region: STEPS[0].region as Region, hover: null as Region, last: 0 });
  useEffect(() => { guideState.current.region = product === "beauty" ? STEPS[step].region : null; guideState.current.hover = hover; guideState.current.last = -1; }, [step, hover, product]);

  // expressions
  const expr = useRef({ blink: 0, smile: 0, brow: 0, wide: 0, pucker: 0, nextBlink: 2 });
  const smileN = useDemo((s) => s.smile);
  useEffect(() => {
    if (!smileN || reducedMotion) return;
    const e = expr.current;
    gsap.timeline().to(e, { smile: 0.7, duration: 0.45, ease: "power2.out" }).to(e, { smile: 0, duration: 0.8, ease: "power2.inOut" }, "+=1.3");
  }, [smileN]);

  const light = useDemo((s) => s.light);
  const lights = useRef<{ key: THREE.DirectionalLight | null; fill: THREE.DirectionalLight | null; rim: THREE.DirectionalLight | null }>({ key: null, fill: null, rim: null });
  const keyColor = useMemo(() => new THREE.Color(), []);
  const keyTarget = useRef({ r: 1, g: 1, b: 1, i: 2.4 });
  useEffect(() => {
    const L = LIGHTS.find((l) => l.id === light)!; const [r, g, b] = kelvinToRGB(L.k);
    gsap.to(keyTarget.current, { r: r / 255, g: g / 255, b: b / 255, i: 2.6 * L.intensity, duration: reducedMotion ? 0 : 0.9, ease: "power2.inOut" });
  }, [light]);

  const pose = useRef({ yaw: 0, pitch: 0, gx: 0, gy: 0 });
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime; const e = expr.current; const P = pose.current;
    const k = 1 - Math.exp(-dt * 3.2), ke = 1 - Math.exp(-dt * 9);
    // head turns toward the cursor, eyes lead it
    P.yaw += (local.current.x * 0.42 - P.yaw) * k; P.pitch += (-local.current.y * 0.2 - P.pitch) * k;
    P.gx += (local.current.x - P.gx) * ke; P.gy += (local.current.y - P.gy) * ke;
    if (root.current) {
      root.current.rotation.set(P.pitch + Math.sin(t * 0.7) * 0.012, P.yaw + Math.sin(t * 0.45) * 0.02, Math.sin(t * 0.5) * 0.008);
      root.current.position.y = Math.sin(t * 1.1) * 0.0012;
    }
    const ex = (P.gx - P.yaw / 0.42) * 0.45 + P.gx * 0.15, ey = P.gy * 0.32;
    for (const pv of Object.values(rig.pivots)) pv.rotation.set(-ey, ex, 0);
    // eyelids follow the gaze
    const right = Math.max(0, P.gx), left = Math.max(0, -P.gx), up = Math.max(0, P.gy), down = Math.max(0, -P.gy);
    setMorph("eyeLookOut_L", right * 0.5); setMorph("eyeLookIn_R", right * 0.5); setMorph("eyeLookOut_R", left * 0.5); setMorph("eyeLookIn_L", left * 0.5);
    setMorph("eyeLookUp_L", up * 0.45); setMorph("eyeLookUp_R", up * 0.45); setMorph("eyeLookDown_L", down * 0.6); setMorph("eyeLookDown_R", down * 0.6);
    // blink every few seconds, sometimes twice
    if (!reducedMotion && t > e.nextBlink) {
      e.nextBlink = t + 2.2 + Math.random() * 3.6;
      const tl = gsap.timeline(); tl.to(e, { blink: 1, duration: 0.07, ease: "power2.in" }).to(e, { blink: 0, duration: 0.13, ease: "power2.out" });
      if (Math.random() < 0.2) tl.to(e, { blink: 1, duration: 0.07 }).to(e, { blink: 0, duration: 0.13 });
    }
    setMorph("eyeBlink_L", e.blink); setMorph("eyeBlink_R", e.blink);
    // reactions to what the cursor is over
    const h = useDemo.getState().hover;
    e.brow += ((h === "brows" ? 0.45 : 0) - e.brow) * ke; e.wide += ((h === "eyes" ? 0.35 : 0) - e.wide) * ke; e.pucker += ((h === "lips" ? 0.28 : 0) - e.pucker) * ke;
    setMorph("browInnerUp_L", e.brow); setMorph("browInnerUp_R", e.brow); setMorph("browOuterUp_L", e.brow * 0.8); setMorph("browOuterUp_R", e.brow * 0.8);
    setMorph("eyeWide_L", e.wide); setMorph("eyeWide_R", e.wide); setMorph("mouthPucker", e.pucker);
    setMorph("mouthSmile_L", e.smile); setMorph("mouthSmile_R", e.smile); setMorph("cheekSquint_L", e.smile * 0.6); setMorph("cheekSquint_R", e.smile * 0.6);
    setMorph("eyeSquint_L", e.smile * 0.45); setMorph("eyeSquint_R", e.smile * 0.45);
    // the guidance glows and its dashes travel
    const g = guideState.current;
    const fps = getTier() === "low" ? 8 : 14;
    if (g.region || g.hover) {
      if (t - g.last > 1 / fps) { paintGuides(tex.guide.ctx, g.region, g.hover, product === "beauty" ? "#c7b6ff" : "#9fd0ff", t); tex.guide.t.needsUpdate = true; g.last = t; }
    } else if (g.last !== -2) { paintGuides(tex.guide.ctx, null, null, "#000"); tex.guide.t.needsUpdate = true; g.last = -2; }
    rig.skin.emissiveIntensity = 0.75 + 0.35 * Math.sin(t * 2.4);
    // light colour
    const kt = keyTarget.current; keyColor.setRGB(kt.r, kt.g, kt.b);
    if (lights.current.key) { lights.current.key.color.copy(keyColor); lights.current.key.intensity = kt.i; }
    if (lights.current.fill) lights.current.fill.color.copy(keyColor).lerp(new THREE.Color(1, 1, 1), 0.5);
  });

  const onMove = (ev: ThreeEvent<PointerEvent>) => {
    ev.stopPropagation();
    const uv = ev.uv; if (!uv) return;
    const r = regionAt(uv.x, uv.y);
    if (r !== useDemo.getState().hover) onHover(r, { x: ev.nativeEvent.clientX, y: ev.nativeEvent.clientY });
  };

  return (
    <>
      <directionalLight ref={(l) => { lights.current.key = l; }} position={[-0.6, 0.55, 0.9]} intensity={2.4} />
      <directionalLight ref={(l) => { lights.current.fill = l; }} position={[0.8, 0.1, 0.6]} intensity={0.55} />
      <directionalLight ref={(l) => { lights.current.rim = l; }} position={[0.2, 0.8, -1]} intensity={1.6} color={product === "beauty" ? "#b7a6ff" : "#8ec5ff"} />
      <ambientLight intensity={0.18} />
      <group ref={root} position={[0, -0.005, 0]}>
        <primitive object={scene} onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => onHover(null)} />
      </group>
    </>
  );
}

export default function FaceScene({ active, onHover }: { active: boolean; onHover: (r: Region, at?: { x: number; y: number }) => void }) {
  const tier = getTier();
  return (
    <Canvas frameloop="never" dpr={dprFor(tier)} gl={{ antialias: tier !== "low", alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 21, position: [0, 0.024, 0.76], rotation: [0, 0, 0], near: 0.01, far: 10 }} style={{ position: "absolute", inset: 0 }}>
      <Driver active={active} />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={1.6} position={[-1.5, 1, 2]} scale={[2, 1, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={0.8} position={[1.5, 0, 1.5]} scale={[1.5, 1, 1]} color="#e8e4ff" />
      </Environment>
      <Head onHover={onHover} />
    </Canvas>
  );
}

useGLTF.preload(MODEL, false, true);
