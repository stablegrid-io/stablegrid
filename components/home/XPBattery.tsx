'use client';

/* ── Isometric energy cell SVG ─────────────────────────────────────────────── */

interface XPBatteryProps {
  pct: number; // 0-100 fill level
}

export function XPBattery({ pct }: XPBatteryProps) {
  const p = Math.max(0, Math.min(100, pct));
  const fillH = (p / 100) * 220;
  const fillY = 400 - fillH;
  const emptyH = 220 - fillH;
  const show = p > 0;

  /* wave path at liquid surface */
  const w = (dy: number) =>
    `M 140,${fillY} Q 190,${fillY + dy} 240,${fillY} T 340,${fillY} T 440,${fillY} T 540,${fillY} L 540,${fillY + 8} L 140,${fillY + 8} Z`;

  return (
    <div className="relative w-full">
      {/* ambient glow behind cell */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: -60,
          background: `radial-gradient(ellipse at center 60%, rgba(0,226,238,${(0.06 + p * 0.002).toFixed(3)}) 0%, transparent 55%)`,
        }}
      />

      <svg
        viewBox="0 0 680 520"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block relative"
        aria-label={`Energy cell at ${p}%`}
      >
        <defs>
          <linearGradient id="sg-front" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1c1c1e" />
            <stop offset="50%" stopColor="#141416" />
            <stop offset="100%" stopColor="#0a0a0c" />
          </linearGradient>
          <linearGradient id="sg-top" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c2c2e" />
            <stop offset="100%" stopColor="#141416" />
          </linearGradient>
          <linearGradient id="sg-glass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" stopOpacity={0.08} />
            <stop offset="40%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="sg-shine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff" stopOpacity={0} />
            <stop offset="40%" stopColor="#fff" stopOpacity={0.04} />
            <stop offset="60%" stopColor="#fff" stopOpacity={0.04} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="sg-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#99f7ff" stopOpacity={1} />
            <stop offset="30%" stopColor="#00e2ee" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#006a70" stopOpacity={0.85} />
          </linearGradient>
          <linearGradient id="sg-idle-glow" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#00e2ee" stopOpacity={0.12} />
            <stop offset="60%" stopColor="#00e2ee" stopOpacity={0.02} />
            <stop offset="100%" stopColor="#00e2ee" stopOpacity={0} />
          </linearGradient>
          <pattern id="sg-vents" x="0" y="0" width="14" height="6" patternUnits="userSpaceOnUse">
            <rect width="14" height="6" fill="#0a0a0c" />
            <rect x="1" y="1.5" width="12" height="0.6" fill="#000" />
            <rect x="1" y="3.5" width="12" height="0.6" fill="#000" />
          </pattern>
          <pattern id="sg-scanlines" x="0" y="0" width="400" height="12" patternUnits="userSpaceOnUse">
            <rect width="400" height="12" fill="transparent" />
            <line x1="0" y1="11" x2="400" y2="11" stroke="#99f7ff" strokeWidth="0.3" opacity="0.06" />
          </pattern>
          <clipPath id="sg-clip">
            <rect x="140" y="180" width="400" height="220" rx="3" />
          </clipPath>
          <radialGradient id="sg-floor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00e2ee" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#00e2ee" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="sg-inner" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#99f7ff" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#99f7ff" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* ── Floor glow + shadow ── */}
        <ellipse cx="340" cy="480" rx="340" ry="40" fill="url(#sg-floor)" />
        <ellipse cx="340" cy="462" rx="270" ry="14" fill="#000" opacity={0.7} />

        {/* ── Top face (lid) ── */}
        <polygon points="120,170 560,170 580,150 140,150" fill="url(#sg-top)" stroke="#000" strokeWidth={0.8} />
        {[200, 280, 360, 440, 520].map((x) => (
          <line key={x} x1={x} y1={160} x2={x + 10} y2={150} stroke="#3a3a3e" strokeWidth={0.4} opacity={0.5} />
        ))}
        {[195, 340, 485].map((x) => (
          <rect key={x} x={x} y={148} width={28} height={5} fill="#1a1a1c" stroke="#000" strokeWidth={0.4} rx={1} />
        ))}

        {/* ── Right side face ── */}
        <polygon points="560,170 580,150 580,420 560,440" fill="#0a0a0c" stroke="#000" strokeWidth={0.5} />
        <polygon points="560,170 580,150 580,420 560,440" fill="url(#sg-glass)" />
        <rect x={565} y={170} width={1.5} height={250} fill="#000" opacity={0.5} />

        {/* ── Front face ── */}
        <rect x={120} y={170} width={440} height={270} fill="url(#sg-front)" stroke="#000" strokeWidth={0.8} />
        <rect x={120} y={170} width={440} height={270} fill="url(#sg-shine)" opacity={0.7} />

        {/* ── Inner display window ── */}
        <rect x={140} y={180} width={400} height={220} fill="#050506" stroke="#000" strokeWidth={0.8} />

        {/* ── Idle state: scan lines + residual glow ── */}
        <g clipPath="url(#sg-clip)">
          {/* scan lines always visible inside display */}
          <rect x={140} y={180} width={400} height={220} fill="url(#sg-scanlines)" />
          {/* residual glow at bottom even when empty */}
          <rect x={140} y={180} width={400} height={220} fill="url(#sg-idle-glow)" />

          {/* ── Liquid fill ── */}
          {show && (
            <>
              <rect x={140} y={fillY} width={400} height={fillH} fill="url(#sg-fill)" opacity={0.95} />
              <rect x={140} y={fillY} width={400} height={fillH} fill="url(#sg-inner)" />

              {/* wave */}
              <path d={w(-3)} fill="#fff" opacity={0.25}>
                <animate attributeName="d" values={`${w(-3)};${w(3)};${w(-3)}`} dur="5s" repeatCount="indefinite" />
              </path>
              <line x1={140} y1={fillY} x2={540} y2={fillY} stroke="#fff" strokeWidth={0.6} opacity={0.4} />

              {/* bubbles */}
              <g opacity={0.35}>
                {[
                  { cx: 200, r: 1, dur: '4s', begin: '0s' },
                  { cx: 310, r: 0.8, dur: '5s', begin: '0.8s' },
                  { cx: 420, r: 1.2, dur: '4.5s', begin: '1.8s' },
                  { cx: 480, r: 0.9, dur: '5.2s', begin: '2.8s' },
                  { cx: 250, r: 1, dur: '4.8s', begin: '2.3s' },
                ].map((b, i) => (
                  <circle key={i} cx={b.cx} cy={395} r={b.r} fill="#fff">
                    <animate attributeName="cy" values={`395;${fillY}`} dur={b.dur} repeatCount="indefinite" begin={b.begin} />
                    <animate attributeName="opacity" values="0;0.7;0" dur={b.dur} repeatCount="indefinite" begin={b.begin} />
                  </circle>
                ))}
              </g>

              <ellipse cx={340} cy={fillY + fillH * 0.55} rx={180} ry={40} fill="#fff" opacity={0.04} />
            </>
          )}
        </g>

        {/* dark overlay above liquid (softer when empty) */}
        {emptyH > 0 && <rect x={140} y={180} width={400} height={emptyH} fill="#000" opacity={show ? 0.5 : 0.35} />}

        {/* glass + window borders */}
        <rect x={140} y={180} width={400} height={220} fill="url(#sg-glass)" opacity={0.6} />
        <rect x={140} y={180} width={400} height={220} fill="none" stroke="#1c1c1e" strokeWidth={0.5} />
        <rect x={140} y={180} width={400} height={220} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.3} />

        {/* glow line at fill level */}
        {show && (
          <>
            <line x1={140} y1={fillY} x2={540} y2={fillY} stroke="#99f7ff" strokeWidth={0.5} opacity={0.5} />
            <line x1={140} y1={fillY + 1} x2={540} y2={fillY + 1} stroke="#99f7ff" strokeWidth={2} opacity={0.15} />
          </>
        )}

        {/* pulsing border when empty */}
        {!show && (
          <rect x={140} y={180} width={400} height={220} fill="none" stroke="#00e2ee" strokeWidth={0.5} rx={3} opacity={0.15}>
            <animate attributeName="opacity" values="0.08;0.2;0.08" dur="3s" repeatCount="indefinite" />
          </rect>
        )}

        {/* corner dots */}
        <g fill="#2a2a2e" opacity={0.8}>
          <circle cx={125} cy={175} r={1} />
          <circle cx={555} cy={175} r={1} />
          <circle cx={125} cy={435} r={1} />
          <circle cx={555} cy={435} r={1} />
        </g>

        {/* bottom vent grills */}
        <rect x={150} y={410} width={100} height={20} fill="url(#sg-vents)" stroke="#000" strokeWidth={0.4} rx={1} />
        <rect x={430} y={410} width={100} height={20} fill="url(#sg-vents)" stroke="#000" strokeWidth={0.4} rx={1} />

        {/* base plate */}
        <polygon points="120,440 560,440 560,450 120,450" fill="#0a0a0c" stroke="#000" strokeWidth={0.5} />
        <polygon points="560,440 580,420 580,430 560,450" fill="#050506" stroke="#000" strokeWidth={0.5} />

        {/* feet */}
        <polygon points="135,450 150,450 153,460 132,460" fill="#1a1a1c" stroke="#000" strokeWidth={0.4} />
        <polygon points="530,450 545,450 548,460 527,460" fill="#1a1a1c" stroke="#000" strokeWidth={0.4} />
      </svg>
    </div>
  );
}
