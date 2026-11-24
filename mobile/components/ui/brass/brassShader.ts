/**
 * Engraved-brass material for SPOTLIGHT buttons (user-approved design "B":
 * mirrored engraved end-caps, polished brushed centre, engraved border groove).
 *
 * The relief comes from the saxophone model's own normal map (ornamental
 * column, rotated 90° — assets/textures/brass_engraving_normal.png). The brass
 * colour is generated, so the source texture's block artifacts never show.
 *
 * Coordinates are button-local points: the caller maps the normal-map image
 * shader onto [uOrigin, uOrigin + uSize].
 */
export const BRASS_SKSL = `
uniform shader normalMap;
uniform float2 uOrigin;   // top-left of the plate in canvas space
uniform float2 uSize;     // plate size (points)
uniform float3 uLight;    // light direction (driven by device tilt)
uniform float  uSheen;    // sweep position across the plate; < -0.5 = off
uniform float  uFlare;    // 0..1 strike flash
uniform float  uMode;     // 0 = full engraved plate · 1 = engraved frame (secondary)
uniform float  uRadius;   // corner radius (points)

float rrect(float2 p, float2 b, float r) {
  float2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

half4 main(float2 xy) {
  float2 lp = xy - uOrigin;
  float2 uv = lp / uSize;
  float2 pc = lp - uSize * 0.5;
  float d = rrect(pc, uSize * 0.5, uRadius);          // < 0 inside the plate
  float alpha = 1.0 - smoothstep(-0.6, 0.6, d);
  if (alpha <= 0.0) return half4(0.0);

  // Frame mode: only a band along the edge is brass
  float frameW = min(6.0, uSize.y * 0.16);
  float inFrame = uMode > 0.5 ? smoothstep(-frameW - 0.8, -frameW + 0.4, d) : 1.0;

  // ── Engraving relief ────────────────────────────────────────────────────
  float relief;
  float mirror = 1.0;
  float2 sampleUV;                                     // 0..1 in the engraving image
  if (uMode > 0.5) {
    sampleUV = uv;                                     // frame: full engraving around the band
    relief = 1.6;
  } else {
    // Design B: the ornament (left part of the engraving) on both ends, mirrored
    // Caps live inside the button's side padding (~26pt) so the label never
    // overlaps the ornament, whatever the button width.
    float cap = clamp(26.0 / uSize.x, 0.08, 0.20);
    float sx = uv.x < 0.5 ? uv.x / cap : (1.0 - uv.x) / cap;   // 0 at the end → 1 at the cap edge
    mirror = uv.x < 0.5 ? 1.0 : -1.0;
    sampleUV = float2(0.0395 + clamp(sx, 0.0, 1.0) * 0.3947, uv.y);
    relief = 1.7 * smoothstep(1.05, 0.80, sx);         // polished centre
  }
  float3 t = normalMap.eval(uOrigin + sampleUV * uSize).rgb;
  float2 nn = t.xy * 2.0 - 1.0;
  nn = float2(-nn.y, nn.x);                            // rotate with the 90° crop
  nn.x *= mirror;
  float3 n = normalize(float3(nn * relief, 1.0));
  // Design B: fine engraved border groove inset from the edge
  if (uMode < 0.5) {
    float bd = rrect(pc, uSize * 0.5 - 5.0, 3.0);
    float groove = exp(-bd * bd / 0.9);
    float2 gdir = normalize(pc + 0.0001);
    n = normalize(n + float3(gdir * sign(bd) * groove * 0.9, 0.0));
  }
  // brushed micro-lines
  float brush = fract(sin(floor(lp.y / 0.6) * 91.7) * 4375.85);
  n = normalize(n + float3(0.0, (brush - 0.5) * 0.05, 0.0));

  // ── Polished brass lighting ─────────────────────────────────────────────
  float3 albedo = float3(0.92, 0.68, 0.30);
  float3 L = normalize(uLight);
  float3 V = float3(0.0, 0.0, 1.0);
  float3 H = normalize(L + V);
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(n, H), 0.0), 70.0) * (1.25 + uFlare * 1.6);
  float3 r = reflect(-V, n);
  float envY = r.y * 1.8 + (1.0 - uv.y) * 0.9 - 0.35 + uLight.x * (uv.x - 0.5) * 2.2 + r.x * uLight.x * 1.4;
  float3 env = mix(float3(0.20, 0.12, 0.04), float3(1.05, 0.90, 0.60), smoothstep(-0.3, 0.9, envY));
  float ao = mix(1.0, 0.62, clamp((1.0 - n.z) * 3.0, 0.0, 1.0));
  float3 col = albedo * env * 0.95 * ao + albedo * diff * 0.30 + spec * float3(1.0, 0.94, 0.78);

  if (uSheen > -0.5) {
    float s = (uv.x - (1.0 - uv.y) * 0.28) - uSheen;
    col += float3(1.0, 0.93, 0.75) * exp(-s * s / 0.0016) * 0.55;
  }
  col += float3(1.0, 0.92, 0.70) * uFlare * 0.35;

  // Bevel: bright rim + inner shadow
  float rim = smoothstep(-3.5, -1.0, d);
  float bevelTop = smoothstep(0.10, 0.0, uv.y);
  col = mix(col, col * 0.55, smoothstep(-5.0, -2.0, d) * (1.0 - bevelTop));
  col += float3(1.0, 0.92, 0.70) * rim * 0.45 * (0.5 + 0.5 * (1.0 - uv.y));

  col = col / (col + 0.55) * 1.42;                    // filmic shoulder

  // Frame mode: dark glass centre with a thin inner groove
  if (uMode > 0.5) {
    float3 glass = float3(0.035, 0.028, 0.018);
    float inner = -frameW;
    float groove = exp(-(d - inner) * (d - inner) / 0.5);
    glass += float3(0.55, 0.42, 0.18) * groove * 0.6;
    col = mix(glass, col, inFrame);
  }

  return half4(half3(col) * half(alpha), half(alpha));
}
`
