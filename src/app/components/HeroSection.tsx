"use client"
import ConferenceRegistration from "./ConferenceRegistration";
import { useState } from "react";

export default function HeroSection() {
  const [showOverlay, setShowOverlay] = useState(false);
    return (
      <section className="relative h-screen flex items-center justify-center text-center px-6">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          src="/videos/available-trailer.mp4"
        />
        <div className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 animate-fadeInUp">Are You AVAILABLE?</h1>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button className="bg-white text-black px-6 py-3 font-semibold rounded hover:bg-gray-200">▶ Watch the Trailer</button>
            <button 
              onClick={() => setShowOverlay(true)}
              className="border border-white px-6 py-3 font-semibold rounded hover:bg-white hover:text-black transition"
            >
              📅 Reserve My Spot
            </button>
            {showOverlay && (
              <ConferenceRegistration 
                isOpen={showOverlay} 
                onClose={() => setShowOverlay(false)} 
              />
            )}
          </div>
        </div>
      </section>
    );
  }