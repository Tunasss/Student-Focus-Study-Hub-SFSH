/**
 * High-Fidelity Lo-Fi Music & Real Environmental Ambience Audio Mixer
 * Implements Section 6.4 (Audio Mixer) of Project Master v4:
 *   - 5 Lo-Fi Music Genres (Jazz, Soul/R&B, Acoustic Guitar, Midnight Synthwave, Piano)
 *   - 5 Real Environmental Soundscapes (Gentle Rain, Campus Cafe, Cozy Fireplace, Forest Birds, Ocean Waves)
 *   - Procedural 432Hz Binaural Beats and 528Hz Solfeggio completion chime.
 *   - Independent channel volume faders, master volume, and global mute.
 *   - Automatic loop playback with localStorage persistence.
 */

export const AUDIO_MIXER_STORAGE_KEY = 'sfsh_audio_mixer_state';

export const LOFI_GENRES = {
  jazz: {
    id: 'jazz',
    name: 'Lo-Fi Jazz Lounge',
    genre: 'Jazz & Chillhop',
    desc: 'Smoky Rhodes piano, mellow saxophone & smooth swing beats',
    descVi: 'Giai điệu Jazz thư thái, tiếng kèn saxophone êm dịu và nhịp trống chill',
    icon: '🎷',
    src: '/audio/tracks/lofi-jazz.mp3',
    bpm: '72 BPM',
  },
  rnb: {
    id: 'rnb',
    name: 'Lo-Fi Soul & R&B',
    genre: 'Soul & Slow Jam',
    desc: 'Deep warm 808 bass, silky keys & late-night room vibes',
    descVi: 'Nhịp R&B ấm áp, âm bass trầm sâu lắng đưa tâm trí vào dòng chảy tập trung',
    icon: '☕',
    src: '/audio/tracks/lofi-rnb.mp3',
    bpm: '68 BPM',
  },
  acoustic: {
    id: 'acoustic',
    name: 'Lo-Fi Acoustic Guitar',
    genre: 'Acoustic & Folk',
    desc: 'Delicate fingerpicked nylon strings and nostalgic warmth',
    descVi: 'Tiếng đàn guitar mộc mạc, nhẹ nhàng thanh lọc tâm trí',
    icon: '🎸',
    src: '/audio/tracks/lofi-acoustic.mp3',
    bpm: '75 BPM',
  },
  night: {
    id: 'night',
    name: 'Midnight Synthwave',
    genre: 'Synth & Chillwave',
    desc: 'Deep meditative analog synth pads for after-hours study',
    descVi: 'Không gian đêm yên tĩnh, âm thanh synth mơ màng cho những đêm thức muộn',
    icon: '🌌',
    src: '/audio/tracks/lofi-night.mp3',
    bpm: '70 BPM',
  },
  piano: {
    id: 'piano',
    name: 'Peaceful Study Piano',
    genre: 'Minimalist Piano',
    desc: 'Gentle felt piano chords and soft morning light ambiance',
    descVi: 'Tiếng đàn piano êm đềm, tạo khoảng lặng trong trẻo để ghi nhớ kiến thức',
    icon: '🎹',
    src: '/audio/tracks/lofi-piano.mp3',
    bpm: '65 BPM',
  },
};

export const DEFAULT_AUDIO_TRACKS = {
  binaural: {
    id: 'binaural',
    name: '432Hz Binaural Beats',
    subtitle: 'Alpha wave deep focus & flow state',
    subtitleVi: 'Sóng não Alpha kích hoạt tập trung sâu',
    icon: '🧘',
    volume: 0.6,
    isPlaying: false,
    src: null, // Procedural Web Audio synthesis
  },
  rain: {
    id: 'rain',
    name: 'Gentle Rain on Rooftop',
    subtitle: 'Real soothing rainfall and window drops',
    subtitleVi: 'Tiếng mưa rơi tí tách thật trên mái nhà',
    icon: '🌧️',
    volume: 0.5,
    isPlaying: false,
    src: '/audio/effects/rain.mp3',
  },
  cafe: {
    id: 'cafe',
    name: 'Campus Cafe Ambience',
    subtitle: 'Warm coffee shop murmur and cozy acoustic warmth',
    subtitleVi: 'Tiếng quán cafe học bài ấm cúng quen thuộc',
    icon: '☕',
    volume: 0.45,
    isPlaying: false,
    src: '/audio/effects/cafe.mp3',
  },
  campfire: {
    id: 'campfire',
    name: 'Crackling Fireplace',
    subtitle: 'Soothing wood fireside glow and crackles',
    subtitleVi: 'Tiếng củi lửa bập bùng sưởi ấm tâm trí',
    icon: '🔥',
    volume: 0.45,
    isPlaying: false,
    src: '/audio/effects/campfire.mp3',
  },
  forest: {
    id: 'forest',
    name: 'Forest Birds & Nature',
    subtitle: 'Tranquil canopy breeze and morning birdsong',
    subtitleVi: 'Tiếng gió rừng cây rì rào và chim hót trong lành',
    icon: '🍃',
    volume: 0.45,
    isPlaying: false,
    src: '/audio/effects/forest.mp3',
  },
  waves: {
    id: 'waves',
    name: 'Night Ocean Waves',
    subtitle: 'Rolling gentle shoreline tide under moonlight',
    subtitleVi: 'Tiếng sóng biển vỗ bờ đêm êm dịu',
    icon: '🌊',
    volume: 0.45,
    isPlaying: false,
    src: '/audio/effects/waves.mp3',
  },
  whitenoise: {
    id: 'whitenoise',
    name: 'White Noise',
    subtitle: 'Clean acoustic mask for background cancellation',
    subtitleVi: 'Lọc và triệt tiêu tiếng ồn gây xao nhãng',
    icon: '📻',
    volume: 0.3,
    isPlaying: false,
    src: null, // Procedural
  },
};

