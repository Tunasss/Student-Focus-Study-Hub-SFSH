export function VinylMusicIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
    </svg>
  );
}

export function CoffeeCupIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a3 3 0 010 6h-1M3 8h14v8a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
      <path d="M6 2v3m4-3v3m4-3v3" />
    </svg>
  );
}

export function MoonStarsIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      <path d="M19 4v3m1.5-1.5h-3" />
    </svg>
  );
}

export function PianoIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M8 5v8m4-8v8m4-8v8" />
      <path d="M3 13h18" />
    </svg>
  );
}

export function GuitarIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-3 0-5-2-5-5a5 5 0 014-4.9V4a1 1 0 011-1h2a1 1 0 011 1v5.1A5 5 0 0116 14c0 3-2 5-5 5h-2z" />
      <circle cx="11" cy="14" r="1.5" />
      <path d="M11 3v6" />
    </svg>
  );
}

export function GenreIcon({ genreId, className = 'w-5 h-5' }) {
  switch (genreId) {
    case 'jazz':
    case 'jazzhop':
      return <VinylMusicIcon className={className} />;
    case 'rnb':
    case 'soul-rnb':
      return <CoffeeCupIcon className={className} />;
    case 'night':
    case 'late-night':
    case 'synthwave':
      return <MoonStarsIcon className={className} />;
    case 'piano':
    case 'ambient-lofi':
      return <PianoIcon className={className} />;
    case 'acoustic':
    case 'funk-soul':
      return <GuitarIcon className={className} />;
    default:
      return <MusicNoteIcon className={className} />;
  }
}

export function BrainWaveIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="7" strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="10" strokeDasharray="2 3" />
    </svg>
  );
}

export function CloudRainIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 13a4 4 0 00-7.8-1.2 3.5 3.5 0 00-4.2 3.2 3.5 3.5 0 003.5 3.5H16a4 4 0 000-8z" />
      <path d="M8 19v3m4-3v3m4-3v3" />
    </svg>
  );
}

export function FireplaceIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c1.5 3 4 5.5 4 9a6 6 0 11-12 0c0-3.5 2.5-6 4-9 1 2 2 3 4 3s3-1 4-3z" />
      <path d="M12 14a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  );
}

export function ForestLeafIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3C7 3 4 7 4 12c0 4 3 8 8 9 5-1 8-5 8-9 0-5-3-9-8-9zm0 0v18" />
      <path d="M12 7c-2 1-3.5 3-4 5m4-3c2 1 3.5 3 4 5m-4 1c-2 1-3 2.5-3.5 4m3.5-3c2 1 3 2.5 3.5 4" />
    </svg>
  );
}

export function WavesIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </svg>
  );
}

export function WhiteNoiseIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14h3v-4H4v4zm7 4h3V6h-3v12zm7-8h3v8h-3v-8z" />
    </svg>
  );
}

export function AudioTrackIcon({ trackId, className = 'w-5 h-5' }) {
  switch (trackId) {
    case 'binaural':
      return <BrainWaveIcon className={className} />;
    case 'rain':
      return <CloudRainIcon className={className} />;
    case 'cafe':
      return <CoffeeCupIcon className={className} />;
    case 'campfire':
      return <FireplaceIcon className={className} />;
    case 'forest':
      return <ForestLeafIcon className={className} />;
    case 'waves':
      return <WavesIcon className={className} />;
    case 'whitenoise':
      return <WhiteNoiseIcon className={className} />;
    default:
      return <MusicNoteIcon className={className} />;
  }
}

export function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export function FileTextIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

export function CalendarIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export function BookOpenIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

export function LightbulbIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

export function ZapIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

export function LeafIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9 4.97 0 9 4.03 9 9 0 4.97-4.03 9-9 9z" />
      <path d="M12 3v18" />
    </svg>
  );
}

export function TargetIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function AlertTriangleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

export function CheckCircleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function MusicNoteIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );
}

export function RadioIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 3l-8 4m8 7a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export function MapPinIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

export function BuildingIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m4-11v11m4-11v11m4-11v11m4-11v11" />
    </svg>
  );
}

export function ClockIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function HomeToolIcon({ type, className = 'w-4 h-4' }) {
  switch (type) {
    case 'calendar':
      return <CalendarIcon className={className} />;
    case 'building':
      return <BuildingIcon className={className} />;
    case 'clock':
      return <ClockIcon className={className} />;
    case 'book':
      return <BookOpenIcon className={className} />;
    case 'target':
      return <TargetIcon className={className} />;
    case 'zap':
      return <ZapIcon className={className} />;
    case 'pin':
      return <MapPinIcon className={className} />;
    case 'file':
      return <FileTextIcon className={className} />;
    default:
      return <ZapIcon className={className} />;
  }
}
