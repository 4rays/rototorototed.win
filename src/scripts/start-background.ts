/**
 * Rototo start-screen background, ported to Canvas 2D from the Godot project
 * (../rototo-rototed). Paints a fixed full-viewport scene:
 *
 *   1. Base color        scenes/background/background.tscn  Color(0.1, 0.05, 0.2)
 *   2. Star field        scenes/background/star_field.gd   20 breathing stars
 *   3. Concentric rings  scenes/background/concentric_circles.gd  2 groups
 *
 * Godot's stretch mode is canvas_items + expand, so the scene scales uniformly
 * by max(width/1152, height/648) — the same factor is applied here. Honors
 * prefers-reduced-motion by rendering a single static frame.
 */

import starUrl from "@/assets/star.png";

// --- Constants (values lifted from the Godot sources) ----------------------

// Godot design viewport (project.godot)
const DESIGN_W = 1152;
const DESIGN_H = 648;

// background.tscn BaseColor ColorRect: Color(0.1, 0.05, 0.2, 1)
const BASE_RGB = [0.1, 0.05, 0.2] as const;

// star_field.gd defaults with game_start.tscn's BackgroundScene overrides.
// Sprite scale 0.05..0.08 of the 257px star.png, alpha 0.75, 0.15 rad/s.
const STAR = {
  count: 20,
  minScale: 0.05,
  maxScale: 0.08,
  alpha: 0.75,
  rotationSpeed: 0.15,
  scaleDurMin: 1.5,
  scaleDurMax: 3.0,
  visibleMin: 4.0,
  visibleMax: 10.0,
  delayMin: 0.5,
  delayMax: 3.0,
  spritePx: 256
};

interface CircleGroup {
  // center_offset, num_circles, min/max_radius, circle_color, rotation_speed
  offset: readonly [number, number];
  num: number;
  minR: number;
  maxR: number;
  rgba: readonly [number, number, number, number];
  rotSpeed: number;
}

// background.tscn ConcentricCircles1 / ConcentricCircles2
const CIRCLES: readonly CircleGroup[] = [
  {
    offset: [-350, -250],
    num: 5,
    minR: 300,
    maxR: 1200,
    rgba: [0.8, 0, 0.6666668, 0.101960786],
    rotSpeed: 0.015
  },
  {
    offset: [500, 400],
    num: 4,
    minR: 360,
    maxR: 1100,
    rgba: [1, 0, 0.8333335, 0.078431375],
    rotSpeed: -0.012
  }
];

// --- Small helpers ----------------------------------------------------------

const TAU = Math.PI * 2;

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(Math.max(x, lo), hi);
}

type RGB = readonly [number, number, number];

function rgba(c: RGB, alpha: number): string {
  const r = Math.round(clamp(c[0], 0, 1) * 255);
  const g = Math.round(clamp(c[1], 0, 1) * 255);
  const b = Math.round(clamp(c[2], 0, 1) * 255);
  return `rgba(${r},${g},${b},${alpha.toFixed(4)})`;
}

function randfRange(from: number, to: number): number {
  return from + Math.random() * (to - from);
}

// --- Star field -------------------------------------------------------------

type StarPhase = "delaying" | "growing" | "holding" | "shrinking";

interface Star {
  nx: number;
  ny: number; // position, normalized 0..1 so resize keeps stars in view
  rot: number;
  target: number;
  scale: number;
  phase: StarPhase;
  timer: number; // seconds elapsed in the current tween phase
  dur: number; // current tween duration (grow/shrink)
  holdFor: number;
}

// star_field.gd: 3 size categories for depth
function rollTargetScale(): number {
  const roll = Math.random();
  if (roll < 1 / 3) return randfRange(STAR.minScale, 0.07); // small (distant)
  if (roll < 2 / 3) return randfRange(0.07, 0.1); // medium
  return randfRange(0.1, STAR.maxScale); // large (close)
}

function spawnStar(): Star {
  // _spawn_stars: start at zero scale; half begin growing now, half after a
  // 0.5–3s delay
  const delay =
    Math.random() > 0.5 ? randfRange(STAR.delayMin, STAR.delayMax) : 0;
  return {
    nx: Math.random(),
    ny: Math.random(),
    rot: randfRange(0, TAU),
    target: rollTargetScale(),
    scale: 0,
    phase: "delaying",
    timer: 0,
    dur: delay,
    holdFor: randfRange(STAR.visibleMin, STAR.visibleMax)
  };
}

