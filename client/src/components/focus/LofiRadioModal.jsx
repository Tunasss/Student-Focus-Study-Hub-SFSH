import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';
import { LOFI_GENRES, audioMixer } from '../../utils/audioMixer';

export function LofiRadioModal({ isOpen, onClose }) {
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

  // Keep state synced reactively on track/genre events without polling
  useEffect(() => {
    if (!isOpen) return undefined;
    const unsubTrack = audioMixer.onTrackChange(() => {
      setMixerState(audioMixer.getState());
    });
    const unsubGenre = audioMixer.onGenreSwitch(() => {
      setMixerState(audioMixer.getState());
    });
    return () => {
      unsubTrack?.();
      unsubGenre?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isVi = lang === 'vi';
  const activeGenreId = mixerState.activeMusicId || 'jazzhop';
  const currentGenre = LOFI_GENRES[activeGenreId] || Object.values(LOFI_GENRES)[0];
  const tracks = currentGenre?.tracks || [];
  const currentTrackIndex = mixerState.currentTrackIndex || 0;
  const currentTrack = tracks[currentTrackIndex] || {
    id: 'track-1',
    title: currentGenre.name,
    category: activeGenreId,
  };

  function handleSelectGenre(genreId) {
    audioMixer.selectMusic(genreId, 0);
    setMixerState(audioMixer.getState());
  }

  function handleSelectTrack(index) {
    audioMixer.playTrack(activeGenreId, index);
    setMixerState(audioMixer.getState());
  }

  function handleToggleMusic() {
    audioMixer.toggleMusic();
    setMixerState(audioMixer.getState());
  }

  function handleNextTrack() {
    audioMixer.nextTrack();
    setMixerState(audioMixer.getState());
  }

  function handlePrevTrack() {
    audioMixer.prevTrack();
    setMixerState(audioMixer.getState());
  }

  function handleMusicVolume(val) {
    const vol = parseFloat(val);
    audioMixer.setMusicVolume(vol);
    setMixerState(audioMixer.getState());
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lofi-radio-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border/80 bg-[#121905] shadow-2xl flex flex-col max-h-[92vh] text-text">
        {/* Decorative ambient aura behind modal header */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-border/80 px-6 py-4.5 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-mono font-extrabold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>{isVi ? 'Đài phát nhạc OpenLoFi' : 'OpenLoFi High Fidelity'}</span>
            </div>
            <h2 id="lofi-radio-title" className="text-xl font-extrabold tracking-tight text-white mt-1">
              {isVi ? 'Đài nhạc Lo-Fi học bài' : 'Lo-Fi Focus Radio'}
            </h2>
            <p className="text-xs text-muted">
              {isVi
                ? 'Tự động phát 10 bài chất lượng cao mỗi thể loại, tự nối bài và đổi kênh mượt mà.'
                : '10 curated tracks per genre, seamless auto-chaining with auto-genre transition.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isVi ? 'Đóng' : 'Close'}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-white hover:bg-surface-2 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Genre Selection Carousel / Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                {isVi ? 'Chọn thể loại' : 'Select Genre'} ({Object.keys(LOFI_GENRES).length})
              </span>
              <span className="text-[11px] text-primary font-medium">
                {isVi ? '10 bản nhạc / thể loại' : '10 tracks / genre'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {Object.entries(LOFI_GENRES).map(([genreId, genre]) => {
                const isActive = activeGenreId === genreId;
                return (
                  <button
                    key={genreId}
                    type="button"
                    onClick={() => handleSelectGenre(genreId)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      isActive
                        ? 'border-primary bg-primary/20 text-white shadow-md shadow-primary/10'
                        : 'border-border/70 bg-surface/60 text-muted hover:text-white hover:border-primary/40'
                    }`}
                  >
                    <span className="text-2xl mb-1">{genre.icon}</span>
                    <span className="text-xs font-bold truncate max-w-full leading-tight">
                      {genre.name}
                    </span>
                    <span className="text-[10px] font-mono text-primary/80 mt-0.5">
                      {genre.bpm || 'Lo-Fi'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Now Playing Player Card */}
          <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-surface-2/90 to-[#101803]/80 p-4.5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Vinyl / Album Art Animation */}
                <div
                  className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/50 bg-[#1c2904] shadow-md ${
                    mixerState.isMusicPlaying ? 'animate-spin-slow' : ''
                  }`}
                  style={{ animationDuration: '10s' }}
                >
                  <span className="text-2xl">{currentGenre.icon}</span>
                  <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-md uppercase">
                      {isVi ? `Bài ${currentTrackIndex + 1}/10` : `Track ${currentTrackIndex + 1}/10`}
                    </span>
                    <span className="text-xs text-muted font-medium truncate">
                      {currentGenre.name}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white truncate mt-1">
                    {currentTrack.title || `Track ${currentTrackIndex + 1}`}
                  </h3>
                  <p className="text-[11px] text-muted truncate">
                    {isVi ? (currentGenre.descVi || currentGenre.desc) : currentGenre.desc}
                  </p>
                </div>
              </div>

              {/* Play / Next / Prev Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevTrack}
                  aria-label={isVi ? 'Bài trước' : 'Previous Track'}
                  title={isVi ? 'Bài trước' : 'Previous Track'}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-white hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  ⏮
                </button>

                <button
                  type="button"
                  onClick={handleToggleMusic}
                  aria-label={mixerState.isMusicPlaying ? 'Pause' : 'Play'}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-black font-bold shadow-lg hover:brightness-110 active:scale-95 transition-transform cursor-pointer"
                >
                  {mixerState.isMusicPlaying ? '⏸' : '▶'}
                </button>

                <button
                  type="button"
                  onClick={handleNextTrack}
                  aria-label={isVi ? 'Bài tiếp' : 'Next Track'}
                  title={isVi ? 'Bài tiếp' : 'Next Track'}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-white hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  ⏭
                </button>
              </div>
            </div>

            {/* Auto-Advance Rule Note */}
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted font-mono">
              <span className="flex items-center gap-1 text-primary">
                <span>⚡</span>
                <span>
                  {isVi
                    ? 'Hết 10 bài sẽ tự động đổi sang thể loại tiếp theo'
                    : 'Auto-switches to next genre after track 10'}
                </span>
              </span>
              <span>{currentGenre.bpm}</span>
            </div>
          </div>

          {/* 10-Track Queue List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                {isVi ? 'Danh sách 10 bản nhạc' : '10-Track Genre Queue'}
              </h4>
              <span className="text-[11px] text-muted">
                {isVi ? 'Nhấn để phát ngay' : 'Click to jump to track'}
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {tracks.map((track, idx) => {
                const isSelected = idx === currentTrackIndex;
                const isPlayingThis = isSelected && mixerState.isMusicPlaying;

                return (
                  <button
                    key={track.id || idx}
                    type="button"
                    onClick={() => handleSelectTrack(idx)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary/60 bg-primary/15 text-white'
                        : 'border-border/60 bg-surface/40 text-muted hover:text-white hover:bg-surface-2'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-mono font-bold ${
                          isSelected
                            ? 'bg-primary text-black font-black'
                            : 'bg-surface-2 text-muted'
                        }`}
                      >
                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </span>
                      <span className="text-xs font-semibold truncate text-white">
                        {track.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPlayingThis ? (
                        <div className="flex items-end gap-0.5 h-3.5">
                          <span className="w-1 bg-primary rounded-full animate-pulse h-3.5" />
                          <span className="w-1 bg-primary rounded-full animate-pulse delay-75 h-2" />
                          <span className="w-1 bg-primary rounded-full animate-pulse delay-150 h-3" />
                        </div>
                      ) : isSelected ? (
                        <span className="text-[10px] font-mono text-primary font-bold">PAUSED</span>
                      ) : (
                        <span className="text-xs text-muted hover:text-primary">▶</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="relative z-10 border-t border-border/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d1403]/90 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-72">
            <span className="text-xs font-semibold text-muted shrink-0">
              {isVi ? 'Âm lượng nhạc' : 'Music Volume'}:
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={mixerState.musicVolume}
              onChange={(e) => handleMusicVolume(e.target.value)}
              className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-xs font-mono font-bold text-primary w-10 text-right">
              {Math.round(mixerState.musicVolume * 100)}%
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-primary text-black text-xs font-extrabold hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            {isVi ? 'Xong & Tiếp tục học' : 'Done & Focus'}
          </button>
        </div>
      </div>
    </div>
  );
}

