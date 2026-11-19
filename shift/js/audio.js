const AC = window.AudioContext || window.webkitAudioContext;

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ac() {
    if (muted || !AC) return null;
    try {
      if (!ctx) ctx = new AC();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  function tone(freq, dur, type, gain, slide) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, gain, freq) {
    const c = ac();
    if (!c) return;
    const length = Math.floor(c.sampleRate * dur);
    const buffer = c.createBuffer(1, length, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = freq;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(c.destination);
    src.start();
  }

  return {
    setMuted(value) {
      muted = !!value;
      if (!muted) ac();
    },
    resume() {
      ac();
    },
    coin() {
      tone(880, 0.07, "square", 0.05, 1320);
    },
    shift() {
      tone(180, 0.16, "sawtooth", 0.045, 720);
      tone(540, 0.12, "triangle", 0.03, 880);
    },
    hit() {
      noise(0.22, 0.18, 420);
      tone(120, 0.18, "square", 0.06, 50);
    },
    pass() {
      tone(523, 0.1, "triangle", 0.05, 660);
      tone(784, 0.14, "sine", 0.04, 1046);
    },
    warn() {
      tone(740, 0.06, "square", 0.03, 520);
    },
    deny() {
      tone(140, 0.08, "square", 0.04, 90);
    },
    tick() {
      tone(320, 0.03, "square", 0.02);
    },
    click() {
      tone(660, 0.05, "square", 0.03, 880);
    },
    die() {
      noise(0.35, 0.2, 280);
      tone(220, 0.4, "sawtooth", 0.06, 40);
    },
  };
}
