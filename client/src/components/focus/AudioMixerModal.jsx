import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';
import { LOFI_GENRES, audioMixer } from '../../utils/audioMixer';
import { GenreIcon, AudioTrackIcon, RadioIcon, MusicNoteIcon, LeafIcon } from '../icons/AppIcons';

export function AudioMixerModal({ isOpen, onClose }) {
  const { lang } = useLanguage();
  const [mixerState, setMixerState] = useState(() => audioMixer.getState());

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const t = {
    en: {
      badge: 'FOCUS STUDIO · LO-FI RADIO & SOUNDSCAPES',
      title: 'Lo-Fi Radio & Ambient Mixer',
      subtitle:
        'Select from 5 real recorded Lo-Fi genres and layer authentic environmental soundscapes.',
      lofiSection: 'Lo-Fi Focus Radio',
      lofiPlaying: 'Now Playing',
      lofiPaused: 'Music Paused',
      musicVolume: 'Music Volume',
      ambientSection: 'Environmental Soundscapes',
      ambientDesc: 'Layer authentic recorded field sounds over your music',
      masterVolume: 'Master Volume',
      muteAll: 'Mute All',
      unmuteAll: 'Unmute',
      stopAll: 'Stop All',
      close: 'Close',
    },
    vi: {
      badge: 'STUDIO TẬP TRUNG · ĐÀI LO-FI & ÂM THANH MÔI TRƯỜNG',
      title: 'Đài Lo-Fi & Bộ trộn âm thanh môi trường',
      subtitle:
        'Chọn từ 5 thể loại nhạc Lo-Fi thu âm thực tế và phối ghép các tiếng động môi trường tự nhiên.',
      lofiSection: 'Đài phát nhạc Lo-Fi học bài',
      lofiPlaying: 'Đang phát',
      lofiPaused: 'Tạm dừng nhạc',
      musicVolume: 'Âm lượng nhạc',
      ambientSection: 'Âm thanh môi trường thực tế',
      ambientDesc: 'Phối thêm tiếng mưa, tiếng quán cafe, tiếng lửa trại và thiên nhiên thật',
      masterVolume: 'Âm lượng tổng',
      muteAll: 'Tắt tiếng',
      unmuteAll: 'Bật lại tiếng',
      stopAll: 'Dừng tất cả',
      close: 'Đóng',
    },
  }[lang] || {};

  function handleSelectGenre(genreId) {
    audioMixer.selectMusic(genreId);
    setMixerState(audioMixer.getState());
  }

  function handleToggleMusic() {
    audioMixer.toggleMusic();
    setMixerState(audioMixer.getState());
  }

  function handleMusicVolume(val) {
    const vol = parseFloat(val);
    audioMixer.setMusicVolume(vol);
    setMixerState(audioMixer.getState());
  }

  function handleToggleTrack(trackId) {
    audioMixer.toggleTrack(trackId);
    setMixerState(audioMixer.getState());
  }

  function handleTrackVolume(trackId, value) {
    const vol = parseFloat(value);
    audioMixer.setTrackVolume(trackId, vol);
    setMixerState(audioMixer.getState());
  }

  function handleMasterVolume(value) {
    const vol = parseFloat(value);
    audioMixer.setMasterVolume(vol);
    setMixerState(audioMixer.getState());
  }

  function handleToggleMute() {
    audioMixer.toggleMasterMute();
    setMixerState(audioMixer.getState());
  }

  function handleStopAll() {
    audioMixer.stopAll();
    setMixerState(audioMixer.getState());
  }

  const activeEffectsCount = Object.values(mixerState.tracks).filter((t) => t.isPlaying).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-mixer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200 font-sans"
    >
      <div
        className="glass-card border border-border/90 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-border/60 flex items-start justify-between gap-4 bg-surface/50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-mono font-bold tracking-wide">
              {t.badge}
            </div>
            <h2 id="audio-mixer-title" className="text-xl font-black text-text tracking-tight mt-1">
              {t.title}
            </h2>
            <p className="text-xs text-muted mt-0.5">{t.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Lo-Fi Music Radio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RadioIcon className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                  {t.lofiSection}
                </h3>
              </div>

              {/* Music Play/Pause Toggle */}
              <button
                type="button"
                onClick={handleToggleMusic}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  mixerState.isMusicPlaying
                    ? 'bg-primary text-primary-fg shadow-xs'
                    : 'bg-surface border border-border text-muted hover:text-text'
                }`}
              >
                <span>{mixerState.isMusicPlaying ? '⏸' : '▶'}</span>
                <span>{mixerState.isMusicPlaying ? t.lofiPlaying : t.lofiPaused}</span>
              </button>
            </div>

            {/* Lo-Fi Genres Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {Object.values(LOFI_GENRES).map((genre) => {
                const isSelected = mixerState.activeMusicId === genre.id;
                const isPlaying = isSelected && mixerState.isMusicPlaying;

                return (
                  <div
                    key={genre.id}
                    onClick={() => handleSelectGenre(genre.id)}
                    className={`rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary/80 bg-primary/10 shadow-sm'
                        : 'border-border/70 bg-surface/60 hover:border-primary/40 hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-primary/25 text-primary' : 'bg-surface-2 text-muted'}`}>
                          <GenreIcon genreId={genre.id} className="w-5 h-5 text-current" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text leading-tight">{genre.name}</p>
                          <p className="text-[10px] text-muted">{genre.genre}</p>
                        </div>
                      </div>

                      {isPlaying ? (
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 h-3 bg-primary animate-pulse" />
                          <span className="w-0.5 h-2 bg-primary animate-pulse delay-75" />
                          <span className="w-0.5 h-3.5 bg-primary animate-pulse delay-150" />
                        </div>
                      ) : (
                        <span className="text-[9px] font-mono text-muted/70">{genre.bpm}</span>
                      )}
                    </div>

                    <p className="text-[10px] text-muted mt-2 line-clamp-2">
                      {lang === 'vi' ? genre.descVi : genre.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Music Volume Slider */}
            <div className="flex items-center gap-3 pt-1 px-1">
              <span className="text-xs text-muted flex items-center gap-1.5">
                <MusicNoteIcon className="w-3.5 h-3.5 text-primary" />
                <span>{t.musicVolume}:</span>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={mixerState.musicVolume}
                onChange={(e) => handleMusicVolume(e.target.value)}
                className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[11px] font-mono font-bold text-primary w-9 text-right">
                {Math.round(mixerState.musicVolume * 100)}%
              </span>
            </div>
          </div>

          <div className="border-t border-border/50" />

          {/* Section 2: Environmental Soundscapes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LeafIcon className="w-4 h-4 text-primary" />
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                    {t.ambientSection}
                  </h3>
                  <p className="text-[11px] text-muted">{t.ambientDesc}</p>
                </div>
              </div>
              {activeEffectsCount > 0 && (
                <span className="text-[10px] font-mono bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                  {activeEffectsCount} active
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {Object.values(mixerState.tracks).map((track) => {
                const isPlaying = track.isPlaying;

                return (
                  <div
                    key={track.id}
                    className={`rounded-2xl p-3 border transition-all ${
                      isPlaying
                        ? 'border-primary/50 bg-primary/10 shadow-xs'
                        : 'border-border/60 bg-surface/50 hover:border-border'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left info & toggle */}
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleTrack(track.id)}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm transition-all cursor-pointer ${
                            isPlaying
                              ? 'border-primary bg-primary text-black dark:text-black shadow-xs scale-105'
                              : 'border-border bg-surface text-muted hover:border-primary/40 hover:text-text'
                          }`}
                        >
                          <AudioTrackIcon trackId={track.id} className="w-4.5 h-4.5" />
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-text truncate">{track.name}</p>
                          </div>
                          <p className="text-[10px] text-muted truncate">
                            {lang === 'vi' ? track.subtitleVi || track.subtitle : track.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Right Volume Fader */}
                      <div className="flex items-center gap-2.5 shrink-0 pl-12 sm:pl-0">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={track.volume}
                          disabled={!isPlaying}
                          onChange={(e) => handleTrackVolume(track.id, e.target.value)}
                          className={`w-28 sm:w-32 h-1.5 rounded-lg appearance-none cursor-pointer accent-primary ${
                            isPlaying ? 'bg-surface-2' : 'bg-surface-2/40 opacity-40'
                          }`}
                        />
                        <span className="text-[11px] font-mono font-bold text-muted w-8 text-right">
                          {isPlaying ? `${Math.round(track.volume * 100)}%` : 'OFF'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: Master Controls */}
        <div className="px-6 py-4 border-t border-border/60 bg-surface/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          {/* Master volume slider */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-text shrink-0">{t.masterVolume}:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={mixerState.isMuted ? 0 : mixerState.masterVolume}
              onChange={(e) => handleMasterVolume(e.target.value)}
              className="w-full sm:w-32 h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[11px] font-mono font-bold text-primary w-8 text-right">
              {mixerState.isMuted ? '0%' : `${Math.round(mixerState.masterVolume * 100)}%`}
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleToggleMute}
              className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                mixerState.isMuted
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-400'
                  : 'border-border bg-surface text-muted hover:text-text'
              }`}
            >
              {mixerState.isMuted ? t.unmuteAll : t.muteAll}
            </button>

            <button
              type="button"
              onClick={handleStopAll}
              className="px-3 py-1.5 rounded-full border border-border bg-surface text-muted hover:text-text transition-colors cursor-pointer font-bold text-xs"
            >
              {t.stopAll}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 rounded-full bg-primary text-primary-fg font-bold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
