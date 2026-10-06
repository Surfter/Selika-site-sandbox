import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { frame } from "../lib/frame";
import { addTick } from "../lib/motion";
import { dprFor, getTier, reducedMotion } from "../lib/perf";
import { useSite, type Product } from "../lib/store";
import { PRODUCTS } from "../lib/content";
import { iconAtlas } from "../lib/icons";
import { HUD_H, HUD_W, drawBeautyHud, drawDevHud, loadHudFonts } from "./hud";
import { GLASS_FRAG, GLASS_VERT, HALO_FRAG, ICON_FRAG, ICON_VERT, ORB_FRAG, ORB_VERT, SPARK_FRAG, SPARK_VERT } from "./shaders";
import { MIRROR, ORBS_TALL, ORBS_WIDE, mirrorRect, orbScreen, useHeroUI } from "./heroBridge";

/* ------------------------------------------------------------------ */
const COLORS = {
  beauty: { c1: new THREE.Color(0.545, 0.486, 1.0), c2: new THREE.Color(0.69, 0.486, 1.0), deep: new THREE.Color(0.2, 0.12, 0.52), led: new THREE.Color(0.78, 0.7, 1.0) },
  dev: { c1: new THREE.Color(0.302, 0.553, 1.0), c2: new THREE.Color(0.557, 0.773, 1.0), deep: new THREE.Color(0.05, 0.16, 0.47), led: new THREE.Color(0.66, 0.84, 1.0) },
};
/** Adds light without touching the canvas alpha, so glows composite over the page's background shader. */
function glowBlend<T extends THREE.Material>(m: T): T {
  m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation;
  m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneFactor; m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor;
  m.transparent = true; m.depthWrite = false; return m;
}
const mixC = (a: THREE.Color, b: THREE.Color, t: number, out: THREE.Color) => out.copy(a).lerp(b, t);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

function roundedRect<T extends THREE.Path>(w: number, h: number, r: number, path: T): T {
  const x = -w / 2, y = -h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y); path.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  path.lineTo(x + w, y + h - r); path.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  path.lineTo(x + r, y + h); path.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  path.lineTo(x, y + r); path.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return path;
}
function normaliseUV(g: THREE.BufferGeometry) {
  g.computeBoundingBox(); const b = g.boundingBox!; const pos = g.attributes.position; const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) { uv[i * 2] = (pos.getX(i) - b.min.x) / (b.max.x - b.min.x); uv[i * 2 + 1] = (pos.getY(i) - b.min.y) / (b.max.y - b.min.y); }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); return g;
}

/* ------------------------------------------------------------------ */
/** Renders only while the hero is visible, driven by the shared ticker. */
function Driver({ active }: { active: boolean }) {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    if (!active) return;
    return addTick((t) => advance(t));
  }, [active, advance]);
  return null;
}

/* ------------------------------------------------------------------ */
function useHudTextures() {
  const [tex, setTex] = useState<{ beauty: THREE.CanvasTexture; dev: THREE.CanvasTexture } | null>(null);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    let alive = true;
    (async () => {
      await loadHudFonts();
      const make = (draw: (c: CanvasRenderingContext2D) => void) => {
        const c = document.createElement("canvas"); c.width = HUD_W; c.height = HUD_H;
        draw(c.getContext("2d")!);
        const t = new THREE.CanvasTexture(c);
        t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy()); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
        return t;
      };
      const out = { beauty: make(drawBeautyHud), dev: make(drawDevHud) };
      if (alive) setTex(out);
    })();
    return () => { alive = false; };
  }, [gl]);
  return tex;
}