// Per-frame state machine mirroring the tween chain in star_field.gd
function updateStar(star: Star, dt: number): void {
  star.timer += dt;
  switch (star.phase) {
    case "delaying":
      if (star.timer >= star.dur) startGrow(star);
      break;
    case "growing": {
      // EASE_OUT + TRANS_QUAD
      const t = Math.min(star.timer / star.dur, 1);
      star.scale = star.target * (1 - (1 - t) * (1 - t));
      if (t >= 1) {
        star.phase = "holding";
        star.timer = 0;
      }
      break;
    }
    case "holding":
      star.scale = star.target;
      if (star.timer >= star.holdFor) {
        star.phase = "shrinking";
        star.timer = 0;
        star.dur = randfRange(STAR.scaleDurMin, STAR.scaleDurMax);
      }
      break;
    case "shrinking": {
      // EASE_IN + TRANS_QUAD toward zero scale
      const t = Math.min(star.timer / star.dur, 1);
      star.scale = star.target * (1 - t * t);
      if (t >= 1) {
        // _on_shrink_complete: reposition, then regrow toward the same target
        star.nx = Math.random();
        star.ny = Math.random();
        startGrow(star);
      }
      break;
    }
  }
  star.rot += STAR.rotationSpeed * dt;
}

function startGrow(star: Star): void {
  star.phase = "growing";
  star.timer = 0;
  star.scale = 0;
  star.dur = randfRange(STAR.scaleDurMin, STAR.scaleDurMax);
}

// --- Background painter -----------------------------------------------------

export function initStartBackground(canvas: HTMLCanvasElement): () => void {
  const context = canvas.getContext("2d");
  if (!context) return () => {};
  const ctx: CanvasRenderingContext2D = context;

  const starImg = new Image();
  starImg.src = starUrl.src;

  const stars: Star[] = Array.from({length: STAR.count}, spawnStar);
  let circleRot = 0;

  let w = 0;
  let h = 0;
  let viewScale = 1;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Godot canvas_items + expand stretch: uniform scale by the max ratio
    viewScale = Math.max(w / DESIGN_W, h / DESIGN_H);
    // In static (reduced-motion) mode nothing redraws after a resize clears
    // the canvas, so repaint the frozen frame here.
    if (!running) renderStatic();
  }

  function drawBase(): void {
    ctx.fillStyle = rgba(BASE_RGB, 1);
    ctx.fillRect(0, 0, w, h);
  }

  function drawStars(): void {
    if (!starImg.complete || starImg.naturalWidth === 0) return;
    const size = STAR.spritePx * viewScale;
    for (const star of stars) {
      if (star.scale <= 0) continue;
      const px = star.nx * w;
      const py = star.ny * h;
      const s = size * star.scale;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(star.rot);
      ctx.globalAlpha = STAR.alpha;
      ctx.drawImage(starImg, -s / 2, -s / 2, s, s);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawCircles(): void {
    // concentric_circles.gd _draw: filled circles, largest first so inner
    // circles render on top; the offset itself rotates over time. Godot's
    // draw_circle uses normal alpha blending here (no material is set on the
    // node), which gives the deep-purple look with subtle rings.
    const cx = w / 2;
    const cy = h / 2;
    for (const group of CIRCLES) {
      const ang = circleRot * group.rotSpeed; // radians = elapsed s * speed
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      const ox =
        cx + (group.offset[0] * cos - group.offset[1] * sin) * viewScale;
      const oy =
        cy + (group.offset[0] * sin + group.offset[1] * cos) * viewScale;
      const step = (group.maxR - group.minR) / Math.max(group.num, 1);
      const [r, g, b, a] = group.rgba;
      ctx.fillStyle = rgba([r, g, b], a);
      for (let i = group.num - 1; i >= 0; i--) {
        const radius = (group.minR + i * step) * viewScale;
        ctx.beginPath();
        ctx.arc(ox, oy, radius, 0, TAU);
        ctx.fill();
      }
    }
  }

  function draw(): void {
    drawBase();
    drawStars();
    drawCircles();
  }

  // --- Animation loop -------------------------------------------------------

  let raf = 0;
  let last = 0;
  let running = false;

  function tick(now: number): void {
    if (!running) return;
    const dt = clamp((now - last) / 1000, 0, 0.1);
    last = now;
    circleRot += dt; // concentric_circles.gd accumulates seconds; speeds applied in draw
    for (const star of stars) updateStar(star, dt);
    draw();
    raf = requestAnimationFrame(tick);
  }

  function startLoop(): void {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stopLoop(): void {
    running = false;
    cancelAnimationFrame(raf);
  }

  function renderStatic(): void {
    // One representative frame: stars at full scale, rings unrotated.
    for (const star of stars) star.scale = star.target;
    draw();
  }

  function applyMotionPreference(): void {
    if (reducedMotion.matches) {
      stopLoop();
      renderStatic();
    } else {
      startLoop();
    }
  }

  const onResize = () => resize();
  const onMotionChange = () => applyMotionPreference();

  resize();
  applyMotionPreference();

  window.addEventListener("resize", onResize);
  reducedMotion.addEventListener("change", onMotionChange);

  return () => {
    stopLoop();
    window.removeEventListener("resize", onResize);
    reducedMotion.removeEventListener("change", onMotionChange);
  };
}
