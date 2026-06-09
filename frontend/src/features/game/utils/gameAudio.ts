const setupOscillator = (audioCtx: AudioContext, type: OscillatorType, freq: number) => {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  return { osc, gain };
};

const playClickSound = (audioCtx: AudioContext) => {
  const { osc, gain } = setupOscillator(audioCtx, 'sine', 600);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
};

const playCardSound = (audioCtx: AudioContext) => {
  const { osc, gain } = setupOscillator(audioCtx, 'triangle', 180);
  osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.12);
};

const playTimerSound = (audioCtx: AudioContext) => {
  const { osc, gain } = setupOscillator(audioCtx, 'sine', 750);
  gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
};

const playWinSound = (audioCtx: AudioContext) => {
  const { osc, gain } = setupOscillator(audioCtx, 'sine', 523.25);
  osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
  osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
  osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
};

export const playGameSound = (type: 'card' | 'click' | 'timer' | 'win', isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();

    if (type === 'click') playClickSound(audioCtx);
    else if (type === 'card') playCardSound(audioCtx);
    else if (type === 'timer') playTimerSound(audioCtx);
    else if (type === 'win') playWinSound(audioCtx);
  } catch (err) {
    console.warn('AudioContext failed:', err);
  }
};
