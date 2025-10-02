"use client";

import Image from "next/image";
import { useState } from "react";
import { EVENT_DETAILS } from "@/data/schedule";
import ConferenceRegistration from "./ConfrenceRegistration";

const detailCards = [
  {
    label: "Dates",
    value: EVENT_DETAILS.dates,
  },
  {
    label: "Location",
    value: EVENT_DETAILS.locationName,
    helper: EVENT_DETAILS.address,
  },
  {
    label: "Hosted By",
    value: EVENT_DETAILS.host,
  },
];

export default function EventOverviewSection() {
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[#F8F5F1] text-[#1A2235] py-16 px-6">
      <Image
        src="/images/events/available-2025/slice6.png"
        alt=""
        width={613}
        height={613}
        className="pointer-events-none select-none absolute -top-32 -left-36 w-64 opacity-60 sm:w-80"
        priority
      />
      <Image
        src="/images/events/available-2025/slice4.png"
        alt=""
        width={229}
        height={229}
        className="pointer-events-none select-none absolute -bottom-16 right-6 w-24 opacity-80 sm:w-36"
        priority
      />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12">
        <div className="text-center md:text-left">
          <p className="text-sm uppercase tracking-[0.4em] text-[#E53B3B]">{EVENT_DETAILS.host}</p>
          <h2 className="mt-4 text-4xl font-semibold md:text-5xl">{EVENT_DETAILS.name}</h2>
          <p className="mt-4 text-lg text-[#454b63] md:max-w-2xl">
            Two nights of worship, teaching, and activation designed to call you out of comfort and into availability.
            Join us in Loranger, Louisiana for a weekend that will stir your yes.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
            <button
              onClick={() => setShowOverlay(true)}
              className="inline-flex items-center justify-center rounded-full bg-[#E53B3B] px-8 py-3 text-base font-semibold text-white shadow-lg shadow-[#E53B3B]/40 transition hover:bg-[#d83131]"
            >
              Reserve My Spot
            </button>
            <a
              href={EVENT_DETAILS.registerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[#1A2235] px-8 py-3 text-base font-semibold text-[#1A2235] transition hover:bg-[#1A2235] hover:text-white"
            >
              Visit godscoffeecall.com
            </a>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {detailCards.map((detail) => (
            <div
              key={detail.label}
              className="rounded-3xl border border-[#E1DAD0] bg-white/90 p-6 shadow-md shadow-black/5 backdrop-blur"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#E53B3B]">{detail.label}</p>
              <p className="mt-3 text-2xl font-medium text-[#1A2235]">{detail.value}</p>
              {detail.helper && (
                <p className="mt-2 text-sm text-[#454b63]">{detail.helper}</p>
              )}
            </div>
          ))}
        </div>
      </div>
      {showOverlay && (
        <ConferenceRegistration isOpen={showOverlay} onClose={() => setShowOverlay(false)} />
      )}
    </section>
  );
}
