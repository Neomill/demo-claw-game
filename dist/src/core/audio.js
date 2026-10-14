// Optional, synthesized effects: no network, audio files, or autoplay dependency.
export class AudioController {
  constructor() {
    this.enabled = false;
    this.context = null;
  }
  unlock() {
    if (!this.context)
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    return this.context.resume();
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.unlock();
      this.play("ready");
    }
    return this.enabled;
  }
  play(kind) {
    if (!this.enabled || !this.context) return;
    const notes = {
      ready: [523, 659],
      drop: [330, 262],
      grip: [392, 523],
      win: [523, 659, 784, 1047],
      bounce: [196],
      miss: [294, 247],
    }[kind] || [440];
    notes.forEach((frequency, i) => {
      const at = this.context.currentTime + i * 0.09,
        oscillator = this.context.createOscillator(),
        gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.055, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.18);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.2);
    });
  }
  destroy() {
    this.context?.close();
  }
}
