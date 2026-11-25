/**
 * GLSL for the Discover "Observatory" — mobile port of the web
 * components/experience/observatory/ObservatoryScene.tsx systems, plus the
 * gold dust that lifts off the piano.
 *
 * Pure strings (no RN imports) so they can be compile-tested in a browser.
 * Every vertex shader expects these defines to be prepended (see header()):
 *   PX_SCALE      device-pixel point-size scale (phones render at 3×)
 *   SPREAD        horizontal spread (portrait sees ~half a desktop's width)
 *   THREAD_SPEED  thread lifecycle speed vs web (user asked: "a little fast")
 *   TURB_SPEED    thread turbulence speed vs web
 */

export function header(pxScale: string, spread: number, threadSpeed = 3.0, turbSpeed = 2.0) {
  const f = (n: number) => n.toFixed(3)
  return `#define PX_SCALE ${pxScale}\n#define SPREAD ${f(spread)}\n#define THREAD_SPEED ${f(threadSpeed)}\n#define TURB_SPEED ${f(turbSpeed)}\n`
}

/** Gaussian disk — identical to the web/home dust */
export const FRAG_DISK = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, exp(-d * d * 11.0) * vAlpha);
  }
`

const GLSL_GOLD = /* glsl */`
  vec3 gold(float t, float bright) {
    vec3 warm = vec3(0.76, 0.52, 0.18);
    vec3 cool = vec3(0.91, 0.82, 0.50);
    return mix(warm, cool, t) * bright;
  }
`

const UNIFORMS = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSize;
  uniform float uBoost;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  const float PI  = 3.14159265;
  const float TAU = 6.28318530;
`

