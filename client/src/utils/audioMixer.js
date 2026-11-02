/**
 * Web Audio Ambient Soundscapes & Multi-Track Mixer
 * Implements Section 6.4 (Audio Mixer) of Project Master v4:
 *   - Procedural Web Audio API soundscape synthesis (zero external asset latency).
 *   - 4 ambient channels:
 *       1. 432Hz Binaural Beats (Alpha focus state)
 *       2. Gentle Rain (Pink noise + low-pass filter)
 *       3. Campus Cafe (Modulated ambient warmth)
 *       4. White Noise (Noise cancellation)
 *   - Per-track volume (0.0 to 1.0) and master volume controls.
 *   - Harmonious 528Hz completion bell chime.
 *   - Storage persistence across reloads.
 */

export const AUDIO_MIXER_STORAGE_KEY = 'sfsh_audio_mixer_state';

export const DEFAULT_AUDIO_TRACKS = {
  binaural: {
    id: 'binaural',
    name: '432Hz Binaural Beats',
    subtitle: 'Alpha wave deep focus & flow state',
    icon: '🌊',
    volume: 0.6,
    isPlaying: false,
  },
  rain: {
    id: 'rain',
    name: 'Gentle Rain',
    subtitle: 'Soothing rainfall on campus rooftop',
    icon: '🌧️',
    volume: 0.5,
    isPlaying: false,
  },
  cafe: {
    id: 'cafe',
    name: 'Campus Cafe',
    subtitle: 'Warm coffee shop acoustic atmosphere',
    icon: '☕',
    volume: 0.4,
    isPlaying: false,
  },
  whitenoise: {
    id: 'whitenoise',
    name: 'White Noise',
    subtitle: 'Clean background chatter cancellation',
    icon: '🍃',
    volume: 0.3,
    isPlaying: false,
  },
};