/* ------------------------------------------------------------------ */
function Mirror({ which, spin }: { which: React.MutableRefObject<{ v: number; smear: number; spin: number }>; spin: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const hud = useHudTextures();
  const { w, h, bezel, corner, depth, bevel } = MIRROR;

  const geo = useMemo(() => {
    const body = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, h - bevel * 2, corner - bevel, new THREE.Shape()), { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 40 });
    body.translate(0, 0, -depth / 2);
    const gw = w - bezel * 2, gh = h - bezel * 2;
    const glass = normaliseUV(new THREE.ShapeGeometry(roundedRect(gw, gh, corner - bezel * 0.7, new THREE.Shape()), 40));
    const ringShape = roundedRect(gw + 0.016, gh + 0.016, corner - bezel * 0.7 + 0.008, new THREE.Shape());
    ringShape.holes.push(roundedRect(gw + 0.004, gh + 0.004, corner - bezel * 0.7 + 0.002, new THREE.Path()));
    const ring = new THREE.ShapeGeometry(ringShape, 40);
    return { body, glass, ring, front: depth / 2 + bevel };
  }, [w, h, bezel, corner, depth, bevel]);

  const glassMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG,
    uniforms: { uHud0: { value: null }, uHud1: { value: null }, uWhich: { value: 0 }, uSmear: { value: 0 }, uTime: { value: 0 }, uReveal: { value: 0 }, uMouse: { value: new THREE.Vector2() }, uC1: { value: new THREE.Color() }, uC2: { value: new THREE.Color() } },
  }), []);
  const ledMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1), toneMapped: false }), []);
  const haloMat = useMemo(() => glowBlend(new THREE.ShaderMaterial({
    vertexShader: GLASS_VERT, fragmentShader: HALO_FRAG,
    uniforms: { uColor: { value: new THREE.Color() }, uStrength: { value: 0 }, uHalf: { value: new THREE.Vector2(w / 2 / 4.2, h / 2 / 4.2) }, uRadius: { value: corner / 4.2 } },
  })), [w, h, corner]);
  const bodyMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#454a60"), metalness: 0.72, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.18, envMapIntensity: 1.5 }), []);

  useEffect(() => { if (hud) { glassMat.uniforms.uHud0.value = hud.beauty; glassMat.uniforms.uHud1.value = hud.dev; } }, [hud, glassMat]);

  const reveal = useRef({ v: 0 });
  const entered = useSite((s) => s.entered);
  useEffect(() => { if (entered && hud) gsap.to(reveal.current, { v: 1, duration: reducedMotion ? 0.01 : 2.2, ease: "power2.out", delay: 0.25 }); }, [entered, hud]);

  const tmp = useMemo(() => new THREE.Color(), []);
  const cornerV = useMemo(() => new THREE.Vector3(), []);
  const rot = useRef({ x: 0, y: 0 });
  useFrame((state, dt) => {
    const g = group.current; if (!g) return;
    const t = state.clock.elapsedTime;
    const p = frame.pointer; const dive = ease(smooth(0.05, 0.62, frame.hero));
    const aspect = state.size.width / Math.max(1, state.size.height);
    // the pose: a three-quarter turn toward the text, following the cursor, settling square-on for the dive
    const ty = (-0.3 + p.nx * 0.3) * (1 - dive);
    const tx = (0.06 - p.ny * 0.16) * (1 - dive);
    const k = 1 - Math.exp(-dt * 4);
    rot.current.y += (ty - rot.current.y) * k; rot.current.x += (tx - rot.current.x) * k;
    g.rotation.set(rot.current.x, rot.current.y + spin.current, (-0.05 + Math.sin(t * 0.4) * 0.012) * (1 - dive));
    const xOff = aspect > 1.15 && state.size.width >= 1024 ? 0.2 : 0;
    g.position.set(xOff * (1 - dive) + p.nx * 0.05 * (1 - dive), Math.sin(t * 0.6) * 0.022 * (1 - dive) + (aspect < 1 ? 0.04 : 0) * (1 - dive), 0);

    const wv = frame.world;
    const u = glassMat.uniforms;
    u.uTime.value = t; u.uReveal.value = reveal.current.v; u.uWhich.value = which.current.v; u.uSmear.value = which.current.smear;
    (u.uMouse.value as THREE.Vector2).set(p.nx, p.ny);
    mixC(COLORS.beauty.c1, COLORS.dev.c1, wv, u.uC1.value); mixC(COLORS.beauty.c2, COLORS.dev.c2, wv, u.uC2.value);
    mixC(COLORS.beauty.led, COLORS.dev.led, wv, tmp);
    const pulse = 0.85 + 0.15 * Math.sin(t * 1.6);
    ledMat.color.copy(tmp).multiplyScalar((0.55 + 0.75 * reveal.current.v) * pulse);
    haloMat.uniforms.uColor.value.copy(tmp);
    haloMat.uniforms.uStrength.value = (0.22 + 0.28 * reveal.current.v) * pulse * (1 - dive * 0.6);
    // the glass's footprint on screen
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([cx, cy], n) => {
      cornerV.set((cx * w) / 2, (cy * h) / 2, 0).applyMatrix4(g.matrixWorld).project(state.camera);
      const sx = (cornerV.x * 0.5 + 0.5) * state.size.width, sy = (-cornerV.y * 0.5 + 0.5) * state.size.height;
      mirrorRect.q[n * 2] = sx; mirrorRect.q[n * 2 + 1] = sy;
      x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
    });
    mirrorRect.x0 = x0; mirrorRect.y0 = y0; mirrorRect.x1 = x1; mirrorRect.y1 = y1;
  });

  return (
    <group ref={group}>
      <mesh position={[0, 0, -0.3]} material={haloMat} renderOrder={-1}><planeGeometry args={[4.2, 4.2]} /></mesh>
      <mesh geometry={geo.body} material={bodyMat} />
      <mesh geometry={geo.ring} material={ledMat} position={[0, 0, geo.front + 0.0008]} />
      <mesh geometry={geo.glass} material={glassMat} position={[0, 0, geo.front + 0.0015]} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
type Orb = {
  i: number; product: Product; icon: string; base: THREE.Vector3; r: number;
  pos: THREE.Vector3; vel: THREE.Vector3; phase: number;
  appear: number; pop: number; hover: number;
};

const MAX_SPARKS = 220;

function Orbs({ entered }: { entered: boolean }) {
  const { camera, size } = useThree();
  const product = useSite((s) => s.product);
  const setHovered = useHeroUI((s) => s.setHovered);
  const setSelected = useHeroUI((s) => s.setSelected);
  const hovered = useHeroUI((s) => s.hovered);
  const [atlas, setAtlas] = useState<{ tex: THREE.CanvasTexture; cols: number; rows: number } | null>(null);
  const tall = size.width / Math.max(1, size.height) < 1;
  const narrow = size.width < 640;

  const icons = useMemo(() => [...PRODUCTS.beauty.features, ...PRODUCTS.dev.features].map((f) => f.icon), []);
  useEffect(() => {
    let alive = true;
    iconAtlas(icons, 128, "#ffffff", 1.4).then(({ canvas, cols, rows }) => {
      if (!alive) return; const tex = new THREE.CanvasTexture(canvas); tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
      setAtlas({ tex, cols, rows });
    });
    return () => { alive = false; };
  }, [icons]);

  const orbs = useMemo<Orb[]>(() => {
    const out: Orb[] = [];
    (["beauty", "dev"] as Product[]).forEach((pr, pi) => PRODUCTS[pr].features.forEach((f, k) => {
      out.push({ i: pi * 7 + k, product: pr, icon: f.icon, base: new THREE.Vector3(), r: 0.12, pos: new THREE.Vector3(), vel: new THREE.Vector3(), phase: Math.random() * 6.28, appear: 0, pop: 0, hover: 0 });
    }));
    return out;
  }, []);
  if (import.meta.env.DEV) Object.assign(window, { __orbs: orbs, __site: useSite, __gsap: gsap });
  // layout follows the viewport shape
  useEffect(() => {
    const L = tall ? ORBS_TALL : ORBS_WIDE;
    const scale = narrow ? 0.92 : 1;
    orbs.forEach((o) => { const l = L[o.i % 7]; o.base.set(l.p[0] * scale, l.p[1] * scale, l.p[2]); o.r = l.r * (narrow ? 1.12 : 1); if (o.appear === 0) o.pos.set(0, 0, 0); });
  }, [tall, narrow, orbs]);

  const mats = useMemo(() => orbs.map(() => new THREE.ShaderMaterial({ vertexShader: ORB_VERT, fragmentShader: ORB_FRAG, transparent: true, depthWrite: false, uniforms: { uColor: { value: new THREE.Color() }, uDeep: { value: new THREE.Color() }, uHover: { value: 0 }, uAlpha: { value: 0 } } })), [orbs]);
  const iconMats = useMemo(() => orbs.map(() => glowBlend(new THREE.ShaderMaterial({ vertexShader: ICON_VERT, fragmentShader: ICON_FRAG, uniforms: { uAtlas: { value: null }, uCell: { value: new THREE.Vector4() }, uColor: { value: new THREE.Color() }, uAlpha: { value: 0 } } }))), [orbs]);
  useEffect(() => {
    if (!atlas) return;
    iconMats.forEach((m, i) => { m.uniforms.uAtlas.value = atlas.tex; const c = i % atlas.cols, r = Math.floor(i / atlas.cols); m.uniforms.uCell.value.set(c / atlas.cols, 1 - (r + 1) / atlas.rows, 1 / atlas.cols, 1 / atlas.rows); });
  }, [atlas, iconMats]);

  const groups = useRef<(THREE.Group | null)[]>([]);
  const icons3d = useRef<(THREE.Mesh | null)[]>([]);

  /* sparks for the pop */
  const sparks = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 3), 3));
    g.setAttribute("aLife", new THREE.BufferAttribute(new Float32Array(MAX_SPARKS).fill(1), 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(MAX_SPARKS), 1));
    const vel = new Float32Array(MAX_SPARKS * 3);
    const mat = glowBlend(new THREE.ShaderMaterial({ vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG, uniforms: { uColor: { value: new THREE.Color(0.8, 0.75, 1) } } }));
    return { g, mat, vel, next: 0 };
  }, []);
  const burst = (at: THREE.Vector3, n: number) => {
    const P = sparks.g.attributes.position as THREE.BufferAttribute, Lf = sparks.g.attributes.aLife as THREE.BufferAttribute, S = sparks.g.attributes.aSize as THREE.BufferAttribute;
    for (let k = 0; k < n; k++) {
      const j = sparks.next; sparks.next = (sparks.next + 1) % MAX_SPARKS;
      P.setXYZ(j, at.x, at.y, at.z); Lf.setX(j, 0); S.setX(j, 5 + Math.random() * 9);
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.6 + Math.random() * 1.4);
      sparks.vel.set([d.x, d.y, d.z], j * 3);
    }
  };

  /* entrance and product switches */
  const first = useRef(true);
  useEffect(() => {
    if (!entered) return;
    const show = orbs.filter((o) => o.product === product), hide = orbs.filter((o) => o.product !== product && o.appear > 0.01);
    const delayIn = first.current ? 0.9 : 0.55;
    first.current = false;
    hide.forEach((o, k) => {
      gsap.to(o, { pop: 1, duration: 0.26, ease: "power2.in", delay: k * 0.035, overwrite: true, onComplete: () => { if (!reducedMotion) burst(o.pos.clone(), 16); o.appear = 0; o.pop = 0; o.pos.set(0, 0, 0); o.vel.set(0, 0, 0); } });
    });
    show.forEach((o, k) => {
      o.pop = 0; o.pos.set(0, 0, 0);
      gsap.to(o, { appear: 1, duration: reducedMotion ? 0.01 : 1.1, ease: "elastic.out(1, 0.55)", delay: reducedMotion ? 0 : delayIn + k * 0.07, overwrite: true });
    });
    setSelected(-1); setHovered(-1);
  }, [product, entered]); // eslint-disable-line react-hooks/exhaustive-deps

  const v3 = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const proj = useMemo(() => new THREE.Vector3(), []);
  const qInv = useMemo(() => new THREE.Quaternion(), []);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime; const p = frame.pointer; const wv = frame.world;
    const dive = smooth(0.08, 0.7, frame.hero);
    const aspect = size.width / Math.max(1, size.height);
    const xOff = aspect > 1.15 && size.width >= 1024 ? 0.2 : 0;
    const k = 30, c = 7.5;
    orbs.forEach((o, idx) => {
      const g = groups.current[idx]; if (!g) return;
      // home: layout + a slow float, flown out from the mirror as the orb appears
      const fly = o.appear;
      tgt.copy(o.base).multiplyScalar(fly * (1 + dive * 2.4));
      tgt.x += xOff * (1 - dive) + Math.sin(t * 0.7 + o.phase) * 0.035; tgt.y += Math.cos(t * 0.55 + o.phase * 1.3) * 0.045; tgt.z += Math.sin(t * 0.4 + o.phase) * 0.03;
      // parallax: nearer orbs move more with the cursor
      const depth = 0.5 + o.base.z; tgt.x += p.nx * 0.12 * depth; tgt.y += p.ny * 0.08 * depth;
      // the cursor pushes orbs away on screen
      if (p.seen && !p.touch && fly > 0.5) {
        proj.copy(o.pos).project(camera);
        const dx = (proj.x - p.nx) * aspect, dy = proj.y - p.ny; const d = Math.hypot(dx, dy); const R = 0.32;
        if (d < R && d > 1e-4) { const f = (1 - d / R) ** 2 * 0.9; tgt.x += (dx / d) * f; tgt.y += (dy / d) * f; }
      }
      // spring: semi-implicit Euler in small fixed steps, so long frames can't blow it up
      let rem = Math.min(dt, 0.25); // catch up on slow frames instead of slowing the simulation down
      while (rem > 1e-5) {
        const h = Math.min(rem, 1 / 120); rem -= h;
        v3.copy(tgt).sub(o.pos).multiplyScalar(k).addScaledVector(o.vel, -c);
        o.vel.addScaledVector(v3, h); o.pos.addScaledVector(o.vel, h);
      }
      if (!Number.isFinite(o.pos.x + o.pos.y + o.pos.z)) { o.pos.copy(tgt); o.vel.set(0, 0, 0); }
      g.position.copy(o.pos);
      const hov = hovered === o.i ? 1 : 0; o.hover += (hov - o.hover) * (1 - Math.exp(-dt * 10));
      const s = o.r * Math.max(0, o.appear) * (1 + o.pop * 0.3 + o.hover * 0.14);
      g.scale.setScalar(Math.max(s, 1e-4));
      g.rotation.y = t * 0.2 + o.phase;
      const alpha = Math.min(1, o.appear) * (1 - o.pop) * (1 - smooth(0.25, 0.62, frame.hero));
      const m = mats[idx]; mixC(COLORS.beauty.c2, COLORS.dev.c2, wv, m.uniforms.uColor.value); mixC(COLORS.beauty.deep, COLORS.dev.deep, wv, m.uniforms.uDeep.value);
      m.uniforms.uHover.value = o.hover; m.uniforms.uAlpha.value = alpha;
      const im = iconMats[idx]; im.uniforms.uAlpha.value = alpha * (0.85 + o.hover * 0.15); mixC(COLORS.beauty.c2, COLORS.dev.c2, wv, im.uniforms.uColor.value);
      const icon = icons3d.current[idx]; if (icon) icon.quaternion.copy(camera.quaternion).premultiply(qInv.copy(g.quaternion).invert());
      // where the DOM should put this orb's label
      proj.copy(o.pos).project(camera);
      const sc = orbScreen[o.i]; sc.x = (proj.x * 0.5 + 0.5) * size.width; sc.y = (-proj.y * 0.5 + 0.5) * size.height;
      const dist = camera.position.distanceTo(o.pos); sc.r = (s / (dist * Math.tan((30 * Math.PI) / 360))) * size.height * 0.5; sc.alpha = alpha; sc.z = o.pos.z;
    });
    // sparks
    const P = sparks.g.attributes.position as THREE.BufferAttribute, Lf = sparks.g.attributes.aLife as THREE.BufferAttribute;
    let live = false;
    for (let j = 0; j < MAX_SPARKS; j++) {
      const l = Lf.getX(j); if (l >= 1) continue; live = true;
      Lf.setX(j, Math.min(1, l + dt * 1.25));
      P.setXYZ(j, P.getX(j) + sparks.vel[j * 3] * dt, P.getY(j) + sparks.vel[j * 3 + 1] * dt, P.getZ(j) + sparks.vel[j * 3 + 2] * dt);
      sparks.vel[j * 3] *= 0.96; sparks.vel[j * 3 + 1] *= 0.96; sparks.vel[j * 3 + 2] *= 0.96;
    }
    if (live) { P.needsUpdate = true; Lf.needsUpdate = true; }
    mixC(COLORS.beauty.c2, COLORS.dev.c2, wv, sparks.mat.uniforms.uColor.value);
  });

  return (
    <>
      {orbs.map((o, idx) => (
        <group key={o.i} ref={(g) => { groups.current[idx] = g; }}>
          <mesh material={mats[idx]}
            onPointerOver={(e) => { e.stopPropagation(); if (o.product === useSite.getState().product && o.appear > 0.5) { setHovered(o.i); document.body.style.cursor = "pointer"; } }}
            onPointerOut={() => { if (useHeroUI.getState().hovered === o.i) setHovered(-1); document.body.style.cursor = ""; }}
            onClick={(e) => { e.stopPropagation(); if (o.product === useSite.getState().product) setSelected(o.i); }}>
            <sphereGeometry args={[1, 48, 32]} />
          </mesh>
          <mesh ref={(m) => { icons3d.current[idx] = m; }} material={iconMats[idx]} renderOrder={2}><planeGeometry args={[1.05, 1.05]} /></mesh>
        </group>
      ))}
      <points geometry={sparks.g} material={sparks.mat} frustumCulled={false} />
    </>
  );
}

