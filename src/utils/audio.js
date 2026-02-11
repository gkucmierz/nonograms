let audioContext = null;
let masterGain = null;

export async function playFanfare() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  
  if (!audioContext) {
      audioContext = new AudioCtx();
  }
  
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch {
      return;
    }
  }
  
  // Re-create gain if needed or just use it. 
  // In the original code, it was created every time playFanfare was called?
  // Original: masterGain = audioContext.createGain();
  // It's better to create it once or manage it properly.
  // Let's stick to the original logic but encapsulated.
  
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.25; // Slightly louder but softer tone
  masterGain.connect(audioContext.destination);

  const now = audioContext.currentTime;

  const playNote = (freq, startTime, duration) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    // Mix of sine and triangle for a bell-like quality
    osc.type = 'sine'; 
    osc.frequency.value = freq;

    // Envelope for elegant bell/chime sound
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05); // Soft attack
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // Long release

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  };

  // C Major 7 Arpeggio sequence (C5, E5, G5, B5, C6) - Elegant & Uplifting
  const sequence = [
    { freq: 523.25, time: 0.0, dur: 0.8 }, // C5
    { freq: 659.25, time: 0.1, dur: 0.8 }, // E5
    { freq: 783.99, time: 0.2, dur: 0.8 }, // G5
    { freq: 987.77, time: 0.3, dur: 0.8 }, // B5 (Maj7)
    { freq: 1046.50, time: 0.4, dur: 2.0 }, // C6 (High C resolve)
    // Add a bass root note at the end for fullness
    { freq: 523.25, time: 0.4, dur: 2.0 }  // C5
  ];

  sequence.forEach(note => playNote(note.freq, now + note.time, note.dur));
}

export function cleanupAudio() {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  masterGain = null;
}
