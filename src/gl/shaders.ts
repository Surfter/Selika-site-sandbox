/* Shaders for the hero scene. Colours are designed in display space, so
   these materials skip three's tone mapping and colour conversion. */

export const GLASS_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

export const GLASS_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uHud0;
uniform sampler2D uHud1;
uniform float uWhich;
uniform float uSmear;
uniform float uTime;
uniform float uReveal;
uniform vec2 uMouse;
uniform vec3 uC1;
uniform vec3 uC2;
vec4 hudAt(vec2 uv) { return mix(texture2D(uHud0, uv), texture2D(uHud1, uv), uWhich); }
void main() {
  vec2 uv = vUv;
  vec2 rp = uv - 0.5 + uMouse * vec2(-0.07, -0.05);
  vec3 col = vec3(0.020, 0.022, 0.034);
  vec2 a = rp - vec2(-0.30, 0.30), b = rp - vec2(0.28, -0.22);
  col += uC1 * 0.24 * exp(-dot(a, a) * 7.0);
  col += uC2 * 0.15 * exp(-dot(b, b) * 6.0);
  col += vec3(0.055, 0.06, 0.08) * (1.0 - uv.y) * 0.45;
  // a sheen that slides as the mirror turns toward the cursor
  float d = (uv.x * 0.78 + uv.y * 0.62) - 0.74 - uMouse.x * 0.24 + uMouse.y * 0.08;
  col += vec3(0.95, 0.97, 1.0) * (exp(-d * d * 260.0) * 0.15 + exp(-d * d * 14.0) * 0.045);
  // the HUD, smeared while the mirror spins
  vec4 h = hudAt(uv);
  if (uSmear > 0.01) {
    vec2 o = vec2(0.03 * uSmear, 0.0);
    h = h * 0.34 + hudAt(uv + o) * 0.22 + hudAt(uv - o) * 0.22 + hudAt(uv + o * 2.0) * 0.11 + hudAt(uv - o * 2.0) * 0.11;
  }
  float scan = exp(-pow((uv.y - (1.0 - fract(uTime * 0.07))) * 22.0, 2.0));
  float rv = 1.0 - smoothstep(uReveal * 1.25 - 0.2, uReveal * 1.25, 1.0 - uv.y);
  col += h.rgb * h.a * rv * (0.94 + 0.06 * sin(uTime * 1.7)) * (1.0 + scan * 0.45);
  col += uC2 * scan * 0.05 * rv;
  // the edge of the glass: slightly darker, with a lit bevel
  vec2 e = min(uv, 1.0 - uv);
  float edge = min(e.x * 1.4, e.y);
  col *= 0.82 + 0.18 * smoothstep(0.0, 0.06, edge);
  col += vec3(1.0) * 0.07 * (1.0 - smoothstep(0.0, 0.01, edge));
  gl_FragColor = vec4(col, 1.0);
}
`;

export const HALO_FRAG = /* glsl */ `
varying vec2 vUv;
uniform vec3 uColor;
uniform float uStrength;
uniform vec2 uHalf;  // mirror half-size in the halo plane's UV units
uniform float uRadius;
float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  vec2 p = vUv - 0.5;
  float d = max(sdRound(p, uHalf, uRadius), 0.0);
  float g = exp(-d * 9.0) * 0.55 + exp(-d * 26.0) * 0.6;
  gl_FragColor = vec4(uColor * g * uStrength, 1.0);
}
`;

export const ORB_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

export const ORB_FRAG = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
uniform vec3 uColor;
uniform vec3 uDeep;
uniform float uHover;
uniform float uAlpha;
void main() {
  vec3 n = normalize(vN), v = normalize(vV);
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.4);
  vec3 inner = mix(uDeep * 0.5, uColor * 0.42, ndv * 0.8);
  vec3 rim = mix(uColor, vec3(1.0), 0.55) * fres * (1.05 + uHover * 0.8);
  vec3 L = normalize(vec3(-0.45, 0.75, 0.55));
  vec3 H = normalize(L + v);
  float spec = pow(max(dot(n, H), 0.0), 70.0);
  float spec2 = pow(max(dot(n, normalize(vec3(0.6, -0.4, 0.7) + v)), 0.0), 18.0) * 0.18;
  vec3 col = inner + rim + vec3(spec * 0.95 + spec2);
  float a = (0.16 + fres * 0.8 + spec * 0.7 + uHover * 0.08) * uAlpha;
  gl_FragColor = vec4(col, a);
}
`;

export const ICON_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

export const ICON_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uAtlas;
uniform vec4 uCell;   // x, y offset and w, h scale in atlas UV
uniform vec3 uColor;
uniform float uAlpha;
void main() {
  vec4 t = texture2D(uAtlas, uCell.xy + vUv * uCell.zw);
  gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.6) * t.a * uAlpha, t.a * uAlpha);
}
`;

export const SPARK_VERT = /* glsl */ `
attribute float aLife;
attribute float aSize;
varying float vLife;
void main() {
  vLife = aLife;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (1.0 - aLife) * (300.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const SPARK_FRAG = /* glsl */ `
varying float vLife;
uniform vec3 uColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d) * (1.0 - vLife);
  gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.5) * a, a);
}
`;
