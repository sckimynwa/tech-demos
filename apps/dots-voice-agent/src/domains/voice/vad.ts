export const VAD_TARGET_RATE = 16000;
export const VAD_SILENCE_MS = 700;
export const VAD_MIN_SPEECH_MS = 280;
export const VAD_MAX_SPEECH_MS = 12000;
export const VAD_SPEECH_RMS = 0.018;

export type VadController = {
  stop: () => void;
};

function downsample(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) {
    return input;
  }
  const ratio = fromRate / toRate;
  const out = new Float32Array(Math.max(1, Math.floor(input.length / ratio)));
  for (let i = 0; i < out.length; i += 1) {
    const src = i * ratio;
    const lo = Math.floor(src);
    const hi = Math.min(lo + 1, input.length - 1);
    const frac = src - lo;
    out[i] = input[lo] * (1 - frac) + input[hi] * frac;
  }
  return out;
}

function rms(frame: Float32Array) {
  let sum = 0;
  for (const sample of frame) {
    sum += sample * sample;
  }
  return Math.sqrt(sum / Math.max(1, frame.length));
}

export function encodePcm16Base64(samples: Float32Array) {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i += 1) {
    const clipped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(i * 2, Math.round(clipped * 32767), true);
  }
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function startEnergyVad(
  stream: MediaStream,
  onUtterance: (pcm16: string, sampleRate: number) => void,
  onSpeech: (speaking: boolean) => void,
): VadController {
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const node = context.createScriptProcessor(4096, 1, 1);
  const mute = context.createGain();
  mute.gain.value = 0;

  let speaking = false;
  let silenceMs = 0;
  let collected: Float32Array[] = [];
  let collectedSamples = 0;

  const flush = () => {
    if (collectedSamples === 0) {
      return;
    }
    const merged = new Float32Array(collectedSamples);
    let offset = 0;
    for (const chunk of collected) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    const durationMs = (merged.length / VAD_TARGET_RATE) * 1000;
    collected = [];
    collectedSamples = 0;
    if (durationMs < VAD_MIN_SPEECH_MS) {
      return;
    }
    onUtterance(encodePcm16Base64(merged), VAD_TARGET_RATE);
  };

  node.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    const frame = downsample(input, context.sampleRate, VAD_TARGET_RATE);
    const level = rms(frame);
    const frameMs = (frame.length / VAD_TARGET_RATE) * 1000;
    const isSpeech = level >= VAD_SPEECH_RMS;

    if (isSpeech) {
      if (!speaking) {
        speaking = true;
        onSpeech(true);
      }
      collected.push(frame);
      collectedSamples += frame.length;
      silenceMs = 0;
      const heldMs = (collectedSamples / VAD_TARGET_RATE) * 1000;
      if (heldMs >= VAD_MAX_SPEECH_MS) {
        speaking = false;
        onSpeech(false);
        flush();
      }
      return;
    }

    if (!speaking) {
      return;
    }
    collected.push(frame);
    collectedSamples += frame.length;
    silenceMs += frameMs;
    if (silenceMs >= VAD_SILENCE_MS) {
      speaking = false;
      onSpeech(false);
      flush();
    }
  };

  source.connect(node);
  node.connect(mute);
  mute.connect(context.destination);

  return {
    stop() {
      node.disconnect();
      source.disconnect();
      mute.disconnect();
      void context.close();
    },
  };
}
