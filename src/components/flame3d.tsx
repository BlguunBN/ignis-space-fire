"use client";

/**
 * WebGL2 raymarched 3D droplet flame — React port of Fotia's Flame3D
 * (https://github.com/AnteurAbderraouf/Fotia, MIT-licensed).
 *
 * What is computed vs drawn (Fotia's own contract, kept here):
 *   - Computed (droplet-engine.ts): droplet diameter over time via the d² law,
 *     extinction instant, burn duration.
 *   - Drawn (illustrative): flame colour (blue reaction zone / yellow soot),
 *     turbulence, buoyant stretch under gravity, air-from-cursor.
 *
 * Falls back silently (returns null) when WebGL2 is unavailable, so the
 * existing 2D canvas flame can take over.
 */
import { useEffect, useRef, useState } from "react";

const FLAME_VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FLAME_FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime, uDrop, uFlame, uOn, uSoot, uTanHalf;
uniform vec3 uRo, uRight, uUp, uFwd, uFlow;
out vec4 outColor;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
        mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
        mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.z), f.z);
}
float fbm(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.02 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s;
}

float flowSize() { return length(uFlow); }
vec3 flowDir() { float s = flowSize(); return s > 1e-4 ? uFlow / s : vec3(0.0, 1.0, 0.0); }
float flowGain() { return clamp(flowSize() / 1.2, 0.0, 1.0); }
vec3 lift() { return flowDir() * uFlame * flowSize() * 0.55; }

vec2 shape(vec3 p) {
  float R = max(uFlame, 1e-3);
  float s = flowSize(), g = flowGain();
  vec3 dir = flowDir();
  float a = dot(p, dir) - R * s * 0.55;
  vec3 perp = p - dot(p, dir) * dir;
  a /= 1.0 + s;
  float h = clamp(a / R, -1.2, 1.2);
  perp *= 1.0 + 0.55 * g * max(h, 0.0);
  perp *= 1.0 - 0.12 * g * max(-h, 0.0);
  vec3 q = perp + a * dir;
  float speed = 0.15 + 1.6 * g;
  float n = fbm(q / R * 2.4 - dir * uTime * speed) - 0.5;
  float amp = 0.05 + 0.45 * g * smoothstep(-0.3, 1.0, h);
  float d = length(q) + n * amp * R * 2.0;
  float w = R * (0.11 + 0.12 * g * max(h, 0.0));
  return vec2((d - R) / w, h);
}

