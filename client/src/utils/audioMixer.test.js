import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUDIO_MIXER_STORAGE_KEY,
  createAudioMixer,
  DEFAULT_AUDIO_TRACKS,
  LOFI_GENRES,
} from './audioMixer';

describe('audioMixer utility', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock HTMLMediaElement in JSDOM
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default tracks, lofi music and volume levels', () => {
    const mixer = createAudioMixer();
    const state = mixer.getState();

    expect(state.masterVolume).toBe(0.8);
    expect(state.isMuted).toBe(false);
    expect(state.activeMusicId).toBe('jazz');
    expect(state.isMusicPlaying).toBe(false);
    expect(Object.keys(state.tracks)).toEqual([
      'binaural',
      'rain',
      'cafe',
      'campfire',
      'forest',
      'waves',
      'whitenoise',
    ]);
    expect(state.tracks.binaural.volume).toBe(DEFAULT_AUDIO_TRACKS.binaural.volume);
    expect(state.tracks.binaural.isPlaying).toBe(false);
  });

  it('updates track volume and persists to localStorage', () => {
    const mixer = createAudioMixer();
    mixer.setTrackVolume('rain', 0.45);

    const state = mixer.getState();
    expect(state.tracks.rain.volume).toBe(0.45);

    const saved = JSON.parse(localStorage.getItem(AUDIO_MIXER_STORAGE_KEY));
    expect(saved.tracks.rain.volume).toBe(0.45);
  });

  it('toggles environmental sound track playing state', () => {
    const mixer = createAudioMixer();
    expect(mixer.getState().tracks.cafe.isPlaying).toBe(false);

    mixer.toggleTrack('cafe');
    expect(mixer.getState().tracks.cafe.isPlaying).toBe(true);

    mixer.toggleTrack('cafe');
    expect(mixer.getState().tracks.cafe.isPlaying).toBe(false);
  });

  it('switches lo-fi music genre and updates volume', () => {
    const mixer = createAudioMixer();
    expect(mixer.getState().activeMusicId).toBe('jazz');

    mixer.selectMusic('rnb');
    expect(mixer.getState().activeMusicId).toBe('rnb');
    expect(mixer.getState().isMusicPlaying).toBe(true);

    mixer.setMusicVolume(0.85);
    expect(mixer.getState().musicVolume).toBe(0.85);

    mixer.pauseMusic();
    expect(mixer.getState().isMusicPlaying).toBe(false);
  });

  it('toggles master mute and stops/mutes active sound', () => {
    const mixer = createAudioMixer();
    mixer.setMasterVolume(0.9);
    expect(mixer.getState().isMuted).toBe(false);

    mixer.toggleMasterMute();
    expect(mixer.getState().isMuted).toBe(true);

    mixer.toggleMasterMute();
    expect(mixer.getState().isMuted).toBe(false);
  });

  it('stopAll stops all playing tracks and music', () => {
    const mixer = createAudioMixer();
    mixer.selectMusic('jazz');
    mixer.toggleTrack('rain');
    mixer.toggleTrack('campfire');

    expect(mixer.getState().isMusicPlaying).toBe(true);
    expect(mixer.getState().tracks.rain.isPlaying).toBe(true);

    mixer.stopAll();

    expect(mixer.getState().isMusicPlaying).toBe(false);
    expect(mixer.getState().tracks.rain.isPlaying).toBe(false);
    expect(mixer.getState().tracks.campfire.isPlaying).toBe(false);
  });
});
