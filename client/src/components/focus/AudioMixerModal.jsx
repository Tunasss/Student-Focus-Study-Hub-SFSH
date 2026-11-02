import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';
import { audioMixer } from '../../utils/audioMixer';

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
      badge: 'AUDIO SOUNDSCAPES · 432HZ BINAURAL',
      title: 'Ambient Focus Mixer',
      subtitle: 'Layer soothing background acoustics to eliminate distractions and induce alpha flow.',
      masterVolume: 'Master Volume',
      muteAll: 'Mute All',
      unmuteAll: 'Unmute',
      close: 'Close',
      tracks: {
        binaural: { name: '432Hz Binaural Beats', desc: 'Harmonic sine wave for deep cognitive concentration' },
        rain: { name: 'Gentle Rain', desc: 'Soothing rainfall on glass rooftop for calm relaxation' },
        cafe: { name: 'Campus Cafe', desc: 'Warm coffee shop background chatter and acoustic warmth' },
        whitenoise: { name: 'White Noise', desc: 'Clean noise mask for background chatter cancellation' },
      },
      nowPlaying: 'Soundscape Active',
      allPaused: 'All tracks paused. Toggle a sound to start.',
    },
    vi: {
      badge: 'BỘ TRỘN ÂM THANH · SÓNG NÃO 432HZ',
      title: 'Bộ trộn âm thanh học tập',
      subtitle: 'Kết hợp các lớp âm thanh thư thái để tăng cường tập trung và triệt tiêu tạp âm xung quanh.',
      masterVolume: 'Âm lượng tổng',
      muteAll: 'Tắt toàn bộ',
      unmuteAll: 'Bật lại',
      close: 'Đóng',
      tracks: {
        binaural: { name: 'Sóng não 432Hz Binaural', desc: 'Sóng âm Alpha kích hoạt trạng thái tập trung sâu' },
        rain: { name: 'Tiếng mưa êm dịu', desc: 'Âm thanh mưa rơi tí tách nhẹ nhàng, thanh lọc tâm trí' },
        cafe: { name: 'Quán cà phê học bài', desc: 'Không gian quán nước ấm cúng quen thuộc' },
        whitenoise: { name: 'Tiếng ồn trắng', desc: 'Lọc và triệt tiêu tiếng ồn gây xao nhãng xung quanh' },
      },
      nowPlaying: 'Đang phát âm thanh nền',
      allPaused: 'Chưa có track nào đang phát. Bấm vào một âm thanh để bắt đầu.',
    },
  }[lang] || {};

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

  const isAnyPlaying = Object.values(mixerState.tracks).some((tr) => tr.isPlaying);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-mixer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200 font-sans"
    >
      <div
        className="glass-card border border-border/90 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border/60 flex items-start justify-between gap-4 bg-surface/50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-mono font-bold tracking-wide">
              {t.badge}
            </div>
            <h2 id="audio-mixer-title" className="text-xl font-black text-text tracking-tight mt-1">
              {t.title}
            </h2>
            <p className="text-xs text-muted mt-0.5 max-w-md">{t.subtitle}</p>
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

        {/* Master Control Bar */}
        <div className="px-6 py-3.5 bg-surface/40 border-b border-border/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 grow max-w-xs">
            <span className="text-xs font-bold text-text shrink-0">{t.masterVolume}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={mixerState.isMuted ? 0 : mixerState.masterVolume}
              onChange={(e) => handleMasterVolume(e.target.value)}
              className="w-full accent-primary h-1.5 rounded-lg bg-surface cursor-pointer"
            />
            <span className="text-[11px] font-mono text-muted w-8 text-right">
              {mixerState.isMuted ? '0%' : `${Math.round(mixerState.masterVolume * 100)}%`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleMute}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              mixerState.isMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-surface border-border text-text hover:border-primary/50'
            }`}
          >
            {mixerState.isMuted ? `🔇 ${t.unmuteAll}` : `🔊 ${t.muteAll}`}
          </button>
        </div>

        {/* Tracks List */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(mixerState.tracks).map(([trackId, track]) => {
            const trackCopy = t.tracks?.[trackId] || {};
            const isPlaying = track.isPlaying && !mixerState.isMuted;

            return (
              <div
                key={trackId}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isPlaying
                    ? 'border-primary/70 bg-primary/10 shadow-sm'
                    : 'border-border/70 bg-surface/50 hover:border-border'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleTrack(trackId)}
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border transition-transform cursor-pointer hover:scale-105 active:scale-95 ${
                      isPlaying
                        ? 'border-primary bg-primary text-primary-fg shadow-md'
                        : 'border-border bg-surface text-muted hover:text-text'
                    }`}
                  >
                    {isPlaying ? '⏸' : track.icon}
                  </button>

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-text truncate">
                      {trackCopy.name || track.name}
                    </h4>
                    <p className="text-[11px] text-muted truncate mt-0.5">
                      {trackCopy.desc || track.subtitle}
                    </p>
                  </div>
                </div>

                {/* Track volume slider */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto w-full sm:w-44">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={!track.isPlaying}
                    value={track.volume}
                    onChange={(e) => handleTrackVolume(trackId, e.target.value)}
                    className="w-full accent-primary h-1.5 rounded-lg bg-surface disabled:opacity-30 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-muted w-7 text-right">
                    {Math.round(track.volume * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer with Active Waveform */}
        <div className="px-6 py-4 border-t border-border/60 bg-surface/50 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted">
            <span
              className={`h-2 w-2 rounded-full ${
                isAnyPlaying && !mixerState.isMuted ? 'bg-primary animate-pulse' : 'bg-muted/40'
              }`}
            />
            <span className="text-[11px] font-medium font-mono">
              {isAnyPlaying && !mixerState.isMuted ? t.nowPlaying : t.allPaused}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-primary text-primary-fg font-bold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