/* ------------------------------------------------------------------ */
function Rig() {
  const { camera, size } = useThree();
  const fit = useRef({ z: 0, y: 0 });
  useFrame((_, dt) => {
    const aspect = size.width / Math.max(1, size.height);
    let z0 = aspect >= 1.15 ? 4.35 : aspect >= 0.8 ? 5.2 : Math.min(8.4, 3.55 / aspect), y0 = 0;
    // below the desktop layout the copy sits on top and the switcher at the bottom:
    // fit the mirror and its orbs into the band between them
    const box = frame.heroBox;
    if (size.width < 1024 && box.bottom - box.top > 160) {
      const top = box.top + 6, bottom = box.bottom - 6, tall = aspect < 1;
      const ppu = Math.min((bottom - top) / (tall ? 2.2 : 2.0), size.width / (tall ? 2.05 : 2.4)); // px per world unit at the mirror
      z0 = size.height / ppu / (2 * Math.tan((15 * Math.PI) / 180));
      y0 = ((top + bottom) / 2 - size.height / 2) / ppu;
    }
    const f = fit.current; const k = f.z === 0 ? 1 : 1 - Math.exp(-dt * 5);
    f.z += (z0 - f.z) * k; f.y += (y0 - f.y) * k;
    const d = ease(smooth(0.1, 0.92, frame.hero));
    const cam = camera as THREE.PerspectiveCamera;
    const cy = f.y * (1 - d);
    cam.position.set(0, cy, f.z + (0.36 - f.z) * d);
    cam.lookAt(0, cy, 0);
  });
  return null;
}