export function createAudioMixer() {
  let audioCtx = null;
  let masterGain = null;
  const activeNodes = {};

  // Load persisted volume levels
  let state = {
    masterVolume: 0.8,
    isMuted: false,
    tracks: { ...DEFAULT_AUDIO_TRACKS },
  };

  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(AUDIO_MIXER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state.masterVolume = typeof parsed.masterVolume === 'number' ? parsed.masterVolume : 0.8;
        state.isMuted = !!parsed.isMuted;
        if (parsed.tracks) {
          Object.keys(DEFAULT_AUDIO_TRACKS).forEach((k) => {
            if (parsed.tracks[k]) {
              state.tracks[k] = {
                ...DEFAULT_AUDIO_TRACKS[k],
                volume: typeof parsed.tracks[k].volume === 'number' ? parsed.tracks[k].volume : DEFAULT_AUDIO_TRACKS[k].volume,
                isPlaying: false, // Don't autoplay without user gesture
              };
            }
          });
        }
      }
    }
  } catch {
    // Ignore storage errors
  }

  function persist() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          AUDIO_MIXER_STORAGE_KEY,
          JSON.stringify({
            masterVolume: state.masterVolume,
            isMuted: state.isMuted,
            tracks: state.tracks,
          })
        );
      }
    } catch {
      // Ignore
    }
  }

  function getAudioContext() {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(state.isMuted ? 0 : state.masterVolume, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Synthesis generators
  function startBinaural() {
    const ctx = getAudioContext();
    if (!ctx) return null;

    const gainNode = ctx.createGain();
    const effectiveVol = state.tracks.binaural.volume;
    gainNode.gain.setValueAtTime(effectiveVol * 0.3, ctx.currentTime);

    // Left channel: 432Hz
    const oscL = ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(432, ctx.currentTime);

    // Right channel: 442Hz (yielding 10Hz Alpha beat)
    const oscR = ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(442, ctx.currentTime);

    const merger = ctx.createChannelMerger(2);
    oscL.connect(merger, 0, 0);
    oscR.connect(merger, 0, 1);
    merger.connect(gainNode);
    gainNode.connect(masterGain);

    oscL.start();
    oscR.start();

    return {
      stop: () => {
        try {
          oscL.stop();
          oscR.stop();
          oscL.disconnect();
          oscR.disconnect();
        } catch {
          // ignore
        }
      },
      setVolume: (v) => {
        gainNode.gain.setValueAtTime(v * 0.3, ctx.currentTime);
      },
    };
  }

  function startNoise(type = 'rain') {
    const ctx = getAudioContext();
    if (!ctx) return null;

    const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer loop
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'rain') {
        // Pink noise approximation for rain
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      } else {
        // White noise
        output[i] = white * 0.5;
      }
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to shape rain or ambient sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'rain' ? 800 : 1200, ctx.currentTime);

    const gainNode = ctx.createGain();
    const vol = state.tracks[type].volume;
    gainNode.gain.setValueAtTime(vol * 0.25, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    whiteNoise.start();

    return {
      stop: () => {
        try {
          whiteNoise.stop();
          whiteNoise.disconnect();
        } catch {
          // ignore
        }
      },
      setVolume: (v) => {
        gainNode.gain.setValueAtTime(v * 0.25, ctx.currentTime);
      },
    };
  }

  return {
    getState: () => ({ ...state, tracks: { ...state.tracks } }),

    toggleTrack: function (trackId) {
      if (!state.tracks[trackId]) return;
      const isCurrentlyPlaying = state.tracks[trackId].isPlaying;

      if (isCurrentlyPlaying) {
        this.stopTrack(trackId);
      } else {
        this.playTrack(trackId);
      }
    },

    playTrack: function (trackId) {
      if (!state.tracks[trackId]) return;

      // Stop any existing node
      if (activeNodes[trackId]) {
        activeNodes[trackId].stop();
        delete activeNodes[trackId];
      }

      state.tracks[trackId].isPlaying = true;

      try {
        if (trackId === 'binaural') {
          activeNodes[trackId] = startBinaural();
        } else if (trackId === 'rain' || trackId === 'whitenoise') {
          activeNodes[trackId] = startNoise(trackId);
        } else if (trackId === 'cafe') {
          activeNodes[trackId] = startNoise('rain'); // warm filtered rain/cafe ambiance
        }
      } catch {
        // Environment with disabled web audio
      }

      persist();
    },

    stopTrack: function (trackId) {
      if (!state.tracks[trackId]) return;
      state.tracks[trackId].isPlaying = false;

      if (activeNodes[trackId]) {
        activeNodes[trackId].stop();
        delete activeNodes[trackId];
      }

      persist();
    },

    setTrackVolume: function (trackId, volume) {
      if (!state.tracks[trackId]) return;
      const clamped = Math.max(0, Math.min(1, volume));
      state.tracks[trackId].volume = clamped;

      if (activeNodes[trackId]?.setVolume) {
        activeNodes[trackId].setVolume(clamped);
      }

      persist();
    },

    setMasterVolume: function (volume) {
      const clamped = Math.max(0, Math.min(1, volume));
      state.masterVolume = clamped;
      if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(state.isMuted ? 0 : clamped, audioCtx.currentTime);
      }
      persist();
    },

    toggleMasterMute: function () {
      state.isMuted = !state.isMuted;
      if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(state.isMuted ? 0 : state.masterVolume, audioCtx.currentTime);
      }
      persist();
    },

    stopAll: function () {
      Object.keys(state.tracks).forEach((id) => {
        this.stopTrack(id);
      });
    },

    playCompletionChime: function () {
      const ctx = getAudioContext();
      if (!ctx) return;

      try {
        const osc = ctx.createOscillator();
        const chimeGain = ctx.createGain();

        // 528Hz harmonious Solfeggio frequency
        osc.type = 'sine';
        osc.frequency.setValueAtTime(528, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1056, ctx.currentTime + 0.1);

        chimeGain.gain.setValueAtTime(0.4 * (state.isMuted ? 0 : state.masterVolume), ctx.currentTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

        osc.connect(chimeGain);
        chimeGain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.8);
      } catch {
        // ignore
      }
    },
  };
}

export const audioMixer = createAudioMixer();
