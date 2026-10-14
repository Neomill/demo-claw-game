// Art coordinates and gameplay tuning live here; changing the skin never changes the solver.
export const CONFIG = Object.freeze({
  width: 1080,
  height: 610,
  fixedStep: 1 / 120,
  maxSubSteps: 10,
  chamber: { left: 36, right: 1044, ceiling: 62, floor: 514, chuteRight: 220 },
  ball: {
    radius: 48,
    gravity: 1120,
    restitution: 0.38,
    friction: 0.992,
    count: 4,
  },
  claw: {
    minX: 130,
    maxX: 958,
    homeY: 103,
    speed: 320,
    acceleration: 1500,
    scale: 0.225,
    gripOffsetY: 78,
    maxY: 432,
  },
  grip: {
    reach: 1.22,
    spring: 190,
    damping: 25,
    maxStretch: 92,
    edgeSlipChance: 0.16,
  },
  spawnX: [355, 530, 705, 880],
  art: {
    ball: { x: 210, y: 163, width: 849, height: 855 },
    foot: { x: 644, y: 911, width: 228, height: 146 },
    // Foot placement in the original ball artwork's coordinate system.
    // Both toes face right; the rear foot sits higher and behind the body.
    feet: [
      { name: "rear", x: 884, y: 845, pivotX: 0.16, pivotY: 0.55 },
      { name: "front", x: 644, y: 911, pivotX: 0.16, pivotY: 0.55 },
    ],
    holderOrigin: { x: 627, y: 577 },
    left: { x: 223, y: 601, pivotX: 508, pivotY: 632 },
    center: { x: 576, y: 634, pivotX: 627, pivotY: 655 },
    right: { x: 708, y: 601, pivotX: 746, pivotY: 632 },
    holder: { x: 460, y: 483 },
  },
});
export const EXPRESSIONS = [
  "neutral",
  "happy",
  "excited",
  "surprised",
  "worried",
  "dizzy",
];
