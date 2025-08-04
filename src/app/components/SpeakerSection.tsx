"use client";

import { motion } from "framer-motion";

const speakers = [
  {
    name: "Jessica Gainey & Michelle Chapman",
    title: "Breakout 2/C: Are You Disqualified?",
    image: "/speakers/jessica-michelle.jpg",
  },
  {
    name: "Bradley Bennett",
    title: "Session 1: 5 Fold Ministry",
    image: "/speakers/bradley.jpg",
  },
  {
    name: "Brooke Kinchen",
    title: "Friday Night Service / Breakout 1/C: Creatively Available",
    image: "/speakers/brooke.jpg",
  },
  {
    name: "Ashley May",
    title: "Breakout 2/A: When You Say YES!",
    image: "/speakers/ashley.jpg",
  },
  {
    name: "Tessie Baehr",
    title: "Breakout 1/A: Physically Available",
    image: "/speakers/tessie.jpg",
  },
  {
    name: "Apostle Krista Lathem",
    title: "Saturday Night: Commissioning Service",
    image: "/speakers/krista.jpg",
  },
];

export default function SpeakersSection() {
  return (
    <section className="py-12 bg-gray-900 text-white">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Meet the Speakers</h2>
      <div className="flex overflow-x-auto md:grid md:grid-cols-3 md:gap-8 space-x-6 md:space-x-0 px-4 snap-x md:overflow-visible">
        {speakers.map((speaker, index) => (
          <motion.div
            key={index}
            className="min-w-[80%] md:min-w-0 bg-black/70 rounded-lg shadow-lg p-4 snap-center flex-shrink-0 md:flex-shrink hover:cursor-pointer"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="overflow-hidden rounded-md">
              <img
                src={speaker.image}
                alt={speaker.name}
                className="w-full h-56 object-cover rounded-md transition-transform duration-300 hover:scale-105"
              />
            </div>
            <h3 className="text-xl font-semibold mt-4">{speaker.name}</h3>
            <p className="text-red-400 text-sm md:text-base">{speaker.title}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}