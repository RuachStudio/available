"use client";

import { useEffect, useRef, useState } from "react";

export default function StickyAudioButton() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = true; // ensure muted for mobile autoplay
    v.volume = 0;

    // Try to start muted autoplay right away
    v.play().catch(() => {
      // If autoplay fails, we’ll still unmute & play on gesture below
    });
  }, []);

  return (
    <>
      {/* Keep the video in the DOM (inline), but visually minimal. 
          You can position it at the bottom or offscreen. */}
      <video
        ref={videoRef}
        src="/videos/intro-audio.mp4"
        playsInline
        muted={muted}
        loop
        preload="auto"
        controls={false}
        style={{ position: "fixed", bottom: 0, left: 0, width: 1, height: 1, opacity: 0 }}
        aria-hidden="true"
      />
      {/* Simple mute toggle for UX/compliance */}
      <button
        onClick={() => {
          if (!videoRef.current) return;
          const nextMuted = !videoRef.current.muted;
          videoRef.current.muted = nextMuted;
          setMuted(nextMuted);
          if (!nextMuted) {
            videoRef.current.volume = 1;
            videoRef.current.play().catch(() => {});
          }
        }}
        className="fixed right-3 bottom-3 z-50 rounded-full px-3 py-2 text-sm font-medium bg-black/30 border border-white/50 text-white"
      >
        {muted ? "Unmute" : "Mute"}
      </button>
    </>
  );
}