/* ------------------------------------------------------------------ */
function Spinner({ which, spin }: { which: React.MutableRefObject<{ v: number; smear: number; spin: number }>; spin: React.MutableRefObject<number> }) {
  const product = useSite((s) => s.product);
  const first = useRef(true);
  useEffect(() => {
    const target = product === "dev" ? 1 : 0;
    if (first.current) { first.current = false; which.current.v = target; return; }
    if (reducedMotion) { which.current.v = target; return; }
    const o = { p: 0 };
    const start = spin.current;
    let swapped = false;
    gsap.to(o, {
      p: 1, duration: 1.15, ease: "power3.inOut",
      onUpdate: () => {
        spin.current = start + o.p * Math.PI * 2;
        which.current.smear = Math.sin(o.p * Math.PI) ** 2;
        if (!swapped && o.p > 0.5) { swapped = true; which.current.v = target; }
      },
      onComplete: () => { spin.current = 0; which.current.smear = 0; },
    });
  }, [product]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/* ------------------------------------------------------------------ */
export default function HeroScene({ active }: { active: boolean }) {
  const entered = useSite((s) => s.entered);
  const which = useRef({ v: 0, smear: 0, spin: 0 });
  const spin = useRef(0);
  const tier = getTier();
  return (
    <Canvas
      frameloop="never"
      dpr={dprFor(tier)}
      gl={{ antialias: tier !== "low", alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, position: [0, 0, 4.35], near: 0.05, far: 40 }}
      style={{ position: "absolute", inset: 0 }}
      onPointerMissed={() => useHeroUI.getState().setSelected(-1)}
    >
      <Driver active={active} />
      <Rig />
      <Spinner which={which} spin={spin} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[-3, 2.5, 3]} scale={[5, 1.4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[3.5, -1, 2]} scale={[3, 1.2, 1]} color="#c7bbff" />
        <Lightformer form="rect" intensity={1.2} position={[0, 3, -3]} scale={[6, 1, 1]} color="#8ec5ff" />
        <Lightformer form="ring" intensity={0.8} position={[0, 0, -5]} scale={5} color="#4d8dff" />
      </Environment>
      <directionalLight position={[-3, 4, 5]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[4, -2, 3]} intensity={0.7} color="#c9c0ff" />
      <ambientLight intensity={0.25} />
      <Mirror which={which} spin={spin} />
      <Orbs entered={entered} />
    </Canvas>
  );
}
