import { clamp } from "../core/math.js";

/** Small, deterministic circle solver. Rendering and GSAP never write physical state. */
export class PhysicsWorld {
  constructor(config, onImpact = () => {}) {
    this.config = config;
    this.bodies = [];
    this.onImpact = onImpact;
    this.grip = null;
  }
  add(body) {
    this.bodies.push(body);
    return body;
  }
  attach(body, anchor) {
    this.grip = { body, anchor };
    body.held = true;
  }
  detach() {
    const body = this.grip?.body;
    if (body) body.held = false;
    this.grip = null;
    return body;
  }
  step(dt) {
    const { chamber: bounds, ball: tuning, grip: gripTuning } = this.config;
    for (const b of this.bodies) {
      if (!b.active) continue;
      b.previousX = b.x;
      b.previousY = b.y;
      let ax = 0,
        ay = tuning.gravity;
      if (this.grip?.body === b) {
        const a = this.grip.anchor;
        ax +=
          (a.x - b.x) * gripTuning.spring + (a.vx - b.vx) * gripTuning.damping;
        ay +=
          (a.y - b.y) * gripTuning.spring + (a.vy - b.vy) * gripTuning.damping;
      }
      b.vx += ax * dt;
      b.vy += ay * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.angularVelocity *= Math.exp(-1.4 * dt);
      b.angle += b.angularVelocity * dt;
      b.grounded = false;
      if (b.x < bounds.left + b.radius) {
        b.x = bounds.left + b.radius;
        b.vx = Math.abs(b.vx) * 0.45;
      }
      if (b.x > bounds.right - b.radius) {
        b.x = bounds.right - b.radius;
        b.vx = -Math.abs(b.vx) * 0.45;
      }
      // The chute is a deliberate hole in the floor, accessible only on delivery.
      const hasFloor = !b.delivering || b.x > bounds.chuteRight - b.radius;
      if (hasFloor && b.y + b.radius > bounds.floor) {
        const impact = b.vy;
        b.y = bounds.floor - b.radius;
        b.vy = impact > 35 ? -impact * tuning.restitution : 0;
        b.vx *= Math.pow(tuning.friction, dt * 120);
        b.grounded = true;
        b.angularVelocity = (b.vx / b.radius) * 0.25;
        if (impact > 90) this.onImpact(b, impact);
      }
    }
    for (let iteration = 0; iteration < 3; iteration++) {
      for (let i = 0; i < this.bodies.length; i++)
        for (let j = i + 1; j < this.bodies.length; j++)
          this.collide(this.bodies[i], this.bodies[j]);
    }
  }
  collide(a, b) {
    if (!a.active || !b.active || a.delivering || b.delivering) return;
    let dx = b.x - a.x,
      dy = b.y - a.y;
    const distance = Math.hypot(dx, dy),
      radii = a.radius + b.radius;
    if (distance >= radii) return;
    const nx = distance > 0.001 ? dx / distance : 1,
      ny = distance > 0.001 ? dy / distance : 0;
    const penetration = radii - distance;
    const aShare = a.held ? 0.18 : b.held ? 0.82 : 0.5;
    a.x -= nx * penetration * aShare;
    a.y -= ny * penetration * aShare;
    b.x += nx * penetration * (1 - aShare);
    b.y += ny * penetration * (1 - aShare);
    const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (relative >= 0) return;
    const impulse = -(1 + 0.3) * relative * 0.5;
    a.vx -= nx * impulse;
    a.vy -= ny * impulse;
    b.vx += nx * impulse;
    b.vy += ny * impulse;
  }
  findCatch(x, hubY) {
    const { grip, claw } = this.config;
    return (
      this.bodies
        .filter(
          (b) =>
            b.active &&
            !b.delivering &&
            Math.abs(b.x - x) <= b.radius * grip.reach &&
            Math.abs(b.y - (hubY + claw.gripOffsetY)) < b.radius * 0.8,
        )
        .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0] || null
    );
  }
  targetUnder(x) {
    return (
      this.bodies
        .filter(
          (b) =>
            b.active &&
            !b.delivering &&
            Math.abs(b.x - x) < b.radius * this.config.grip.reach,
        )
        .sort((a, b) => a.y - b.y)[0] || null
    );
  }
  quality(body, x) {
    return clamp(
      1 - Math.abs(body.x - x) / (body.radius * this.config.grip.reach),
      0,
      1,
    );
  }
}

export function makeBody(id, x, y, radius) {
  return {
    id,
    x,
    y,
    previousX: x,
    previousY: y,
    vx: 0,
    vy: 0,
    radius,
    angle: 0,
    angularVelocity: 0,
    active: true,
    held: false,
    delivering: false,
    grounded: false,
  };
}
