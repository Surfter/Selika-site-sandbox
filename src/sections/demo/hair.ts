import * as THREE from "three";

/* Hair for ICT's bald head, drawn in the skin shader. The hairline is a curve around the head in its own
   space (metres; x across, y up, z forward), by the angle from the front: just above the forehead, down at
   the temples into short sideburns in front of the ears, arching over the ears and dropping to the nape.
   Above it the skin turns into dark hair combed straight back, lifted a little off the scalp, with strand
   streaks and a glossier finish. */

const LINE = /* glsl */ `
float hairLineY(float th) {
  float y = 0.100;
  y = mix(y, 0.097, smoothstep(0.25, 0.50, th));
  y = mix(y, 0.066, smoothstep(0.55, 0.95, th));
  y = mix(y, 0.058, smoothstep(0.95, 1.12, th));
  y = mix(y, 0.024, smoothstep(1.12, 1.24, th));
  y = mix(y, 0.050, smoothstep(1.38, 1.46, th));
  y = mix(y, 0.000, smoothstep(1.78, 1.98, th));
  y = mix(y, -0.045, smoothstep(2.10, 2.60, th));
  return y;
}
`;

const NOISE = /* glsl */ `
float hh1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
float hn1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hh1(i), hh1(i + 1.0), f); }
`;

export function applyHair(mat: THREE.MeshPhysicalMaterial, headM: THREE.Matrix4, color = "#1a120e") {
  const scale = new THREE.Vector3().setFromMatrixScale(headM).x || 1;
  const uniforms = { uHeadM: { value: headM }, uHeadS: { value: scale }, uHairCol: { value: new THREE.Color(color) } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nuniform mat4 uHeadM;\nuniform float uHeadS;\nvarying vec3 vHead;\n" + LINE)
      .replace("#include <morphtarget_vertex>", `#include <morphtarget_vertex>
  vHead = (uHeadM * vec4(transformed, 1.0)).xyz;
  float hLift = smoothstep(-0.001, 0.006, vHead.y - hairLineY(abs(atan(vHead.x, vHead.z))));
  transformed += normalize(objectNormal) * (0.0028 * hLift / uHeadS);`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHead;\nuniform vec3 uHairCol;\n" + NOISE + LINE)
      .replace("#include <map_fragment>", `#include <map_fragment>
  float hTh = abs(atan(vHead.x, vHead.z));
  float hA = atan(vHead.x, vHead.y - 0.02);
  float hS = hn1(hA * 170.0 + hn1(vHead.z * 55.0) * 2.5) * 0.5 + hn1(hA * 430.0 + 7.1) * 0.3 + hn1(hA * 950.0 + 3.3) * 0.2;
  float hFine = hn1(hA * 1300.0 + 1.7) * 0.6 + hn1(hA * 2900.0 + 5.3) * 0.4;
  float hEdge = vHead.y - hairLineY(hTh) + (hn1(hTh * 24.0) - 0.5) * 0.002 + (hFine - 0.5) * 0.0022;
  float hairM = smoothstep(-0.003, 0.005, hEdge);
  vec3 hairC = uHairCol * (0.5 + 1.0 * hS);
  hairC = mix(diffuseColor.rgb * 0.55, hairC, smoothstep(0.0, 0.006, hEdge));
  diffuseColor.rgb = mix(diffuseColor.rgb, hairC, hairM);`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.32 + 0.18 * (1.0 - hS), hairM);")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance *= 1.0 - hairM;")
      .replace("#include <lights_physical_fragment>", "#include <lights_physical_fragment>\n#ifdef USE_SHEEN\n  material.sheenColor *= 1.0 - hairM;\n#endif");
  };
  mat.customProgramCacheKey = () => "selika-hair";
  return uniforms;
}
