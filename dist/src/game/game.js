import { CONFIG } from "./config.js";
import { PhysicsWorld, makeBody } from "./physics.js";
import { BallRig } from "../rigs/ball-rig.js";
import { ClawRig } from "../rigs/claw-rig.js";
import { createScene, updateAim, Particles } from "./scene.js";
import { InputController } from "../core/input.js";
import { AudioController } from "../core/audio.js";
import { GameUI } from "./ui.js";
import { clamp, damp, seededRandom } from "../core/math.js";

/** Owns the round state machine. Only this class starts/stops a grab sequence. */
export class ClawGame {
  constructor(app, textures) {
    this.app = app;
    this.textures = textures;
    this.scene = createScene(app);
    this.ui = new GameUI();
    this.audio = new AudioController();
    this.random = seededRandom();
    this.particles = new Particles(this.scene.effects, this.random);
    this.claw = new ClawRig(textures);
    this.scene.cable.addChild(this.claw.cable);
    this.scene.rearClaw.addChild(this.claw.rearRoot);
    this.scene.claw.addChild(this.claw.root);
    this.world = new PhysicsWorld(CONFIG, (body, speed) => {
      this.rigs.get(body.id)?.impact(speed);
      if (speed > 180) this.audio.play("bounce");
    });
    this.rigs = new Map();
    this.timeline = null;
    this.delayed = [];
    this.time = 0;
    this.accumulator = 0;
    this.moveVelocity = 0;
    this.paused = false;
    this.autoPaused = false;
    this.attempts = 0;
    this.score = 0;
    this.state = "aim";
    this.destroyed = false;
    this.input = new InputController({
      left: this.ui.left,
      right: this.ui.right,
      drop: this.ui.drop,
      onDrop: () => this.drop(),
      onPause: () => this.togglePause(),
    });
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    document
      .querySelector("#pause")
      .addEventListener("click", () => this.togglePause(), options);
    document
      .querySelector("#resume")
      .addEventListener("click", () => this.togglePause(), options);
    document
      .querySelector("#reset")
      .addEventListener("click", () => this.reset(), options);
    document
      .querySelector("#replay")
      .addEventListener("click", () => this.reset(), options);
    document.querySelector("#sound").addEventListener(
      "click",
      () => {
        const on = this.audio.toggle();
        document.querySelector("#sound-state").textContent = on ? "ON" : "OFF";
        document
          .querySelector("#sound")
          .setAttribute("aria-pressed", String(on));
        document
          .querySelector("#sound")
          .setAttribute("aria-label", on ? "Turn sound off" : "Turn sound on");
      },
      options,
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden && !this.paused) {
          this.autoPaused = true;
          this.setPaused(true);
        } else if (!document.hidden && this.autoPaused) {
          this.autoPaused = false;
          this.setPaused(false);
        }
      },
      options,
    );
    window.addEventListener("resize", () => this.resize(), options);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(document.querySelector("#game"));
    this.tick = () =>
      this.update(Math.min(this.app.ticker.deltaMS / 1000, 0.075));
    app.ticker.add(this.tick);
    this.reset();
    this.resize();
  }
  resize() {
    const box = document.querySelector("#game").getBoundingClientRect();
    if (!box.width || !box.height) return;
    this.app.renderer.resize(box.width, box.height);
    const scale = Math.min(
      box.width / CONFIG.width,
      box.height / CONFIG.height,
    );
    this.scene.root.scale.set(scale);
    this.scene.root.position.set(
      (box.width - CONFIG.width * scale) / 2,
      (box.height - CONFIG.height * scale) / 2,
    );
  }
  transition(state, message) {
    this.state = state;
    this.ui.setState(state);
    if (message) this.ui.message(message);
  }
  reset() {
    this.timeline?.kill();
    this.timeline = null;
    this.delayed.forEach((t) => t.kill());
    this.delayed = [];
    this.setPaused(false);
    this.input.clear();
    this.world.detach();
    this.world.bodies = [];
    for (const rig of this.rigs.values()) rig.destroy();
    this.rigs.clear();
    this.particles.clear();
    this.random = seededRandom();
    this.particles.random = this.random;
    this.claw.reset();
    this.score = 0;
    this.attempts = 0;
    this.accumulator = 0;
    this.moveVelocity = 0;
    this.time = 0;
    CONFIG.spawnX.forEach((x, id) => {
      const body = this.world.add(
        makeBody(
          id,
          x,
          CONFIG.chamber.floor - CONFIG.ball.radius - 28 - id * 9,
          CONFIG.ball.radius,
        ),
      );
      const rig = new BallRig(this.textures, body);
      this.rigs.set(id, rig);
      this.scene.shadows.addChild(rig.shadow);
      this.scene.balls.addChild(rig.root);
    });
    this.ui.reset();
    this.transition("aim");
  }
  drop() {
    if (this.state !== "aim" || this.paused) return false;
    this.attempts++;
    this.input.clear();
    this.moveVelocity = 0;
    this.audio.play("drop");
    const target = this.world.targetUnder(this.claw.motion.x);
    const destination = target
      ? clamp(target.y - CONFIG.claw.gripOffsetY, 180, CONFIG.claw.maxY)
      : CONFIG.claw.maxY;
    if (target) this.rigs.get(target.id).setExpression("surprised", 3);
    this.transition(
      "descending",
      target
        ? "A little surprise is on its way…"
        : "Let’s see who’s down here.",
    );
    this.timeline = gsap
      .timeline()
      .to(this.claw.motion, {
        y: destination,
        duration: 1.15,
        ease: "power2.inOut",
      })
      .call(() => this.close());
    return true;
  }
  close() {
    this.transition("closing", "A gentle squeeze. Hold on, little buddy.");
    const candidate = this.world.findCatch(
      this.claw.motion.x,
      this.claw.motion.y,
    );
    if (candidate) this.rigs.get(candidate.id).setExpression("worried", 0.85);
    this.timeline = gsap
      .timeline()
      .to(this.claw.pose, { closure: 1, duration: 0.46, ease: "back.out(1.1)" })
      .to({}, { duration: 0.1 })
      .call(() => this.lift(candidate));
  }
  lift(candidate) {
    // Recheck after the fingers close in case another physical body moved the target.
    const body =
      candidate?.active &&
      Math.hypot(
        candidate.x - this.claw.anchor.x,
        candidate.y - this.claw.anchor.y,
      ) < CONFIG.grip.maxStretch
        ? candidate
        : null;
    if (body) {
      this.world.attach(body, this.claw.anchor);
      this.audio.play("grip");
      const quality = this.world.quality(body, this.claw.motion.x);
      this.rigs.get(body.id).setExpression("excited", 4);
      this.transition("lifting", "Got you! Enjoy the ride.");
      const slip = quality < 0.32 && this.random() < CONFIG.grip.edgeSlipChance;
      this.timeline = gsap
        .timeline()
        .to(this.claw.motion, {
          y: CONFIG.claw.homeY,
          duration: 1.9,
          ease: "power2.inOut",
        })
        .call(() => this.carry());
      if (slip) {
        const call = gsap.delayedCall(0.85, () => this.slip());
        this.delayed.push(call);
      }
    } else {
      this.audio.play("miss");
      this.transition(
        "lifting",
        "Just missed! Try lining up with the middle of a friend.",
      );
      this.timeline = gsap
        .timeline()
        .to(this.claw.motion, {
          y: CONFIG.claw.homeY,
          duration: 1.25,
          ease: "power2.inOut",
        })
        .call(() => this.returnToAim());
    }
  }
  slip() {
    const body = this.world.detach();
    if (!body) return;
    body.vx += 25;
    body.angularVelocity = 1.1;
    this.rigs.get(body.id).setExpression("worried", 1.1);
    this.ui.message(
      "Whoops, a slippery edge! A centered grab will hold tighter.",
    );
    gsap.to(this.claw.pose, { closure: 0.3, duration: 0.22 });
  }
  carry() {
    if (!this.world.grip) {
      this.returnToAim();
      return;
    }
    this.transition("carrying", "Special delivery to the happy place.");
    this.timeline = gsap
      .timeline()
      .to(this.claw.motion, { x: 130, duration: 1.9, ease: "power2.inOut" })
      .to(this.claw.motion, { y: 270, duration: 0.75, ease: "power2.inOut" })
      .call(() => this.release());
  }
  release() {
    this.transition("releasing", "Home sweet home.");
    this.timeline = gsap
      .timeline()
      .to(this.claw.pose, { closure: 0, duration: 0.35, ease: "power2.inOut" })
      .call(() => {
        const body = this.world.detach();
        if (body) {
          body.delivering = true;
          body.vx *= 0.2;
          body.angularVelocity = 0.3;
          this.rigs.get(body.id).setExpression("happy", 10);
        }
      })
      .to({}, { duration: 0.75 })
      .call(() => this.returnHome());
  }
  returnHome() {
    if (this.score === CONFIG.ball.count) {
      this.finish();
      return;
    }
    this.transition("returning", "There’s room for another little friend.");
    const next = this.world.bodies.find((b) => b.active && !b.delivering);
    this.timeline = gsap
      .timeline()
      .to(this.claw.motion, {
        y: CONFIG.claw.homeY,
        duration: 0.65,
        ease: "power2.inOut",
      })
      .to(this.claw.motion, {
        x: next ? clamp(next.x, CONFIG.claw.minX, CONFIG.claw.maxX) : 705,
        duration: 0.9,
        ease: "power2.inOut",
      })
      .call(() => this.returnToAim());
  }
  returnToAim() {
    if (this.score === CONFIG.ball.count) {
      this.finish();
      return;
    }
    gsap.to(this.claw.pose, { closure: 0, duration: 0.3, overwrite: true });
    this.transition(
      "aim",
      this.score
        ? "Another friend is waiting for a lift."
        : "Line up over a friend, then make their day.",
    );
  }
  rescue(body) {
    body.active = false;
    this.score++;
    this.ui.setScore(this.score);
    this.audio.play("win");
    this.particles.burst(130, 443, 27);
    if (this.score === CONFIG.ball.count && this.state === "aim") this.finish();
  }
  finish() {
    this.timeline?.kill();
    this.transition(
      "complete",
      "Every little friend is home. Beautifully done.",
    );
    this.particles.burst(540, 200, 55);
    this.ui.complete(this.attempts);
  }
  update(dt) {
    if (this.paused || this.destroyed) return;
    this.time += dt;
    if (this.state === "aim") {
      const axis = this.input.axis;
      this.moveVelocity = damp(
        this.moveVelocity,
        axis * CONFIG.claw.speed,
        axis ? 10 : 14,
        dt,
      );
      this.claw.motion.x = clamp(
        this.claw.motion.x + this.moveVelocity * dt,
        CONFIG.claw.minX,
        CONFIG.claw.maxX,
      );
    }
    this.claw.update(dt);
    if (this.world.grip) this.world.grip.anchor = this.claw.anchor;
    this.accumulator = Math.min(
      this.accumulator + dt,
      CONFIG.fixedStep * CONFIG.maxSubSteps,
    );
    while (this.accumulator >= CONFIG.fixedStep) {
      this.world.step(CONFIG.fixedStep);
      this.accumulator -= CONFIG.fixedStep;
    }
    for (const body of this.world.bodies) {
      if (body.active && body.delivering && body.y > 570) this.rescue(body);
    }
    const alpha = this.accumulator / CONFIG.fixedStep;
    for (const rig of this.rigs.values()) rig.update(dt, alpha);
    this.particles.update(dt);
    updateAim(
      this.scene,
      this.claw.motion.x,
      this.claw.motion.y,
      this.state === "aim",
      Boolean(this.world.targetUnder(this.claw.motion.x)),
      this.time,
    );
  }
  togglePause() {
    if (this.state === "complete") return;
    this.autoPaused = false;
    this.setPaused(!this.paused);
  }
  setPaused(paused) {
    this.paused = paused;
    this.input?.clear();
    this.ui?.setPaused(paused);
    if (paused) gsap.globalTimeline.pause();
    else gsap.globalTimeline.resume();
    this.accumulator = 0;
  }
  snapshot() {
    return {
      state: this.state,
      paused: this.paused,
      score: this.score,
      attempts: this.attempts,
      claw: {
        x: this.claw.motion.x,
        y: this.claw.motion.y,
        closure: this.claw.pose.closure,
      },
      gripped: this.world.grip?.body.id ?? null,
      balls: this.world.bodies.map((b) => ({
        id: b.id,
        x: b.x,
        y: b.y,
        vx: b.vx,
        vy: b.vy,
        active: b.active,
        held: b.held,
        delivering: b.delivering,
        expression: this.rigs.get(b.id).expression,
      })),
    };
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.timeline?.kill();
    this.delayed.forEach((t) => t.kill());
    this.input.destroy();
    this.abort.abort();
    this.resizeObserver.disconnect();
    this.app.ticker.remove(this.tick);
    this.rigs.forEach((r) => r.destroy());
    this.claw.destroy();
    this.particles.clear();
    this.audio.destroy();
    this.scene.root.destroy({ children: true });
    gsap.globalTimeline.resume();
  }
}
