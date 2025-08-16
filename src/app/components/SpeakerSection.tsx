"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const speakerPosters = [
  { src: "/speakers/jessica-michelle.webp", alt: "Michelle Chapman & Jessica Gainey" },
  { src: "/speakers/bradley.webp", alt: "Pastor Bradley Bennett" },
  { src: "/speakers/brandon-kalyn.webp", alt: "Brandon Kinchen & Kalyn Belvin" },
  { src: "/speakers/brooke.webp", alt: "Brooke Kinchen" },
  { src: "/speakers/krista.webp", alt: "Apostle Krista Lathem" },
  { src: "/speakers/tessie.webp", alt: "Tessie Baehr" },
  { src: "/speakers/ashley.webp", alt: "Ashley May" },
  { src: "/speakers/mitchell-brooke.webp", alt: "Mitchell Padayao & Brooke Kinchen" },
];

export default function SpeakersSection() {
  return (
    <section className="py-12 bg-gray-900 text-white">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Meet the Speakers</h2>
      <div className="flex flex-col gap-6 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 px-4">
        {speakerPosters.map((poster, index) => (
          <motion.div
            key={index}
            className="relative w-full group overflow-hidden rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
          >
            <Image
              src={poster.src}
              alt={poster.alt}
              width={1080}
              height={1350}
              className="rounded-lg w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <p className="text-white text-xl font-semibold px-4 text-center">{poster.alt}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}