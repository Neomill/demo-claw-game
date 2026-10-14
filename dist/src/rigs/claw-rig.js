import { CONFIG } from "../game/config.js";
import { clamp, damp } from "../core/math.js";

export class ClawRig {
  constructor(textures) {
    const { Container, Sprite, TilingSprite } = PIXI;
    this.root = new Container();
    this.parts = new Container();
    this.root.addChild(this.parts);
    // Split render depth, shared motion: the center finger passes behind prizes.
    this.rearRoot = new Container();
    this.rearParts = new Container();
    this.rearRoot.addChild(this.rearParts);
    this.pose = { closure: 0 };
    this.motion = { x: 705, y: CONFIG.claw.homeY };
    this.previous = { ...this.motion };
    this.velocity = { x: 0, y: 0 };
    this.sway = 0;
    const s = CONFIG.claw.scale,
      origin = CONFIG.art.holderOrigin;
    this.cable = new TilingSprite({
      texture: textures["cable-tile"],
      width: 94 * s,
      height: 100,
    });
    this.cable.tileScale.set(s);
    this.cable.anchor.set(0.5, 0);
    this.joints = {};
    for (const name of ["left", "right", "center"]) {
      const data = CONFIG.art[name],
        joint = new Container(),
        sprite = new Sprite(textures[`claw-${name}`]);
      sprite.position.set(
        (data.x - data.pivotX) * s,
        (data.y - data.pivotY) * s,
      );
      sprite.scale.set(s);
      joint.position.set(
        (data.pivotX - origin.x) * s,
        (data.pivotY - origin.y) * s,
      );
      joint.addChild(sprite);
      (name === "center" ? this.rearParts : this.parts).addChild(joint);
      this.joints[name] = joint;
    }
    this.holder = new Sprite(textures["metal-holder"]);
    this.holder.scale.set(s);
    this.holder.position.set(
      (CONFIG.art.holder.x - origin.x) * s,
      (CONFIG.art.holder.y - origin.y) * s,
    );
    this.parts.addChild(this.holder);
  }
  setClosed(closed, duration = 0.42) {
    return gsap.to(this.pose, {
      closure: closed ? 1 : 0,
      duration,
      ease: "power2.inOut",
      overwrite: true,
    });
  }
  update(dt) {
    this.velocity.x = (this.motion.x - this.previous.x) / Math.max(dt, 0.001);
    this.velocity.y = (this.motion.y - this.previous.y) / Math.max(dt, 0.001);
    this.previous.x = this.motion.x;
    this.previous.y = this.motion.y;
    this.root.position.set(this.motion.x, this.motion.y);
    this.rearRoot.position.copyFrom(this.root.position);
    this.sway = damp(
      this.sway,
      clamp(-this.velocity.x * 0.00012, -0.045, 0.045),
      6,
      dt,
    );
    this.parts.rotation = this.sway;
    this.rearParts.rotation = this.sway;
    const closed = this.pose.closure;
    this.joints.left.rotation = 0.055 - closed * 0.39;
    this.joints.right.rotation = -0.055 + closed * 0.39;
    this.joints.center.scale.y = 1 + closed * 0.09;
    this.joints.center.skew.x = this.sway * 0.25;
    this.cable.position.set(this.motion.x, 44);
    this.cable.height = Math.max(1, this.motion.y - 44);
    this.cable.tilePosition.y = this.motion.y * 0.12;
  }
  get anchor() {
    return {
      x: this.motion.x + this.sway * -30,
      y: this.motion.y + CONFIG.claw.gripOffsetY,
      vx: this.velocity.x,
      vy: this.velocity.y,
    };
  }
  reset() {
    gsap.killTweensOf(this.motion);
    gsap.killTweensOf(this.pose);
    this.pose.closure = 0;
    this.motion.x = 705;
    this.motion.y = CONFIG.claw.homeY;
    this.previous = { ...this.motion };
    this.sway = 0;
    this.update(1 / 60);
  }
  destroy() {
    gsap.killTweensOf(this.motion);
    gsap.killTweensOf(this.pose);
    this.root.destroy({ children: true });
    this.rearRoot.destroy({ children: true });
    this.cable.destroy();
  }
}
