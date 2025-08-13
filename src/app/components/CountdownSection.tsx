"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const EVENT_DATES = [
  new Date("2025-10-17T18:00:00-05:00"),
  new Date("2025-10-18T18:00:00-05:00"),
];

function getNextEventDate(dates: Date[]) {
  const now = Date.now();
  for (const d of dates) {
    if (d.getTime() > now) return d;
  }
  return null;
}

function getTimeLeft(target: Date | null) {
  if (!target) return null;
  const now = new Date().getTime();
  const distance = target.getTime() - now;

  if (distance <= 0) return null;

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export default function CountdownSection() {
  const [target, setTarget] = useState<Date | null>(() => getNextEventDate(EVENT_DATES));
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(getNextEventDate(EVENT_DATES)));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      const next = getNextEventDate(EVENT_DATES);
      setTarget(next);
      setTimeLeft(getTimeLeft(next));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return null; // Prevent SSR hydration mismatch
  }

  if (!timeLeft) {
    return (
      <section className="py-20 px-6 bg-black text-center text-white">
        <motion.h2
          className="text-4xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          It’s Time.
        </motion.h2>
        <motion.p
          className="text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          The moment of availability has arrived.
        </motion.p>
      </section>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;

  return (
    <section className="py-20 px-6 bg-black text-white">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-12">
        {/* Left: Countdown text and timer */}
        <motion.div
          className="text-center md:text-left"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Countdown to the Call
          </h2>
          <div className="text-5xl font-mono tracking-widest space-x-2 flex justify-center md:justify-start">
            {[
              { label: "d", value: days },
              { label: "h", value: hours },
              { label: "m", value: minutes },
              { label: "s", value: seconds },
            ].map(({ label, value }) => (
              <motion.span
                key={label}
                className="inline-block"
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {String(value).padStart(2, "0")}
                <span className="text-lg align-top ml-1">{label}</span>
              </motion.span>
            ))}
          </div>
          <p className="mt-6 text-lg text-gray-400">
            October 17–18 • Doors Open 6PM CDT
            {target && (
              <span className="block text-sm text-gray-500 mt-1">
                Counting down to {target.getDate() === 17 ? "Night 1 (Oct 17)" : "Night 2 (Oct 18)"}
              </span>
            )}
          </p>
        </motion.div>

        {/* Right: Visual or quote */}
        <motion.div
          className="text-center md:text-right"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-xl md:text-2xl italic font-light max-w-md mx-auto md:mx-0">
            “You were born for more than comfort. You were made for the call.”
          </p>
        </motion.div>
      </div>
    </section>
  );
}