vec3 emission(vec3 p) {
  vec2 s = shape(p);
  float x = s.x, h = s.y;
  float blue = exp(-(x - 0.9) * (x - 0.9) * 2.6);
  float soot = exp(-(x + 0.55) * (x + 0.55) * 1.6);
  float sootAmt = uSoot * (1.0 - 0.75 * flowGain() * smoothstep(0.0, -1.0, h));
  float inner = smoothstep(0.0, -6.0, x) * 0.05;
  return vec3(0.16, 0.34, 1.0) * blue * (0.5 + 0.9 * (1.0 - uSoot))
       + vec3(1.0, 0.52, 0.12) * soot * sootAmt * 1.5
       + vec3(1.0, 0.86, 0.55) * soot * soot * soot * sootAmt * 0.5
       + vec3(0.6, 0.3, 0.1) * inner * uSoot * 0.4;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  vec3 rd = normalize(uFwd + (uv.x * uRight + uv.y * uUp) * uTanHalf);
  vec3 ro = uRo;
  float vig = 1.0 - 0.35 * dot(uv * 0.6, uv * 0.6);
  vec3 col = vec3(0.012, 0.014, 0.022) * vig;

  float tDrop = 1e9;
  {
    float b = dot(ro, rd), c = dot(ro, ro) - uDrop * uDrop, hh = b * b - c;
    if (hh > 0.0) { float t = -b - sqrt(hh); if (t > 0.0) tDrop = t; }
  }

  vec3 acc = vec3(0.0);
  if (uOn > 0.001 && uFlame > 1e-3) {
    vec3 oc = ro - lift();
    float Rb = uFlame * ((1.0 + flowSize()) * 1.15 + 0.6 + 0.6 * flowGain());
    float b = dot(oc, rd), c = dot(oc, oc) - Rb * Rb, hh = b * b - c;
    if (hh > 0.0) {
      float s = sqrt(hh);
      float t0 = max(-b - s, 0.0), t1 = min(-b + s, tDrop);
      const int N = 56;
      float dt = (t1 - t0) / float(N);
      float t = t0 + dt * hash(vec3(gl_FragCoord.xy, fract(uTime) * 61.0));
      for (int i = 0; i < N; i++) {
        if (t > t1) break;
        acc += emission(ro + rd * t);
        t += dt;
      }
      acc *= dt / uFlame * 0.85 * uOn;
    }
  }
  col += acc;

  if (tDrop < 1e8) {
    vec3 p = ro + rd * tDrop, n = normalize(p);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    vec3 glow = mix(vec3(0.35, 0.5, 1.0), vec3(1.0, 0.62, 0.3), uSoot) * uOn;
    float spec = pow(max(dot(reflect(rd, n), normalize(vec3(0.4, 0.7, 0.5))), 0.0), 40.0);
    col = acc + vec3(0.10, 0.12, 0.16) * (0.5 + 0.5 * n.y) + glow * (0.25 + 0.9 * fres)
        + vec3(0.9, 0.95, 1.0) * spec * 0.6;
  }
  col = vec3(1.0) - exp(-col * 1.35);
  outColor = vec4(pow(col, vec3(0.9)), 1.0);
}`;

interface FlameScene {
  /** Droplet radius in scene units. */
  dropR: number;
  /** Flame envelope radius in scene units. */
  flameR: number;
  /** 0..1 ignition intensity. */
  on: number;
  /** 0..1 soot amount (drives blue vs yellow). */
  soot: number;
  /** 1 = spherical microgravity flame; >1 stretches under buoyancy. */
  stretch: number;
  /** Optional external airflow vector [x, y, z] (e.g. from cursor nozzle). */
  flow?: [number, number, number];
}

interface Flame3DProps {
  /** Live scene state driven by the droplet engine's d² law. */
  scene: FlameScene;
  className?: string;
  /** Enable drag-to-orbit and Ctrl+wheel zoom. */
  orbit?: boolean;
}

const VEC = {
  add: (a: number[], b: number[]) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  scale: (a: number[], s: number) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a: number[], b: number[]): number[] => [
    a[1] * b[2] - a[2] * b[0],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  norm: (a: number[]) => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  },
};

export function Flame3D({ scene, className, orbit = true }: Flame3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGL2RenderingContext;
    try {
      gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false }) as WebGL2RenderingContext;
      if (!gl) {
        setSupported(false);
        return;
      }
    } catch {
      setSupported(false);
      return;
    }
    setSupported(true);

    const make = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(s) || "shader compile failed");
      }
      return s;
    };
    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, make(gl.VERTEX_SHADER, FLAME_VERT));
      gl.attachShader(program, make(gl.FRAGMENT_SHADER, FLAME_FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "link failed");
      }
    } catch (err) {
      console.warn("Flame3D: shader unavailable,", err);
      setSupported(false);
      return;
    }
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u: Record<string, WebGLUniformLocation | null> = {};
    for (const name of [
      "uRes", "uTime", "uDrop", "uFlame", "uOn", "uSoot",
      "uTanHalf", "uRo", "uRight", "uUp", "uFwd", "uFlow",
    ]) {
      u[name] = gl.getUniformLocation(program, name);
    }

    let scale = 0.7;
    let frames: number[] = [];
    let yaw = 0.6;
    let pitch = 0.18;
    let zoom = 1;
    let raf = 0;
    let prev: number | undefined;

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      const r = Math.min(window.devicePixelRatio || 1, 1.5) * scale;
      canvas.width = Math.max(1, Math.round(w * r));
      canvas.height = Math.max(1, Math.round(h * r));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const camera = (s: FlameScene) => {
      const R0 = Math.max(s.flameR, s.dropR * 2.2, 1e-3);
      const st = s.stretch;
      const target = [0, R0 * (st - 1) * 0.45, 0];
      const dist = R0 * (1 + (st - 1) * 1.35) * 4.6 * zoom;
      const cp = Math.cos(pitch);
      const roV = [
        target[0] + dist * cp * Math.sin(yaw),
        target[1] + dist * Math.sin(pitch),
        target[2] + dist * cp * Math.cos(yaw),
      ];
      const fwd = VEC.norm(VEC.sub(target, roV));
      const right = VEC.norm(VEC.cross(fwd, [0, 1, 0]));
      const up = VEC.cross(right, fwd);
      return { roV, fwd, right, up, tanHalf: Math.tan((38 * Math.PI) / 360) };
    };

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      const s = sceneRef.current;
      // Adaptive resolution: hold ~30fps on modest hardware.
      const last = prev ?? now;
      prev = now;
      frames.push(now - last);
      if (frames.length >= 40) {
        const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
        frames = [];
        if (avg > 40 && scale > 0.4) scale = Math.max(0.4, scale * 0.85);
        else if (avg < 20 && scale < 1) scale = Math.min(1, scale * 1.1);
        resize();
      }
      if (!orbit) yaw += 0.0025;

      const c = camera(s);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, now / 1000);
      gl.uniform1f(u.uDrop, s.dropR);
      gl.uniform1f(u.uFlame, s.flameR);
      gl.uniform1f(u.uOn, s.on);
      gl.uniform1f(u.uSoot, s.soot);
      gl.uniform1f(u.uTanHalf, c.tanHalf);
      gl.uniform3fv(u.uRo, c.roV);
      gl.uniform3fv(u.uRight, c.right);
      gl.uniform3fv(u.uUp, c.up);
      gl.uniform3fv(u.uFwd, c.fwd);
      const fx = s.flow?.[0] ?? 0;
      const fy = (s.flow?.[1] ?? 0) + (s.stretch - 1);
      const fz = s.flow?.[2] ?? 0;
      gl.uniform3fv(u.uFlow, [fx, fy, fz]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(render);

    // Orbit controls: drag to rotate, Ctrl+wheel to zoom.
    let drag: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (!orbit) return;
      drag = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      yaw -= (e.clientX - drag.x) * 0.008;
      pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - drag.y) * 0.006));
      drag = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { drag = null; };
    const onWheel = (e: WheelEvent) => {
      if (!orbit || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoom = Math.max(0.45, Math.min(2.5, zoom * Math.exp(e.deltaY * 0.0012)));
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [orbit]);

  if (supported === false) return null; // caller keeps its 2D fallback

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ touchAction: orbit ? "none" : undefined }}
      aria-label="3D droplet flame visualisation"
      role="img"
    />
  );
}
