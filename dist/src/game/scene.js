import { CONFIG } from "./config.js";

const COLORS = {
  ink: 0x493641,
  mint: 0xcce3d8,
  pale: 0xeee8ef,
  cream: 0xfffaf4,
  pink: 0xf3bfd1,
};
export function createScene(app) {
  const { Container, Graphics, Text } = PIXI;
  const root = new Container(),
    background = new Container(),
    shadows = new Container(),
    cable = new Container(),
    rearClaw = new Container(),
    balls = new Container(),
    claw = new Container(),
    foreground = new Container(),
    effects = new Container();
  root.addChild(
    background,
    shadows,
    cable,
    rearClaw,
    balls,
    claw,
    foreground,
    effects,
  );
  app.stage.addChild(root);
  const rect = (x, y, w, h, r, color, stroke = 0, width = 1) => {
    const g = new Graphics().roundRect(x, y, w, h, r).fill(color);
    if (stroke) g.stroke({ color: stroke, width });
    return g;
  };
  const text = (label, x, y, size = 12, color = COLORS.ink, weight = "600") => {
    const t = new Text({
      text: label,
      style: {
        fontFamily: "Arial",
        fontSize: size,
        fill: color,
        fontWeight: weight,
        letterSpacing: 1.5,
      },
    });
    t.position.set(x, y);
    return t;
  };
  background.addChild(rect(0, 0, 1080, 610, 0, COLORS.pale));
  const dots = new Graphics();
  for (let x = 22; x < 1080; x += 24)
    for (let y = 18; y < 530; y += 24)
      dots.circle(x, y, 0.85).fill({ color: 0xb8a9bd, alpha: 0.26 });
  background.addChild(dots);
  background.addChild(
    new Graphics()
      .ellipse(756, 283, 250, 180)
      .fill({ color: 0xf8eef1, alpha: 0.8 }),
  );
  background.addChild(
    new Graphics()
      .ellipse(378, 344, 179, 115)
      .fill({ color: 0xe4dfeb, alpha: 0.55 }),
  );
  // Decorative hangtags stay behind the physical playfield.
  background.addChild(text("GOOD THINGS", 793, 134, 13, 0xa495a6));
  background.addChild(text("ARE LOOKING UP.", 793, 155, 13, 0xa495a6));
  const sparkle = new Graphics()
    .moveTo(951, 113)
    .lineTo(951, 139)
    .moveTo(938, 126)
    .lineTo(964, 126)
    .stroke({ width: 2, color: 0xcbb8c6 });
  background.addChild(sparkle);
  background.addChild(rect(24, 43, 1032, 12, 6, 0xc8becd));
  background.addChild(rect(24, 43, 1032, 4, 2, 0x9e8e9f));
  background.addChild(rect(29, 38, 14, 21, 4, 0xb6a5b8));
  background.addChild(rect(1037, 38, 14, 21, 4, 0xb6a5b8));
  // Delivery lane has a visibly recessed opening rather than an invisible win trigger.
  background.addChild(rect(44, 386, 169, 206, 25, 0xb3cabc));
  background.addChild(rect(55, 400, 147, 181, 20, 0x798f85));
  background.addChild(rect(63, 405, 131, 153, 17, 0x526d61));
  background.addChild(text("HOME", 108, 438, 14, 0xd9eee0));
  background.addChild(
    new Graphics()
      .moveTo(130, 470)
      .lineTo(130, 492)
      .moveTo(120, 482)
      .lineTo(130, 492)
      .lineTo(140, 482)
      .stroke({ color: 0xd1e9da, width: 3, cap: "round", join: "round" }),
  );
  // Ball pit floor; the left-hand delivery lane stays physically open.
  foreground.addChild(rect(229, 526, 830, 80, 14, 0xe5d7e0));
  foreground.addChild(rect(229, 526, 830, 7, 3, 0xcab5c4));
  foreground.addChild(rect(46, 550, 166, 47, 13, 0xcce3d8, COLORS.ink, 2));
  foreground.addChild(text("PRIZE PICKUP", 66, 568, 12, 0x486653));
  foreground.addChild(text("HANDLE WITH HAPPY", 774, 562, 10, 0xa88e9f));
  foreground.addChild(new Graphics().circle(1016, 568, 5).fill(0xc3aaba));
  const aim = new Container(),
    aimLine = new Graphics(),
    aimRing = new Graphics();
  aim.addChild(aimLine, aimRing);
  background.addChild(aim);
  const mask = new Graphics().rect(0, 0, 1080, 610).fill(0xffffff);
  root.addChild(mask);
  root.mask = mask;
  return {
    root,
    background,
    shadows,
    cable,
    rearClaw,
    balls,
    claw,
    foreground,
    effects,
    aim,
    aimLine,
    aimRing,
    rect,
    text,
  };
}

export function updateAim(scene, x, y, visible, hasTarget, time) {
  scene.aim.visible = visible;
  if (!visible) return;
  scene.aimLine.clear();
  const color = hasTarget ? 0x86a795 : 0xbea6b8;
  for (let lineY = y + 136; lineY < CONFIG.chamber.floor - 4; lineY += 17)
    scene.aimLine
      .moveTo(x, lineY)
      .lineTo(x, lineY + 6)
      .stroke({ width: 1.6, color, alpha: 0.65 });
  scene.aimRing
    .clear()
    .ellipse(x, CONFIG.chamber.floor + 6, 28 + Math.sin(time * 3) * 2, 7)
    .stroke({ width: 2, color, alpha: 0.8 });
}

export class Particles {
  constructor(container, random) {
    this.container = container;
    this.random = random;
    this.items = [];
  }
  burst(x, y, count = 22) {
    const colors = [0xe9799c, 0xb4d6c0, 0xe7bf76, 0xa699c2, 0xffffff];
    for (let i = 0; i < count; i++) {
      const g = new PIXI.Graphics()
        .roundRect(-3, -5, 6, 10, 2)
        .fill(colors[i % colors.length]);
      g.position.set(x, y);
      this.container.addChild(g);
      this.items.push({
        g,
        vx: (this.random() - 0.5) * 340,
        vy: -100 - this.random() * 300,
        spin: (this.random() - 0.5) * 12,
        life: 1.2 + this.random() * 0.6,
      });
    }
  }
  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      p.vy += 450 * dt;
      p.g.x += p.vx * dt;
      p.g.y += p.vy * dt;
      p.g.rotation += p.spin * dt;
      p.g.alpha = Math.min(1, p.life * 2);
      if (p.life <= 0) {
        p.g.destroy();
        this.items.splice(i, 1);
      }
    }
  }
  clear() {
    this.items.forEach((p) => p.g.destroy());
    this.items = [];
  }
}
