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
  const sparkRef = useRef(null);
  const auraRef = useRef(null);

  useEffect(() => {
    if (!isCenter) return undefined;

    const ctx = gsap.context(() => {
      // 1. Continuous Gyroscopic Orbital Rotation
      // Always spins smoothly, accelerates when active
      gsap.to(outerOrbitRef.current, {
        rotation: 360,
        duration: isPlaying ? 10 : 28,
        repeat: -1,
        ease: 'none',
        transformOrigin: '100px 104px',
      });

      gsap.to(innerOrbitRef.current, {
        rotation: -360,
        duration: isPlaying ? 7 : 20,
        repeat: -1,
        ease: 'none',
        transformOrigin: '100px 104px',
      });

      // 2. Active Pulsing / Breathing when isPlaying is TRUE
      if (isPlaying) {
        // Obvious rhythmic breath in & breath out (phóng to phóng nhỏ rõ rệt)
        gsap.to(petalsRef.current, {
          scale: 1.16,
          duration: 1.8,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          transformOrigin: '100px 104px',
        });

        // Pulsing Sacred Diamond Heart
        gsap.to(sparkRef.current, {
          scale: 1.5,
          opacity: 1,
          duration: 0.9,
          yoyo: true,
          repeat: -1,
          ease: 'power2.inOut',
          transformOrigin: '100px 108px',
        });

        // Glowing expanding energy aura
        if (auraRef.current) {
          gsap.to(auraRef.current, {
            scale: 1.45,
            opacity: 0.85,
            duration: 1.8,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
          });
        }
      } else {
        // Idle gentle resting state
        gsap.to(petalsRef.current, {
          scale: 1.0,
          duration: 0.6,
          ease: 'power2.out',
          transformOrigin: '100px 104px',
        });
        gsap.to(sparkRef.current, {
          scale: 1.0,
          opacity: 0.85,
          duration: 0.6,
          ease: 'power2.out',
          transformOrigin: '100px 108px',
        });
        if (auraRef.current) {
          gsap.to(auraRef.current, {
            scale: 1.15,
            opacity: 0.25,
            duration: 0.6,
            ease: 'power2.out',
          });
        }
      }
    }, rootRef);

    return () => ctx.revert();
  }, [isPlaying, isCenter]);

  return (
    <div
      ref={rootRef}
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      {/* Continuous Multi-Layered Resonance Glow */}
      {glow && (
        <>
          {/* Outermost ambient aura */}
          <div
            ref={auraRef}
            className={`absolute inset-0 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
              isPlaying
                ? 'bg-gradient-to-r from-primary/50 via-[#d4f55b]/40 to-[#a7cb2e]/45'
                : 'bg-primary/20'
            }`}
            style={{ willChange: 'transform, opacity' }}
          />

          {/* Continuous outward radiating ripples when active */}
          {isPlaying && (
            <>
              <div
                className="absolute -inset-3 rounded-full border border-primary/35 animate-ping pointer-events-none"
                style={{ animationDuration: '2.5s' }}
              />
              <div
                className="absolute -inset-9 rounded-full border border-primary/20 animate-ping pointer-events-none delay-500"
                style={{ animationDuration: '3.5s' }}
              />
            </>
          )}
        </>
      )}

      <svg
        className="w-full h-full relative z-10 filter drop-shadow-[0_10px_30px_rgba(219,239,144,0.45)]"
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
              className="fill-[#0c1303]/65 stroke-primary/20"
              strokeWidth="1"
            />

            {/* Outer Continuous Rotating Dotted Orbit Ring (Clockwise) */}
            <g ref={outerOrbitRef}>
              <circle
                cx="100"
                cy="104"
                r="86"
                className="fill-none stroke-primary/55"
                strokeWidth="1.8"
                strokeDasharray="6 8"
                strokeLinecap="round"
              />
              {/* Satellite focus node on orbit */}
              <circle cx="100" cy="18" r="3.5" className="fill-white filter drop-shadow-[0_0_8px_#DBEF90]" />
              <circle cx="100" cy="190" r="2.5" className="fill-primary" />
            </g>

            {/* Inner Counter-Rotating Orbit Ring (Counter-Clockwise) */}
            <g ref={innerOrbitRef}>
              <circle
                cx="100"
                cy="104"
                r="78"
                className="fill-none stroke-primary/30"
                strokeWidth="1.2"
                strokeDasharray="3 10"
                strokeLinecap="round"
              />
              <circle cx="22" cy="104" r="2.5" className="fill-primary/90" />
              <circle cx="178" cy="104" r="2.5" className="fill-primary/90" />
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
