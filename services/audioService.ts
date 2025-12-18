// Utility to handle Base64 decoding and AudioBuffer creation for Gemini PCM audio

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  base64String: string,
  audioContext: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const audioData = decodeBase64(base64String);
  const numChannels = 1; // Gemini TTS usually returns mono
  const dataInt16 = new Int16Array(audioData.buffer);
  const frameCount = dataInt16.length;
  
  const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Convert Int16 PCM to Float32 [-1.0, 1.0]
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  return buffer;
}

export const playAudioBuffer = (
  buffer: AudioBuffer,
  context: AudioContext,
  onEnded?: () => void
): AudioBufferSourceNode => {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.onended = () => {
    if (onEnded) onEnded();
  };
  source.start();
  return source;
};