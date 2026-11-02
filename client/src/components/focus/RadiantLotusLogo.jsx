import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Radiant Lotus Emblem
 * Implements the authentic Luma faceted lotus emblem from Behance
 * with GSAP-powered continuous gyroscopic orbit rings,
 * rhythmic "breath in / breath out" pulsing motion, and sparkling diamond core.
 */
export function RadiantLotusLogo({
  className = '',
  glow = true,
  isPlaying = false,
  isCenter = false,
}) {
  const rootRef = useRef(null);
  const petalsRef = useRef(null);
  const outerOrbitRef = useRef(null);
  const innerOrbitRef = useRef(null);
  const outerHaloRef = useRef(null);
  const sparkRef = useRef(null);
  const auraRef = useRef(null);

  useEffect(() => {
    if (!isCenter) return undefined;

    const ctx = gsap.context(() => {
      // 1. Continuous Gyroscopic Orbital Rotations (GPU Compositor only, 60fps)
      gsap.to(outerOrbitRef.current, {
        rotation: 360,
        duration: isPlaying ? 10 : 28,
        repeat: -1,
        ease: 'none',
        transformOrigin: '100px 104px',
        force3D: true,
      });

      gsap.to(innerOrbitRef.current, {
        rotation: -360,
        duration: isPlaying ? 7 : 20,
        repeat: -1,
        ease: 'none',
        transformOrigin: '100px 104px',
        force3D: true,
      });

      if (outerHaloRef.current) {
        gsap.to(outerHaloRef.current, {
          rotation: 360,
          duration: isPlaying ? 18 : 45,
          repeat: -1,
          ease: 'none',
          transformOrigin: '100px 104px',
          force3D: true,
        });
      }

      // 2. Active Pulsing / Breathing when isPlaying is TRUE
      if (isPlaying) {
        gsap.to(petalsRef.current, {
          scale: 1.15,
          duration: 1.8,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          transformOrigin: '100px 104px',
          force3D: true,
        });

        gsap.to(sparkRef.current, {
          scale: 1.45,
          opacity: 1,
          duration: 0.9,
          yoyo: true,
          repeat: -1,
          ease: 'power2.inOut',
          transformOrigin: '100px 108px',
          force3D: true,
        });

        if (auraRef.current) {
          gsap.to(auraRef.current, {
            scale: 1.4,
            opacity: 0.8,
            duration: 1.8,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
            force3D: true,
          });
        }
      } else {
        gsap.to(petalsRef.current, {
          scale: 1.0,
          duration: 0.5,
          ease: 'power2.out',
          transformOrigin: '100px 104px',
          force3D: true,
        });
        gsap.to(sparkRef.current, {
          scale: 1.0,
          opacity: 0.85,
          duration: 0.5,
          ease: 'power2.out',
          transformOrigin: '100px 108px',
          force3D: true,
        });
        if (auraRef.current) {
          gsap.to(auraRef.current, {
            scale: 1.1,
            opacity: 0.25,
            duration: 0.5,
            ease: 'power2.out',
            force3D: true,
          });
        }
      }
    }, rootRef);

    function handleVisibilityChange() {
      if (typeof document !== 'undefined') {
        if (document.hidden) {
          ctx.pause?.();
        } else {
          ctx.resume?.();
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      ctx.revert();
    };
  }, [isPlaying, isCenter]);

  return (
    <div
      ref={rootRef}
      className={`relative flex items-center justify-center select-none overflow-visible ${className}`}
    >
      {/* Continuous Multi-Layered Resonance Glow (GPU Compositor only, zero layout/paint cost) */}
      {glow && (
        <div
          ref={auraRef}
          className={`absolute inset-0 rounded-full blur-2xl pointer-events-none transition-colors duration-700 ${
            isPlaying
              ? 'bg-gradient-to-r from-primary/40 via-[#d4f55b]/30 to-[#a7cb2e]/35'
              : 'bg-primary/15'
          }`}
          style={{ willChange: 'transform, opacity' }}
        />
      )}

      <svg
        className="w-full h-full relative z-10 overflow-visible"
        style={{ overflow: 'visible' }}
        viewBox="-40 -40 280 280"
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
            {/* Background disc holding the central lotus */}
            <circle
              cx="100"
              cy="104"
              r="72"
              className="fill-[#0c1303]/80 stroke-primary/30"
              strokeWidth="1.2"
            />

            {/* Orbit Track 1: Outer Celestial Atmosphere Halo (Wide slow rotation) */}
            <g ref={outerHaloRef}>
              <circle
                cx="100"
                cy="104"
                r="112"
                className="fill-none stroke-primary/25"
                strokeWidth="1"
                strokeDasharray="3 14"
              />
              {/* Star satellite nodes */}
              <polygon points="100, -12 103, -8 100, -4 97, -8" className="fill-primary/75" />
              <polygon points="100, 212 103, 216 100, 220 97, 216" className="fill-primary/75" />
              <circle cx="-12" cy="104" r="1.8" className="fill-primary/60" />
              <circle cx="212" cy="104" r="1.8" className="fill-primary/60" />
            </g>

            {/* Orbit Track 2: Middle Radiant Beacon Orbit (Clockwise with Diamond Satellite) */}
            <g ref={outerOrbitRef}>
              <circle
                cx="100"
                cy="104"
                r="95"
                className="fill-none stroke-primary/50"
                strokeWidth="1.6"
                strokeDasharray="6 8"
                strokeLinecap="round"
              />
              {/* Rotating Diamond Satellite Beacon */}
              <g transform="translate(100, 9)">
                <polygon points="0,-7 6,0 0,7 -6,0" fill="#FFFFFF" />
                <polygon points="0,-9 8,0 0,9 -8,0" fill="none" stroke="#DBEF90" strokeWidth="1" opacity="0.8" />
                <circle cx="0" cy="0" r="1.8" fill="#243100" />
              </g>
              {/* Symmetrical Orbit Beads */}
              <circle cx="100" cy="199" r="3" className="fill-primary" />
              <circle cx="5" cy="104" r="2.2" className="fill-primary/80" />
              <circle cx="195" cy="104" r="2.2" className="fill-primary/80" />
            </g>

            {/* Orbit Track 3: Inner Counter-Rotating Orbit Ring (Counter-Clockwise) */}
            <g ref={innerOrbitRef}>
              <circle
                cx="100"
                cy="104"
                r="80"
                className="fill-none stroke-primary/35"
                strokeWidth="1.2"
                strokeDasharray="4 8"
                strokeLinecap="round"
              />
              <circle cx="20" cy="104" r="2.5" className="fill-primary/90" />
              <circle cx="180" cy="104" r="2.5" className="fill-primary/90" />
            </g>
          </>
        )}

        {/* Lotus Petals Group with GSAP Breathing Scale */}
        <g ref={petalsRef}>
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
          <g ref={sparkRef}>
            <polygon
              points="100,96 107,108 100,120 93,108"
              fill="#FFFFFF"
              opacity="0.98"
              className="filter drop-shadow-[0_0_12px_#DBEF90]"
            />
            <circle cx="100" cy="108" r="2.8" fill="#243100" />
          </g>
        </g>
      </svg>
    </div>
  );
}

// Backward compatible alias
export const RadiantShield = RadiantLotusLogo;
