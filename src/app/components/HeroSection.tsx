"use client";
import ConferenceRegistration from "./ConfrenceRegistration";
import { useState } from "react";
import Image from "next/image";
import { EVENT_DETAILS } from "@/data/schedule";

export default function HeroSection() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const heroDetails = [
    { label: "Dates", value: EVENT_DETAILS.dates },
    { label: "Location", value: EVENT_DETAILS.locationName, helper: "Loranger, Louisiana" },
    { label: "Hosted By", value: EVENT_DETAILS.host },
  ];

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 py-24 text-center text-white">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-50"
        src="/videos/available-promo2.mp4"
      />
      <Image
        src="/images/events/available-2025/slice5.png"
        alt=""
        width={108}
        height={107}
        className="pointer-events-none select-none absolute left-6 top-16 hidden w-16 opacity-80 sm:block"
        priority
      />
      <Image
        src="/images/events/available-2025/slice2.png"
        alt=""
        width={114}
        height={114}
        className="pointer-events-none select-none absolute bottom-24 right-12 w-20 opacity-80"
        priority
      />
      <div className="relative z-10 w-full max-w-3xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">Are You AVAILABLE?</h1>
          <p className="mx-auto max-w-xl text-base text-gray-200 md:text-lg">
            Step away from comfort and answer the call. October 17-18 we gather for a weekend set apart for worship, teaching, and activation.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6">
          <button
            onClick={() => setShowTrailer(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-black transition hover:bg-gray-200"
          >
            <span aria-hidden>▶</span> Watch the Trailer
          </button>
          <button
            onClick={() => setShowOverlay(true)}
            className="flex items-center justify-center gap-2 rounded-full border border-white px-7 py-3 font-semibold transition hover:bg-white hover:text-black"
          >
            📅 Reserve My Spot
          </button>
          {showOverlay && (
            <ConferenceRegistration isOpen={showOverlay} onClose={() => setShowOverlay(false)} />
          )}
        </div>
        <div className="grid gap-3 rounded-3xl border border-white/30 bg-black/40 p-6 backdrop-blur md:grid-cols-3">
          {heroDetails.map((detail) => (
            <div key={detail.label} className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF6B6B]">{detail.label}</p>
              <p className="text-lg font-semibold">{detail.value}</p>
              {detail.helper && <p className="text-sm text-gray-300">{detail.helper}</p>}
            </div>
          ))}
        </div>
      </div>
      {showTrailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button
            onClick={() => setShowTrailer(false)}
            className="absolute right-6 top-6 text-3xl font-bold text-white focus:outline-none"
            aria-label="Close Trailer"
          >
            ✕
          </button>
          <video
            src="/videos/available-promo2.mp4"
            controls
            autoPlay
            className="w-full rounded md:max-w-3xl"
            onEnded={() => {
              setShowTrailer(false);
              setShowOverlay(true);
            }}
          />
        </div>
      )}
    </section>
  );
}
