export type GameSfx = 'reveal' | 'vote' | 'jail' | 'success' | 'warning' | 'timeout';

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!audioContext) audioContext = new AudioContextCtor();
  return audioContext;
}

function tone(ctx: AudioContext, frequency: number, start: number, duration: number, gain = 0.055, type: OscillatorType = 'sine') {
  const osc = ctx.createOscillator();
  const volume = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.015);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(volume);
  volume.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export async function playGameSfx(kind: GameSfx) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') await ctx.resume().catch(() => undefined);
  const now = ctx.currentTime + 0.01;

  if (kind === 'reveal') {
    tone(ctx, 392, now, 0.22, 0.045, 'triangle');
    tone(ctx, 523, now + 0.09, 0.26, 0.05, 'triangle');
    tone(ctx, 659, now + 0.18, 0.3, 0.045, 'triangle');
  } else if (kind === 'vote') {
    tone(ctx, 330, now, 0.12, 0.05, 'square');
    tone(ctx, 440, now + 0.07, 0.14, 0.04, 'square');
  } else if (kind === 'jail') {
    tone(ctx, 180, now, 0.32, 0.065, 'sawtooth');
    tone(ctx, 125, now + 0.16, 0.42, 0.055, 'sawtooth');
  } else if (kind === 'success') {
    tone(ctx, 523, now, 0.18, 0.05, 'triangle');
    tone(ctx, 659, now + 0.1, 0.2, 0.05, 'triangle');
    tone(ctx, 784, now + 0.2, 0.28, 0.05, 'triangle');
  } else if (kind === 'warning') {
    tone(ctx, 740, now, 0.1, 0.035, 'square');
    tone(ctx, 740, now + 0.16, 0.1, 0.035, 'square');
  } else {
    tone(ctx, 220, now, 0.22, 0.05, 'square');
    tone(ctx, 165, now + 0.15, 0.34, 0.06, 'square');
  }
}
