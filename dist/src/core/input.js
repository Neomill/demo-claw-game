export class InputController {
  constructor({ left, right, drop, onDrop, onPause }) {
    this.keys = new Set();
    this.pointers = new Map();
    this.abort = new AbortController();
    this.buttons = { left, right };
    const options = { signal: this.abort.signal };
    window.addEventListener(
      "keydown",
      (e) => {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
        if (["ArrowLeft", "ArrowRight", "Space"].includes(e.code))
          e.preventDefault();
        this.keys.add(e.code);
        if (e.code === "Space" && !e.repeat) onDrop();
        if (e.code === "KeyP" && !e.repeat) onPause();
        this.paint();
      },
      options,
    );
    window.addEventListener(
      "keyup",
      (e) => {
        this.keys.delete(e.code);
        this.paint();
      },
      options,
    );
    window.addEventListener("blur", () => this.clear(), options);
    for (const [button, direction] of [
      [left, -1],
      [right, 1],
    ]) {
      button.addEventListener(
        "pointerdown",
        (e) => {
          if (button.disabled) return;
          e.preventDefault();
          button.setPointerCapture(e.pointerId);
          this.pointers.set(e.pointerId, direction);
          this.paint();
        },
        options,
      );
      for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
        button.addEventListener(
          event,
          (e) => {
            this.pointers.delete(e.pointerId);
            this.paint();
          },
          options,
        );
    }
    drop.addEventListener("click", onDrop, options);
  }
  get axis() {
    const values = [...this.pointers.values()];
    return (
      Number(this.keys.has("ArrowRight") || values.includes(1)) -
      Number(this.keys.has("ArrowLeft") || values.includes(-1))
    );
  }
  paint() {
    this.buttons.left.classList.toggle("pressed", this.axis < 0);
    this.buttons.right.classList.toggle("pressed", this.axis > 0);
  }
  clear() {
    this.keys.clear();
    this.pointers.clear();
    this.paint();
  }
  destroy() {
    this.abort.abort();
    this.clear();
  }
}
