const TITLES = {
  aim: "READY TO PLAY",
  descending: "GOING IN",
  closing: "GENTLE SQUEEZE",
  lifting: "UP, UP & AWAY",
  carrying: "COMING HOME",
  releasing: "SPECIAL DELIVERY",
  returning: "ONE MORE TRY",
  complete: "HAPPY TOGETHER",
};
export class GameUI {
  constructor() {
    this.drop = document.querySelector("#drop");
    this.left = document.querySelector("#left");
    this.right = document.querySelector("#right");
    this.messageElement = document.querySelector("#game-message");
    this.state = "aim";
    this.paused = false;
  }
  setState(state) {
    this.state = state;
    document.querySelector("#status-short").textContent =
      TITLES[state] || state.toUpperCase();
    this.sync();
  }
  sync() {
    const ready = this.state === "aim" && !this.paused;
    this.drop.disabled = !ready;
    this.left.disabled = !ready;
    this.right.disabled = !ready;
    this.drop.querySelector(".drop-label").textContent =
      this.state === "complete"
        ? "ALL FRIENDS HOME"
        : ready
          ? "DROP CLAW"
          : "A LITTLE PATIENCE";
  }
  message(text) {
    this.messageElement.textContent = text;
  }
  setScore(score) {
    document.querySelector("#score").textContent = String(score).padStart(
      2,
      "0",
    );
  }
  setPaused(paused) {
    this.paused = paused;
    document.querySelector("#pause-cover").hidden = !paused;
    document
      .querySelector("#pause")
      .setAttribute("aria-label", paused ? "Resume game" : "Pause game");
    this.sync();
  }
  complete(attempts) {
    document.querySelector("#win-summary").textContent =
      `Four little friends, home in ${attempts} ${attempts === 1 ? "try" : "tries"}.`;
    document.querySelector("#win-cover").hidden = false;
  }
  reset() {
    this.setScore(0);
    document.querySelector("#win-cover").hidden = true;
    this.setPaused(false);
    this.message("Line up over a friend, then make their day.");
    this.setState("aim");
  }
}
