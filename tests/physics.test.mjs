import test from "node:test";
import assert from "node:assert/strict";
import { PhysicsWorld, makeBody } from "../dist/src/game/physics.js";
import { CONFIG } from "../dist/src/game/config.js";

function advance(world, seconds) {
  for (let i = 0; i < seconds / CONFIG.fixedStep; i++)
    world.step(CONFIG.fixedStep);
}
test("free balls fall and settle without tunneling through the floor", () => {
  const w = new PhysicsWorld(CONFIG),
    b = w.add(makeBody(0, 500, 120, 48));
  advance(w, 8);
  assert.ok(Math.abs(b.y - (CONFIG.chamber.floor - b.radius)) < 0.2);
  assert.ok(Math.abs(b.vy) < 1);
  assert.ok(Number.isFinite(b.x));
});
test("a centered spring grip carries a ball and settles close to its anchor", () => {
  const w = new PhysicsWorld(CONFIG),
    b = w.add(makeBody(0, 700, 450, 48));
  w.attach(b, { x: 700, y: 450, vx: 0, vy: 0 });
  for (let i = 0; i < 360; i++) {
    w.grip.anchor.y = Math.max(175, 450 - i * 1.2);
    w.grip.anchor.vy = i < 229 ? -144 : 0;
    w.step(CONFIG.fixedStep);
  }
  w.grip.anchor.vy = 0;
  advance(w, 2);
  assert.ok(Math.abs(b.y - 175) < 10);
  assert.ok(Math.abs(b.x - 700) < 1);
  assert.equal(b.held, true);
});
test("detaching restores gravity and the ball can be caught again", () => {
  const w = new PhysicsWorld(CONFIG),
    b = w.add(makeBody(0, 600, 200, 48));
  w.attach(b, { x: 600, y: 200, vx: 0, vy: 0 });
  w.detach();
  advance(w, 4);
  assert.equal(b.held, false);
  assert.equal(w.findCatch(600, b.y - CONFIG.claw.gripOffsetY), b);
});
test("only a delivering ball can fall through the pickup chute", () => {
  const w = new PhysicsWorld(CONFIG),
    b = w.add(makeBody(0, 130, 300, 48));
  advance(w, 2);
  assert.ok(b.y < CONFIG.chamber.floor);
  b.delivering = true;
  advance(w, 1);
  assert.ok(b.y > 610);
});
test("colliding balls separate and stay finite", () => {
  const w = new PhysicsWorld(CONFIG),
    a = w.add(makeBody(0, 500, 466, 48)),
    b = w.add(makeBody(1, 500, 466, 48));
  advance(w, 2);
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 95.9);
  assert.ok(Number.isFinite(a.vx) && Number.isFinite(b.vy));
});
test("the forgiving catch radius still rejects an empty drop", () => {
  const w = new PhysicsWorld(CONFIG),
    b = w.add(makeBody(0, 500, 466, 48));
  assert.equal(w.targetUnder(550), b);
  assert.equal(w.targetUnder(650), null);
  assert.equal(w.findCatch(650, 388), null);
});
