"use client"
import { useState } from "react";
import ConferenceRegistration from "./ConferenceRegistration";

export default function InvitationSection() {
    const [showOverlay, setShowOverlay] = useState(false);

    return (
      <section className="py-16 px-6 bg-gradient-to-b from-black to-gray-900 text-center">
        <p className="max-w-2xl mx-auto text-xl md:text-2xl font-light">
          This isn’t just another event. This is a divine interruption. A call to radical availability.
          To lay down every distraction, excuse, and idol.
        </p>
        <button 
          onClick={() => setShowOverlay(true)}
          className="mt-8 bg-red-600 hover:bg-red-700 text-white px-8 py-4 font-bold rounded text-lg transition"
        >
          I’m Available – RSVP Now
        </button>
        {showOverlay && (
          <ConferenceRegistration 
            isOpen={showOverlay} 
            onClose={() => setShowOverlay(false)} 
          />
        )}
      </section>
    );
  }