function createAudioElement(src) {
  if (typeof Audio === 'undefined') return null;
  try {
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'auto';
    return audio;
  } catch {
    return null;
  }
}

export function createAudioMixer() {
  let audioCtx = null;
  const activeNodes = {};
  const activeAudios = {};
  let musicAudio = null;

  let state = {
    masterVolume: 0.8,
    isMuted: false,
    activeMusicId: 'jazz',
    isMusicPlaying: false,
    musicVolume: 0.7,
    tracks: { ...DEFAULT_AUDIO_TRACKS },
  };

  // Restore persisted volume and preference states
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(AUDIO_MIXER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state.masterVolume = typeof parsed.masterVolume === 'number' ? parsed.masterVolume : 0.8;
        state.isMuted = !!parsed.isMuted;
        if (parsed.activeMusicId && LOFI_GENRES[parsed.activeMusicId]) {
          state.activeMusicId = parsed.activeMusicId;
        }
        if (typeof parsed.musicVolume === 'number') {
          state.musicVolume = parsed.musicVolume;
        }
        if (parsed.tracks) {
          Object.keys(DEFAULT_AUDIO_TRACKS).forEach((k) => {
            if (parsed.tracks[k]) {
              state.tracks[k] = {
                ...DEFAULT_AUDIO_TRACKS[k],
                volume:
                  typeof parsed.tracks[k].volume === 'number'
                    ? parsed.tracks[k].volume
                    : DEFAULT_AUDIO_TRACKS[k].volume,
                isPlaying: false, // Don't autoplay before user gesture
              };
            }
          });
        }
      }
    }
  } catch {
    // ignore
  }

  function persist() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          AUDIO_MIXER_STORAGE_KEY,
          JSON.stringify({
            masterVolume: state.masterVolume,
            isMuted: state.isMuted,
            activeMusicId: state.activeMusicId,
            musicVolume: state.musicVolume,
            tracks: state.tracks,
          })
        );
      }
    } catch {
      // ignore
    }
  }

  function getAudioContext() {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        try {
          audioCtx = new AudioContextClass();
        } catch {
          // ignore
        }
      }
    }
    return audioCtx;
  }

  function applyVolume(audioElem, trackVol) {
    if (!audioElem) return;
    const effective = state.isMuted ? 0 : state.masterVolume * trackVol;
    try {
      audioElem.volume = Math.min(1, Math.max(0, effective));
    } catch {
      // ignore
    }
  }

  function applyAllVolumes() {
    if (musicAudio) {
      applyVolume(musicAudio, state.musicVolume);
    }
    Object.keys(activeAudios).forEach((id) => {
      if (activeAudios[id] && state.tracks[id]) {
        applyVolume(activeAudios[id], state.tracks[id].volume);
      }
    });
  }

  // Procedural synthesizer for Binaural & White noise
  function startProceduralTrack(id) {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();

      if (id === 'binaural') {
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();
        const merger = ctx.createChannelMerger ? ctx.createChannelMerger(2) : null;
        const gainNode = ctx.createGain();

        oscLeft.type = 'sine';
        oscLeft.frequency.value = 432;
        oscRight.type = 'sine';
        oscRight.frequency.value = 442; // 10Hz difference for Alpha flow

        if (merger) {
          oscLeft.connect(merger, 0, 0);
          oscRight.connect(merger, 0, 1);
          merger.connect(gainNode);
        } else {
          oscLeft.connect(gainNode);
          oscRight.connect(gainNode);
        }

        const vol = state.isMuted ? 0 : state.masterVolume * state.tracks[id].volume;
        gainNode.gain.setValueAtTime(vol * 0.4, ctx.currentTime);
        gainNode.connect(ctx.destination);

        oscLeft.start();
        oscRight.start();
        activeNodes[id] = { oscLeft, oscRight, gainNode };
      } else if (id === 'whitenoise') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        const gainNode = ctx.createGain();
        const vol = state.isMuted ? 0 : state.masterVolume * state.tracks[id].volume;
        gainNode.gain.setValueAtTime(vol * 0.2, ctx.currentTime);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noise.start();
        activeNodes[id] = { noise, gainNode };
      }
    } catch {
      // ignore
    }
  }

  function stopProceduralTrack(id) {
    if (activeNodes[id]) {
      try {
        const node = activeNodes[id];
        if (node.oscLeft) node.oscLeft.stop();
        if (node.oscRight) node.oscRight.stop();
        if (node.noise) node.noise.stop();
      } catch {
        // ignore
      }
      delete activeNodes[id];
    }
  }

  return {
    getState: () => ({
      ...state,
      tracks: { ...state.tracks },
      effects: { ...state.tracks },
    }),

    // --- LO-FI MUSIC CONTROLS ---
    selectMusic: function (genreId) {
      if (!LOFI_GENRES[genreId]) return;

      if (state.activeMusicId === genreId && state.isMusicPlaying) {
        this.pauseMusic();
        return;
      }

      state.activeMusicId = genreId;
      if (musicAudio) {
        try {
          musicAudio.pause();
          musicAudio.currentTime = 0;
        } catch {
          // ignore
        }
      }

      const genre = LOFI_GENRES[genreId];
      musicAudio = createAudioElement(genre.src);
      if (musicAudio) {
        applyVolume(musicAudio, state.musicVolume);
        try {
          const p = musicAudio.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {});
          }
        } catch {
          // ignore
        }
      }
      state.isMusicPlaying = true;
      persist();
    },

    toggleMusic: function () {
      if (state.isMusicPlaying) {
        this.pauseMusic();
      } else {
        this.playMusic();
      }
    },

    playMusic: function () {
      if (!musicAudio) {
        const genre = LOFI_GENRES[state.activeMusicId] || LOFI_GENRES.jazz;
        musicAudio = createAudioElement(genre.src);
      }
      if (musicAudio) {
        applyVolume(musicAudio, state.musicVolume);
        try {
          const p = musicAudio.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {});
          }
        } catch {
          // ignore
        }
      }
      state.isMusicPlaying = true;
      persist();
    },

    pauseMusic: function () {
      if (musicAudio) {
        try {
          musicAudio.pause();
        } catch {
          // ignore
        }
      }
      state.isMusicPlaying = false;
      persist();
    },

    setMusicVolume: function (vol) {
      const v = Math.min(1, Math.max(0, vol));
      state.musicVolume = v;
      if (musicAudio) {
        applyVolume(musicAudio, v);
      }
      persist();
    },

    // --- AMBIENT SOUNDSCAPE CONTROLS ---
    toggleTrack: function (id) {
      if (!state.tracks[id]) return;
      if (state.tracks[id].isPlaying) {
        this.stopTrack(id);
      } else {
        this.startTrack(id);
      }
    },

    startTrack: function (id) {
      const track = state.tracks[id];
      if (!track) return;
      track.isPlaying = true;

      if (track.src) {
        // Real MP3 audio file
        if (!activeAudios[id]) {
          activeAudios[id] = createAudioElement(track.src);
        }
        const audio = activeAudios[id];
        if (audio) {
          applyVolume(audio, track.volume);
          try {
            const p = audio.play();
            if (p && typeof p.catch === 'function') {
              p.catch(() => {});
            }
          } catch {
            // ignore
          }
        }
      } else {
        // Procedural synthesis (Binaural, White noise)
        startProceduralTrack(id);
      }
      persist();
    },

    stopTrack: function (id) {
      const track = state.tracks[id];
      if (!track) return;
      track.isPlaying = false;

      if (activeAudios[id]) {
        try {
          activeAudios[id].pause();
          activeAudios[id].currentTime = 0;
        } catch {
          // ignore
        }
      }
      stopProceduralTrack(id);
      persist();
    },

    setTrackVolume: function (id, vol) {
      const v = Math.min(1, Math.max(0, vol));
      if (!state.tracks[id]) return;
      state.tracks[id].volume = v;

      if (activeAudios[id]) {
        applyVolume(activeAudios[id], v);
      }
      if (activeNodes[id]?.gainNode) {
        const effective = state.isMuted ? 0 : state.masterVolume * v;
        try {
          activeNodes[id].gainNode.gain.setValueAtTime(effective * 0.4, audioCtx.currentTime);
        } catch {
          // ignore
        }
      }
      persist();
    },

    // --- MASTER CONTROLS ---
    setMasterVolume: function (vol) {
      state.masterVolume = Math.min(1, Math.max(0, vol));
      applyAllVolumes();
      persist();
    },

    toggleMute: function () {
      state.isMuted = !state.isMuted;
      applyAllVolumes();
      persist();
    },

    toggleMasterMute: function () {
      this.toggleMute();
    },

    stopAll: function () {
      this.pauseMusic();
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

        // 528Hz Solfeggio frequency
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
