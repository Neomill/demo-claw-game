import { CONFIG, EXPRESSIONS } from "../game/config.js";
import { damp, clamp } from "../core/math.js";

/** Body, face and independent foot joints share one sway transform. */
export class BallRig {
  constructor(textures, body) {
    const { Container, Sprite, Texture, Rectangle, Graphics } = PIXI;
    this.body = body;
    this.time = body.id * 1.73;
    this.expression = "happy";
    this.expressionUntil = 0;
    this.impactCooldown = 0;
    this.root = new Container();
    this.torso = new Container();
    this.visual = new Container();
    this.squash = { x: 1, y: 1 };
    this.root.addChild(this.visual);
    const crop = CONFIG.art.ball;
    const cut = (texture) =>
      new Texture({
        source: texture.source,
        frame: new Rectangle(crop.x, crop.y, crop.width, crop.height),
      });
    this.skin = new Sprite(cut(textures.ball));
    this.skin.anchor.set(0.5);
    this.skin.width = body.radius * 2;
    this.skin.height = body.radius * 2;
    this.feet = CONFIG.art.feet.map((placement) => {
      const joint = new Container();
      const c = CONFIG.art.foot,
        foot = new Sprite(
          new Texture({
            source: textures.foot.source,
            frame: new Rectangle(c.x, c.y, c.width, c.height),
          }),
        );
      // Register the exported foot at its original size, without mirroring.
      const scaleX = (body.radius * 2) / crop.width;
      const scaleY = (body.radius * 2) / crop.height;
      foot.anchor.set(placement.pivotX, placement.pivotY);
      foot.scale.set(scaleX, scaleY);
      joint.label = `${placement.name}-foot`;
      joint.position.set(
        (placement.x + c.width * placement.pivotX - crop.x - crop.width / 2) *
          scaleX,
        (placement.y + c.height * placement.pivotY - crop.y - crop.height / 2) *
          scaleY,
      );
      joint.addChild(foot);
      return joint;
    });
    this.visual.addChild(this.torso);
    this.torso.addChild(this.feet[0], this.skin);
    this.faces = Object.fromEntries(
      EXPRESSIONS.map((name) => {
        const sprite = new Sprite(cut(textures[`face-${name}`]));
        sprite.anchor.set(0.5);
        sprite.width = this.skin.width;
        sprite.height = this.skin.height;
        sprite.alpha = name === "happy" ? 1 : 0;
        this.torso.addChild(sprite);
        return [name, sprite];
      }),
    );
    this.torso.addChild(this.feet[1]);
    this.shadow = new Graphics()
      .ellipse(0, 0, body.radius * 0.88, 9)
      .fill({ color: 0x726272, alpha: 0.15 });
    this.setExpression(body.id % 2 ? "neutral" : "happy");
  }
  setExpression(name, hold = 0) {
    if (hold) this.expressionUntil = this.time + hold;
    if (this.expression === name) return;
    this.expression = name;
    for (const [key, sprite] of Object.entries(this.faces))
      gsap.to(sprite, {
        alpha: key === name ? 1 : 0,
        duration: 0.11,
        overwrite: true,
      });
  }
  impact(speed) {
    if (this.impactCooldown > 0) return;
    this.impactCooldown = 0.25;
    const strength = clamp(speed / 900, 0.07, 0.22);
    gsap.killTweensOf(this.squash);
    gsap
      .timeline()
      .to(this.squash, { x: 1 + strength, y: 1 - strength, duration: 0.07 })
      .to(this.squash, {
        x: 1,
        y: 1,
        duration: 0.52,
        ease: "elastic.out(1,.45)",
      });
    if (speed > 160) this.setExpression("dizzy", 1.2);
  }
  update(dt, alpha, paused = false) {
    if (paused) return;
    this.time += dt;
    this.impactCooldown -= dt;
    const b = this.body;
    this.root.visible = b.active;
    this.shadow.visible = b.active && !b.delivering;
    if (!b.active) return;
    this.root.position.set(
      b.previousX + (b.x - b.previousX) * alpha,
      b.previousY + (b.y - b.previousY) * alpha,
    );
    const airborne =
      b.held || (!b.grounded && b.y < CONFIG.chamber.floor - b.radius - 4);
    const breath = airborne ? 0 : Math.sin(this.time * 2.2) * 0.009;
    this.visual.scale.set(
      this.squash.x * (1 - breath),
      this.squash.y * (1 + breath),
    );
    this.torso.rotation = damp(
      this.torso.rotation,
      clamp(b.angle, -0.3, 0.3) +
        (b.held ? Math.sin(this.time * 5) * 0.025 : 0),
      9,
      dt,
    );
    this.feet.forEach((joint, i) => {
      const wiggle = airborne
        ? Math.sin(this.time * 10 + i * 2.7) * 0.24
        : Math.sin(this.time * 2.4 + i) * 0.015;
      joint.rotation = damp(
        joint.rotation,
        wiggle + clamp(b.vx / 700, -0.25, 0.25),
        12,
        dt,
      );
      joint.skew.x = airborne ? Math.sin(this.time * 7 + i) * 0.05 : 0;
    });
    const elevation = Math.max(0, CONFIG.chamber.floor - b.radius - b.y);
    this.shadow.position.set(b.x, CONFIG.chamber.floor + 12);
    this.shadow.scale.set(clamp(1 - elevation / 700, 0.35, 1));
    this.shadow.alpha = clamp(1 - elevation / 500, 0.12, 1);
    if (this.time > this.expressionUntil && !b.held && !b.delivering)
      this.setExpression(
        Math.sin(this.time * 0.65) > 0.1 ? "happy" : "neutral",
      );
  }
  destroy() {
    gsap.killTweensOf(this.squash);
    Object.values(this.faces).forEach((s) => gsap.killTweensOf(s));
    this.root.destroy({ children: true });
    this.shadow.destroy();
  }
}