// ── 1 · Background cosmic dust — infinite depth, slow twinkle ────────────────
export const VERT_BACKGROUND = UNIFORMS + GLSL_GOLD + /* glsl */`
  void main() {
    float s  = aSeed;
    float t1 = uTime * (0.003 + fract(s * 4.3) * 0.003);
    vec3 pos = position;
    pos.x += sin(t1 + s * 19.3) * 0.20;
    pos.y += cos(t1 + s * 13.7) * 0.14;
    float twinkle = 0.45 + sin(uTime * (0.06 + fract(s * 3.1) * 0.12) + s * 40.0) * 0.55;
    vColor = gold(fract(s * 2.89), 0.48 + fract(s * 6.1) * 0.32);
    vAlpha = (0.18 + fract(s * 7.1) * 0.42) * twinkle * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = PX_SCALE * uSize * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

// ── 2 · Atmospheric dust — the minute gold cloud suspended everywhere ────────
export const VERT_ATMOSPHERIC = UNIFORMS + GLSL_GOLD + /* glsl */`
  void main() {
    float s  = aSeed;
    float t1 = uTime * (0.018 + fract(s * 7.31) * 0.014);
    float t2 = uTime * (0.011 + fract(s * 3.17) * 0.009);
    float t3 = uTime * (0.007 + fract(s * 11.9) * 0.005);
    vec3 pos = position;
    pos.x += sin(t1 + s * 17.3) * 0.52 + cos(t2 * 1.3 + s * 11.7) * 0.28;
    pos.y += cos(t1 + s * 23.1) * 0.41 + sin(t2       + s *  7.9) * 0.20;
    pos.z += sin(t3 + s * 31.4) * 0.34 + cos(t1 * 0.7 + s * 19.2) * 0.15;
    float flicker = 0.82 + sin(uTime * (0.18 + fract(s * 4.1) * 0.4) + s * 50.0) * 0.18;
    vColor = gold(fract(s * 5.93), 0.72 + fract(s * 2.17) * 0.40);
    vAlpha = (0.20 + fract(s * 13.7) * 0.45) * flicker * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = PX_SCALE * uSize * (1.0 + fract(s * 2.1) * 0.8) * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

// ── 3 · Falling dust — a gentle vertical gravity ─────────────────────────────
export const VERT_FALLING = UNIFORMS + GLSL_GOLD + /* glsl */`
  void main() {
    float s = aSeed;
    float fallSpeed = 0.012 + fract(s * 7.3) * 0.020;
    float phase     = fract(uTime * fallSpeed + s);
    float topY = 7.0 + fract(s * 11.3) * 5.0;
    float botY = -5.0 - fract(s * 3.7) * 3.0;
    float y    = mix(topY, botY, phase);
    float driftAmp = (0.5 + fract(s * 5.1) * 0.9) * SPREAD;
    float x = position.x + sin(phase * PI * 1.8 + s * TAU) * driftAmp
            + sin(uTime * 0.28 + s * 50.0) * 0.10;
    float z = position.z + cos(uTime * 0.16 + s * 30.0) * 0.18;
    float edgeFade = smoothstep(0.0, 0.07, phase) * smoothstep(1.0, 0.90, phase);
    vColor = gold(fract(s * 3.91), 0.62 + fract(s * 4.7) * 0.42);
    vAlpha = (0.22 + fract(s * 11.3) * 0.48) * edgeFade * uOpacity;
    vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
    gl_PointSize = PX_SCALE * uSize * (1.0 + fract(s * 2.7) * 1.0) * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

// ── 4 · Emerging threads — the signature "coming out of the screen" ──────────
// Web: born deep in the background, drifting toward the viewer on curling
// paths over 120–240 s. Here: centred (the piano is centre stage) and
// THREAD_SPEED× quicker so the threads visibly travel.
export const VERT_THREADS = UNIFORMS + GLSL_GOLD + /* glsl */`
  void main() {
    float s = aSeed;
    float lifeSpeed = (0.004 + fract(s * 7.31) * 0.0042) * THREAD_SPEED;
    float birthT    = fract(uTime * lifeSpeed + s);

    float birthX = (fract(s * 3.17) - 0.5) * 18.0 * SPREAD;
    float birthY = (fract(s * 5.73) - 0.5) * 14.0;
    float birthZ = -8.0 - fract(s * 2.41) * 8.0;
    vec3 birthPos = vec3(birthX, birthY, birthZ);

    float driftAngle  = fract(s * 17.3) * TAU;
    float forwardBias = 0.60 + fract(s * 6.1) * 0.28;
    float lateralAmp  = sqrt(max(0.0, 1.0 - forwardBias * forwardBias));
    float curlT     = birthT * PI * 1.6 + s * TAU;
    float curlAngle = driftAngle + sin(curlT) * 0.54 + cos(curlT * 0.7) * 0.30;
    vec3 driftDir = normalize(vec3(
      cos(curlAngle) * lateralAmp * (0.65 + fract(s * 2.9) * 0.50) * SPREAD * 1.4,
      sin(curlAngle) * lateralAmp * (0.50 + fract(s * 4.7) * 0.38),
      forwardBias
    ));
    float tA = uTime * (0.007 + fract(s * 3.3) * 0.005) * TURB_SPEED;
    float tB = uTime * (0.005 + fract(s * 5.7) * 0.004) * TURB_SPEED;
    float tC = uTime * (0.003 + fract(s * 8.1) * 0.003) * TURB_SPEED;
    driftDir.x += sin(tA + s * 17.1) * 0.14 + cos(tB * 1.3 + s * 11.3) * 0.08;
    driftDir.y += cos(tA + s * 23.7) * 0.07 + sin(tB * 0.7 + s *  7.9) * 0.05;
    driftDir.z += sin(tA * 1.4 + s *  9.3) * 0.06 + cos(tC + s * 13.7) * 0.04;

    float driftAge  = 1.0 - pow(1.0 - birthT, 2.8);
    float maxTravel = 16.0 + fract(s * 4.3) * 6.0;
    vec3 pos = birthPos + driftDir * (driftAge * maxTravel);

    float lifeAlpha = smoothstep(0.0, 0.14, birthT) * smoothstep(1.0, 0.52, birthT);
    float zFade     = smoothstep(3.5, 0.5, pos.z);

    vColor = gold(fract(s * 3.71), 0.68 + fract(s * 5.3) * 0.52) * (1.0 + uBoost * 0.55);
    vAlpha = lifeAlpha * zFade * (0.50 + fract(s * 8.3) * 0.48) * uOpacity;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float sizeScale = (1.0 + (1.0 - birthT) * 0.45) * (1.0 + uBoost * 0.3);
    gl_PointSize = PX_SCALE * uSize * sizeScale * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

// ── 5 · Sparkle — short-lived luminous flecks ────────────────────────────────
export const VERT_SPARKLE = UNIFORMS + /* glsl */`
  void main() {
    float s = aSeed;
    float lifeSpeed = 0.030 + fract(s * 5.3) * 0.038;
    float birthT    = fract(uTime * lifeSpeed + s);
    float birthX = (fract(s * 13.7) - 0.5) * 14.0 * SPREAD;
    float birthY = (fract(s * 7.1) - 0.5) * 9.0;
    float birthZ = -3.0 - fract(s * 5.9) * 5.0;
    vec3 birthPos = vec3(birthX, birthY, birthZ);
    float tA = uTime * (0.035 + fract(s * 3.7) * 0.025);
    float driftAngle = fract(s * 17.3) * TAU + sin(tA + s * PI) * 0.40;
    vec3 driftDir = normalize(vec3(
      cos(driftAngle) * 0.55 * SPREAD * 1.4,
      0.12 + fract(s * 3.7) * 0.28,
      0.55 + fract(s * 6.1) * 0.35
    ));
    driftDir.x += sin(tA * 1.3 + s * 11.7) * 0.15;
    driftDir.y += cos(tA * 0.9 + s *  7.3) * 0.12;
    float driftAge = 1.0 - pow(1.0 - birthT, 3.2);
    vec3 pos = birthPos + driftDir * (driftAge * (3.0 + fract(s * 6.7) * 4.0));
    float lifeAlpha = smoothstep(0.0, 0.08, birthT) * smoothstep(1.0, 0.38, birthT);
    float zFade     = smoothstep(3.0, 0.5, pos.z);
    vColor = mix(vec3(0.88, 0.72, 0.34), vec3(0.97, 0.90, 0.60), fract(s * 3.7));
    vAlpha = lifeAlpha * zFade * (0.65 + fract(s * 5.1) * 0.35) * uOpacity * (1.0 + uBoost * 0.6);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = PX_SCALE * uSize * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

// ── 6 · Piano emission — minute gold lifting off the instrument ──────────────
// Born on a shell around the piano's body, drifting outward and upward with a
// slow curl, like the dust coming off the Home saxophone.
export const VERT_PIANO_EMISSION = UNIFORMS + GLSL_GOLD + /* glsl */`
  uniform vec3  uPiano;
  uniform float uPianoSize;
  void main() {
    float s = aSeed;
    float lifeSpeed = 0.035 + fract(s * 7.31) * 0.055;
    float birthT    = fract(uTime * lifeSpeed + s);

    float th = fract(s * 17.3) * TAU;
    float ph = acos(1.0 - 2.0 * fract(s * 5.71));
    vec3 dir = vec3(sin(ph) * cos(th), cos(ph), sin(ph) * sin(th));
    vec3 radii = vec3(0.60, 0.36, 0.55) * uPianoSize;
    vec3 birthPos = uPiano + dir * radii * (0.75 + fract(s * 3.3) * 0.35);

    float tA = uTime * (0.05 + fract(s * 3.3) * 0.04);
    vec3 drift = normalize(dir * vec3(1.0, 0.4, 0.6) + vec3(0.0, 0.55 + fract(s * 6.1) * 0.5, 0.0));
    drift.x += sin(tA + s * 17.1) * 0.35;
    drift.z += cos(tA * 0.8 + s * 11.3) * 0.25;
    float driftAge = 1.0 - pow(1.0 - birthT, 2.6);
    float travel   = (0.25 + fract(s * 4.3) * 0.85) * uPianoSize;
    vec3 pos = birthPos + drift * driftAge * travel;

    float lifeAlpha = smoothstep(0.0, 0.12, birthT) * smoothstep(1.0, 0.45, birthT);
    vColor = gold(fract(s * 3.71), 0.75 + fract(s * 5.3) * 0.55);
    vAlpha = lifeAlpha * (0.45 + fract(s * 8.3) * 0.5) * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = PX_SCALE * uSize * (1.0 + (1.0 - birthT) * 0.5) * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

// ── 7 · Piano glints — rare bright flecks close to the gold ──────────────────
export const VERT_PIANO_GLINT = UNIFORMS + /* glsl */`
  uniform vec3  uPiano;
  uniform float uPianoSize;
  void main() {
    float s = aSeed;
    float lifeSpeed = 0.09 + fract(s * 5.3) * 0.12;
    float birthT    = fract(uTime * lifeSpeed + s);
    float th = fract(s * 13.1) * TAU;
    float y  = (fract(s * 7.1) - 0.35) * 0.7;
    vec3 birthPos = uPiano + vec3(cos(th) * 0.62, y, sin(th) * 0.5) * uPianoSize;
    vec3 dir = normalize(vec3(cos(th) * 0.6, 0.5 + fract(s * 3.7) * 0.4, sin(th) * 0.3));
    float driftAge = 1.0 - pow(1.0 - birthT, 3.0);
    vec3 pos = birthPos + dir * driftAge * (0.15 + fract(s * 6.7) * 0.4) * uPianoSize;
    float lifeAlpha = smoothstep(0.0, 0.06, birthT) * smoothstep(1.0, 0.35, birthT);
    vColor = mix(vec3(0.92, 0.78, 0.40), vec3(1.0, 0.95, 0.70), fract(s * 3.7));
    vAlpha = lifeAlpha * (0.6 + fract(s * 5.1) * 0.4) * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = PX_SCALE * uSize * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

/** All programs, for compile tests */
export const PROGRAMS = {
  VERT_BACKGROUND, VERT_ATMOSPHERIC, VERT_FALLING, VERT_THREADS, VERT_SPARKLE,
  VERT_PIANO_EMISSION, VERT_PIANO_GLINT,
}
