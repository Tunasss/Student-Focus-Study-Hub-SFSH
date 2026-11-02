/**
 * Radiant Lotus Emblem
 * Implements the authentic Luma faceted lotus emblem from Behance
 * with continuous gyroscopic orbit rings, radiant energy ripples,
 * pulsating diamond heart, and dynamic breathing motion.
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
      {/* Continuous Multi-Layered Resonance Glow */}
      {glow && (
        <>
          {/* Outermost ambient aura */}
          <div
            className={`absolute inset-0 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              isPlaying
                ? 'bg-gradient-to-r from-primary/50 via-[#d4f55b]/40 to-[#a7cb2e]/45 scale-150 animate-pulse'
                : 'bg-primary/25 scale-120'
            }`}
          />

          {/* Continuous outward radiating ripples when active */}
          {isPlaying && (
            <>
              <div
                className="absolute -inset-2 rounded-full border border-primary/35 animate-ping pointer-events-none"
                style={{ animationDuration: '2.8s' }}
              />
              <div
                className="absolute -inset-8 rounded-full border border-primary/20 animate-ping pointer-events-none delay-700"
                style={{ animationDuration: '3.6s' }}
              />
            </>
          )}
        </>
      )}

      <svg
        className="w-full h-full relative z-10 filter drop-shadow-[0_10px_28px_rgba(219,239,144,0.4)]"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Main Crown Petal Gradient */}
          <linearGradient id="luma-crown-grad" x1="100" y1="24" x2="100" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="25%" stopColor="#EEF9B2" />
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
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Center Stage Gyroscopic Continuous Orbital Rings */}
        {isCenter && (
          <>
            {/* Background disc */}
            <circle
              cx="100"
              cy="104"
              r="86"
              className="fill-[#0c1303]/60 stroke-primary/20"
              strokeWidth="1"
            />

            {/* Outer Continuous Rotating Dotted Orbit Ring (Clockwise) */}
            <g
              className={isPlaying ? 'animate-orbit-cw' : 'animate-orbit-cw'}
              style={{
                transformOrigin: '100px 104px',
                animationDuration: isPlaying ? '14s' : '36s',
              }}
            >
              <circle
                cx="100"
                cy="104"
                r="86"
                className="fill-none stroke-primary/50"
                strokeWidth="1.8"
                strokeDasharray="6 8"
                strokeLinecap="round"
              />
              {/* Satellite focus node on orbit */}
              <circle cx="100" cy="18" r="3" className="fill-primary filter drop-shadow-[0_0_6px_#DBEF90]" />
              <circle cx="100" cy="190" r="2" className="fill-primary/60" />
            </g>

            {/* Inner Counter-Rotating Orbit Ring (Counter-Clockwise) */}
            <g
              className={isPlaying ? 'animate-orbit-ccw' : 'animate-orbit-ccw'}
              style={{
                transformOrigin: '100px 104px',
                animationDuration: isPlaying ? '10s' : '28s',
              }}
            >
              <circle
                cx="100"
                cy="104"
                r="78"
                className="fill-none stroke-primary/25"
                strokeWidth="1.2"
                strokeDasharray="3 10"
                strokeLinecap="round"
              />
              <circle cx="22" cy="104" r="2.5" className="fill-primary/80" />
              <circle cx="178" cy="104" r="2.5" className="fill-primary/80" />
            </g>
          </>
        )}

        {/* Outer Left Wing Petal */}
        <path
          d="M66 76 C46 95 38 120 54 142 C70 131 80 113 78 94 Z"
          fill="url(#luma-left-grad)"
        />
        <path
          d="M66 76 C56 95 50 116 54 142"
          stroke="url(#luma-facet-sheen)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Outer Right Wing Petal */}
        <path
          d="M134 76 C154 95 162 120 146 142 C130 131 120 113 122 94 Z"
          fill="url(#luma-right-grad)"
        />
        <path
          d="M134 76 C144 95 150 116 146 142"
          stroke="url(#luma-facet-sheen)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
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
        <line
          x1="100"
          y1="28"
          x2="100"
          y2="114"
          stroke="url(#luma-facet-sheen)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Base Cradle Crescent Petal */}
        <path
          d="M48 144 C72 172 128 172 152 144 C136 163 64 163 48 144 Z"
          fill="url(#luma-cradle-grad)"
        />

        {/* Continuous Pulsing Sacred Diamond Spark */}
        <g
          className={isPlaying ? 'animate-diamond-sparkle' : ''}
          style={{ transformOrigin: '100px 108px' }}
        >
          <polygon
            points="100,96 107,108 100,120 93,108"
            fill="#FFFFFF"
            opacity="0.95"
            className="filter drop-shadow-[0_0_10px_#DBEF90]"
          />
          <circle cx="100" cy="108" r="2.8" fill="#243100" />
        </g>
      </svg>
    </div>
  );
}

// Backward compatible alias
export const RadiantShield = RadiantLotusLogo;
