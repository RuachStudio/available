"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { SCHEDULE, ScheduleDay } from "@/data/schedule";

const mobileTabs = SCHEDULE.map((day) => ({ id: day.id, label: day.label }));

function DaySchedule({ day }: { day: ScheduleDay }) {
  return (
    <motion.div
      key={day.id}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
    >
      <div className="flex flex-col gap-1 text-center md:text-left">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#E53B3B]">{day.label}</p>
        <h3 className="text-2xl font-semibold text-white">{day.date}</h3>
        <p className="text-sm text-gray-300">{day.summary}</p>
      </div>
      <div className="mt-8 space-y-6">
        {day.sessions.map((session) => {
          const borderClass = session.emphasis ? "border-[#E53B3B]/40" : "border-white/10";
          const titleClass = session.emphasis ? "text-[#FF6B6B]" : "text-white";

          return (
            <div
              key={`${day.id}-${session.time}-${session.title}`}
              className={`grid items-start gap-4 rounded-2xl border ${borderClass} bg-black/40 p-4 shadow-lg shadow-black/20 transition`}
            >
              <div className="text-sm font-mono uppercase tracking-wider text-gray-300">
                {session.time}
              </div>
              <div>
                <p className={`text-lg font-semibold ${titleClass}`}>{session.title}</p>
                {session.description && (
                  <p className="mt-2 text-sm text-gray-300">{session.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function ScheduleSection() {
  const [activeDay, setActiveDay] = useState<typeof mobileTabs[number]["id"]>(mobileTabs[0].id);

  const activeSchedule = useMemo(
    () => SCHEDULE.find((day) => day.id === activeDay) ?? SCHEDULE[0],
    [activeDay]
  );

  return (
    <section className="relative overflow-hidden bg-[#111423] py-20 px-6 text-white">
      <Image
        src="/images/events/available-2025/slice1.png"
        alt=""
        width={323}
        height={323}
        className="pointer-events-none select-none absolute -top-20 right-4 w-32 opacity-40 sm:w-48"
        priority
      />
      <Image
        src="/images/events/available-2025/slice2.png"
        alt=""
        width={114}
        height={114}
        className="pointer-events-none select-none absolute bottom-16 left-6 w-16 opacity-90"
      />
      <Image
        src="/images/events/available-2025/slice3.png"
        alt=""
        width={55}
        height={55}
        className="pointer-events-none select-none absolute bottom-12 left-32 hidden w-10 opacity-80 sm:block"
      />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[#E53B3B]">Weekend Flow</p>
          <h2 className="mt-4 text-4xl font-semibold md:text-5xl">Conference Schedule</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-300">
            Here’s how the weekend unfolds. View each day’s rhythm and plan ahead so you never miss the moments prepared for you.
          </p>
        </div>
        <div className="md:hidden">
          <div className="flex rounded-full bg-white/10 p-1">
            {mobileTabs.map((tab) => {
              const isActive = activeDay === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDay(tab.id)}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-white text-[#111423]" : "text-gray-300 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <DaySchedule day={activeSchedule} key={activeSchedule.id} />
            </AnimatePresence>
          </div>
        </div>
        <div className="hidden gap-6 md:grid md:grid-cols-2">
          {SCHEDULE.map((day) => (
            <DaySchedule day={day} key={day.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
