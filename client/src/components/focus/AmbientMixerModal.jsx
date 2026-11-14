import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';
import { audioMixer } from '../../utils/audioMixer';
import { AudioTrackIcon } from '../icons/AppIcons';

export function AmbientMixerModal({ isOpen, onClose }) {
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

  useEffect(() => {
    if (!isOpen) return undefined;
    const unsub = audioMixer.onTrackChange(() => {
      setMixerState(audioMixer.getState());
    });
    return () => unsub?.();
  }, [isOpen]);

  if (!isOpen) return null;

  const isVi = lang === 'vi';
  const tracksList = Object.values(mixerState.tracks || {});
  const activeCount = tracksList.filter((t) => t.isPlaying).length;

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
    tracksList.forEach((t) => {
      if (t.isPlaying) audioMixer.stopTrack(t.id);
    });
    setMixerState(audioMixer.getState());
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ambient-mixer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border/80 bg-surface text-text shadow-2xl flex flex-col max-h-[92vh] dark:bg-[#121905]">
        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-border/80 px-6 py-4.5 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-mono font-extrabold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{isVi ? 'Không gian âm thanh học tập' : 'Lo-Fi Radio & Ambient Mixer'}</span>
            </div>
            <h2 id="ambient-mixer-title" className="text-xl font-extrabold tracking-tight text-text dark:text-white mt-1">
              {isVi ? 'Bộ trộn âm thanh môi trường' : 'Ambient Soundscape Mixer'}
            </h2>
            <p className="text-xs text-muted">
              {isVi
                ? 'Phối các âm thanh thực tế (mưa rơi, quán cafe, lửa trại) để tạo chiều sâu tập trung.'
                : 'Layer authentic recorded field sounds to build your personal acoustic sanctuary.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                activeCount > 0
                  ? 'border-primary/50 bg-primary/20 text-primary'
                  : 'border-border bg-surface text-muted'
              }`}
            >
              {activeCount} {isVi ? 'đang bật' : 'active'}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={isVi ? 'Đóng' : 'Close modal'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-white hover:bg-surface-2 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Track Sliders with GPU Content Containment */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-5 space-y-3 smooth-modal-scroll">
          {tracksList.map((track) => {
            const isPlaying = track.isPlaying;
            const vol = track.volume ?? 0.5;

            return (
              <div
                key={track.id}
                className={`rounded-2xl border p-3.5 transition-all ${
                  isPlaying
                    ? 'border-primary/60 bg-primary/10 shadow-sm'
                    : 'border-border/60 bg-surface/40 hover:border-border'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary border border-border/80">
                      <AudioTrackIcon trackId={track.id} className="w-5 h-5 text-current" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text dark:text-white truncate">
                          {track.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted truncate">
                        {isVi ? (track.subtitleVi || track.subtitle) : track.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Toggle button */}
                  <button
                    type="button"
                    onClick={() => handleToggleTrack(track.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-primary text-black shadow-xs hover:brightness-110'
                        : 'bg-surface-2 border border-border text-muted hover:text-white'
                    }`}
                  >
                    {isPlaying ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Volume Fader */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] font-mono text-muted w-7">VOL</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    disabled={!isPlaying}
                    value={vol}
                    onChange={(e) => handleTrackVolume(track.id, e.target.value)}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-primary ${
                      isPlaying ? 'bg-surface-2' : 'bg-surface opacity-40 cursor-not-allowed'
                    }`}
                  />
                  <span className="text-[11px] font-mono font-bold text-primary w-9 text-right">
                    {isPlaying ? `${Math.round(vol * 100)}%` : '--'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Controls */}
        <div className="relative z-10 border-t border-border/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-2/95 dark:bg-[#0d1403]/90 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-64">
            <span className="text-xs font-semibold text-muted shrink-0">
              {isVi ? 'Âm lượng tổng' : 'Master'}:
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={mixerState.masterVolume}
              onChange={(e) => handleMasterVolume(e.target.value)}
              className="w-full h-1.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-xs font-mono font-bold text-primary w-9 text-right">
              {Math.round(mixerState.masterVolume * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleToggleMute}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                mixerState.isMuted
                  ? 'border-primary bg-primary text-black font-bold'
                  : 'border-border bg-surface text-muted hover:text-white'
              }`}
            >
              {mixerState.isMuted
                ? (isVi ? 'Bật tiếng' : 'Unmute')
                : (isVi ? 'Tắt tiếng' : 'Mute All')}
            </button>

            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleStopAll}
                className="px-3 py-1.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                {isVi ? 'Dừng tất cả' : 'Stop All'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-primary text-black text-xs font-extrabold hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              {isVi ? 'Đóng' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
