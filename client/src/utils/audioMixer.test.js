import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUDIO_MIXER_STORAGE_KEY,
  createAudioMixer,
  DEFAULT_AUDIO_TRACKS,
} from './audioMixer';

describe('audioMixer utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default tracks and volume levels', () => {
    const mixer = createAudioMixer();
    const state = mixer.getState();

    expect(state.masterVolume).toBe(0.8);
    expect(state.isMuted).toBe(false);
    expect(Object.keys(state.tracks)).toEqual(['binaural', 'rain', 'cafe', 'whitenoise']);
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

  it('toggles track playing state', () => {
    const mixer = createAudioMixer();
    expect(mixer.getState().tracks.cafe.isPlaying).toBe(false);

    mixer.toggleTrack('cafe');
    expect(mixer.getState().tracks.cafe.isPlaying).toBe(true);

    mixer.toggleTrack('cafe');
    expect(mixer.getState().tracks.cafe.isPlaying).toBe(false);
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

  it('stopAll stops all playing tracks', () => {
    const mixer = createAudioMixer();
    mixer.toggleTrack('rain');
    mixer.toggleTrack('binaural');

    expect(mixer.getState().tracks.rain.isPlaying).toBe(true);
    expect(mixer.getState().tracks.binaural.isPlaying).toBe(true);

    mixer.stopAll();

    expect(mixer.getState().tracks.rain.isPlaying).toBe(false);
    expect(mixer.getState().tracks.binaural.isPlaying).toBe(false);
  });
});
