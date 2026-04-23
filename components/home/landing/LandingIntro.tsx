'use client';

/**
 * LandingIntro — fullscreen cinematic intro that plays, then fades out
 * to reveal the hero section beneath.
 *
 * Behavior:
 *   • First paint shows the video covering the whole viewport.
 *   • Video autoplays muted (browser requirement).
 *   • On video `ended` (or on click/skip), fades out over 900ms.
 *   • Falls back gracefully if autoplay is blocked.
 */

import { useEffect, useRef, useState } from 'react';

const FADE_MS = 900;
const PLAYBACK_RATE = 1.5;
// Trim the final 1.6s — the tail of the clip doesn't represent the final state.
const END_TRIM_SECONDS = 1.6;
const SESSION_KEY = 'stablegrid-landing-intro-seen';

export function LandingIntro() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);
  const [seenInSession, setSeenInSession] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') {
        setSeenInSession(true);
        setDone(true);
        return;
      }
    } catch {
      // sessionStorage may be unavailable (private mode, etc) — fall through and play.
    }
    setMounted(true);
  }, []);

  // Kick off playback once mounted.
  useEffect(() => {
    if (!mounted) return;
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = PLAYBACK_RATE;
    const applyRate = () => { v.playbackRate = PLAYBACK_RATE; };
    v.addEventListener('loadedmetadata', applyRate);
    v.addEventListener('play', applyRate);
    v.play().catch(() => {
      // Autoplay blocked — dismiss and show the hero.
      dismiss();
    });
    return () => {
      v.removeEventListener('loadedmetadata', applyRate);
      v.removeEventListener('play', applyRate);
    };
  }, [mounted]);

  // rAF-driven progress bar + end-trim dismiss. `timeupdate` fires only a few
  // times per second in browsers, which makes the bar step visibly. Reading
  // currentTime each animation frame is smooth to the monitor refresh rate.
  useEffect(() => {
    if (!mounted || done) return;
    const tick = () => {
      const v = videoRef.current;
      const bar = progressBarRef.current;
      if (v && v.duration && Number.isFinite(v.duration)) {
        const effectiveEnd = Math.max(0.0001, v.duration - END_TRIM_SECONDS);
        const p = Math.min(1, Math.max(0, v.currentTime / effectiveEnd));
        if (bar) bar.style.transform = `scaleX(${p})`;
        if (v.currentTime >= effectiveEnd) {
          dismiss();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mounted, done]);

  // Lock body scroll while intro is visible.
  useEffect(() => {
    if (!mounted || done) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mounted, done]);

  const dismiss = () => {
    if (fading || done) return;
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
    setFading(true);
    window.setTimeout(() => setDone(true), FADE_MS);
  };

  if (done) return null;
  if (!mounted) {
    // Pre-mount: suppress the blackout if we've already seen the intro this
    // session — avoids flashing black over the hero on navigation back.
    if (seenInSession) return null;
    return <div className="fixed inset-0 z-[100] bg-black" aria-hidden />;
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black cursor-pointer"
      onClick={dismiss}
      role="button"
      aria-label="Skip intro"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          dismiss();
        }
      }}
      style={{
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms cubic-bezier(.16,1,.3,1)`,
        pointerEvents: fading ? 'none' : 'auto'
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        autoPlay
        disablePictureInPicture
        controls={false}
        className="absolute inset-0 h-full w-full object-cover"
        onEnded={dismiss}
      >
        {/* Primary: HEVC 4K — modern Safari, Chrome on Apple Silicon, Edge */}
        <source src="/landing-intro-4k.mp4" type='video/mp4; codecs="hvc1"' />
        {/* Fallback: H.264 1080p — universal */}
        <source src="/landing-intro-1080p.mp4" type='video/mp4; codecs="avc1.640033"' />
      </video>

      {/* Cinematic vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)'
        }}
      />

      {/* Top-right skip control */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        className="absolute right-6 top-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55 transition-colors hover:text-white"
        style={{ fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif' }}
      >
        Skip →
      </button>

      {/* Progress hairline along the bottom edge. Width is driven by a
          transform via rAF (see effect above) so it updates every frame, not
          every timeupdate event. */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          ref={progressBarRef}
          style={{
            height: '100%',
            width: '100%',
            transformOrigin: 'left center',
            transform: 'scaleX(0)',
            willChange: 'transform',
            background:
              'linear-gradient(90deg, rgba(153,247,255,0.4) 0%, #99f7ff 100%)',
            boxShadow: '0 0 8px rgba(153,247,255,0.45)'
          }}
        />
      </div>
    </div>
  );
}
