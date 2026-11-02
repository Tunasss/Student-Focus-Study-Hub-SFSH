/**
 * Radiant Lotus Emblem
 * Implements the authentic Luma faceted lotus emblem from Behance
 * with luxurious multi-layer gradients, delicate facet highlights,
 * and rhythmic "Breath In / Breath Out" organic animation.
 */

export function RadiantLotusLogo({
  className = '',
  glow = true,
  isPlaying = false,
  isCenter = false,
}) {
  const breatheClass = isPlaying ? 'animate-luma-breathe-active' : 'animate-luma-breathe';

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className} ${
        isCenter ? breatheClass : ''
      }`}
    >
      {/* Dynamic Multi-layered Breathing Aura */}
      {glow && (
        <>
          {/* Outermost soft ambient glow */}
          <div
            className={`absolute inset-0 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
              isPlaying
                ? 'bg-gradient-to-r from-primary/45 via-[#d4f55b]/30 to-[#a7cb2e]/40 scale-150 animate-pulse'
                : 'bg-primary/20 scale-120'
            }`}
          />

          {/* Concentric luminous ripple ring when active */}
          {isPlaying && (
            <div
              className="absolute -inset-4 rounded-full border border-primary/25 animate-ping pointer-events-none"
              style={{ animationDuration: '3.2s' }}
            />
          )}
        </>
      )}

      <svg
        className="w-full h-full relative z-10 filter drop-shadow-[0_8px_24px_rgba(219,239,144,0.35)]"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Main Crown Petal Gradient */}
          <linearGradient id="luma-crown-grad" x1="100" y1="24" x2="100" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#E9F7A8" />
            <stop offset="70%" stopColor="#DBEF90" />
            <stop offset="100%" stopColor="#9AB82C" />
          </linearGradient>

          {/* Left Wing Gradient */}
          <linearGradient id="luma-left-grad" x1="45" y1="60" x2="100" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DBEF90" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#BEDC58" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#6C8614" stopOpacity="0.75" />
          </linearGradient>

          {/* Right Wing Gradient */}
          <linearGradient id="luma-right-grad" x1="155" y1="60" x2="100" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DBEF90" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#BEDC58" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#6C8614" stopOpacity="0.75" />
          </linearGradient>

          {/* Inner Petal Gradient */}
          <linearGradient id="luma-inner-grad" x1="100" y1="45" x2="100" y2="125" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5FDCE" />
            <stop offset="60%" stopColor="#DBEF90" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8DAF1E" stopOpacity="0.8" />
          </linearGradient>

          {/* Base Cradle Crescent Gradient */}
          <linearGradient id="luma-cradle-grad" x1="45" y1="140" x2="155" y2="175" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7E9F15" stopOpacity="0.6" />
            <stop offset="30%" stopColor="#DBEF90" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#E9F7A8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#7E9F15" stopOpacity="0.6" />
          </linearGradient>

          {/* Glass facet specular sheen */}
          <linearGradient id="luma-facet-sheen" x1="80" y1="30" x2="120" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Center Stage Dotted Orbit Ring */}
        {isCenter && (
          <>
            <circle
              cx="100"
              cy="104"
              r="86"
              className="fill-black/30 stroke-primary/30"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />
            <circle
              cx="100"
              cy="104"
              r="80"
              className="fill-none stroke-primary/15"
              strokeWidth="1"
            />
          </>
        )}

        {/* Outer Left Wing Petal */}
        <path
          d="M66 76 C46 95 38 120 54 142 C70 131 80 113 78 94 Z"
          fill="url(#luma-left-grad)"
        />
        {/* Subtle facet line on outer left wing */}
        <path
          d="M66 76 C56 95 50 116 54 142"
          stroke="url(#luma-facet-sheen)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Outer Right Wing Petal */}
        <path
          d="M134 76 C154 95 162 120 146 142 C130 131 120 113 122 94 Z"
          fill="url(#luma-right-grad)"
        />
        {/* Subtle facet line on outer right wing */}
        <path
          d="M134 76 C144 95 150 116 146 142"
          stroke="url(#luma-facet-sheen)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Inner Left Petal */}
        <path
          d="M86 50 C68 66 58 90 72 120 C87 111 96 92 92 70 Z"
          fill="url(#luma-inner-grad)"
        />

        {/* Inner Right Petal */}
        <path
          d="M114 50 C132 66 142 90 128 120 C113 111 104 92 108 70 Z"
          fill="url(#luma-inner-grad)"
        />

        {/* Central Tall Crown Petal */}
        <path
          d="M100 24 C89 54 89 88 100 118 C111 88 111 54 100 24 Z"
          fill="url(#luma-crown-grad)"
        />
        {/* Crown Spine Facet Sheen */}
        <line
          x1="100"
          y1="28"
          x2="100"
          y2="114"
          stroke="url(#luma-facet-sheen)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Base Cradle Crescent Petal */}
        <path
          d="M48 144 C72 172 128 172 152 144 C136 163 64 163 48 144 Z"
          fill="url(#luma-cradle-grad)"
        />

        {/* Central Luminous Focus Core Spark */}
        <g className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
          <polygon
            points="100,98 106,108 100,118 94,108"
            fill="#FFFFFF"
            opacity="0.95"
          />
          <circle cx="100" cy="108" r="2.5" fill="#243100" />
        </g>
      </svg>
    </div>
  );
}

// Backward compatible alias
export const RadiantShield = RadiantLotusLogo;
