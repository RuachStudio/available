"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const speakerPosters = [
  { src: "/speakers/jessica-michelle.webp", alt: "Jessica Gainey & Michelle Chapman" },
  { src: "/speakers/bradley.webp", alt: "Bradley Bennett" },
  { src: "/speakers/brooke.webp", alt: "Brooke Kinchen" },
  { src: "/speakers/ashley.webp", alt: "Ashley May" },
  { src: "/speakers/tessie.webp", alt: "Tessie Baehr" },
  { src: "/speakers/krista.webp", alt: "Apostle Krista Lathem" },
];

export default function SpeakersSection() {
  return (
    <section className="py-12 bg-gray-900 text-white">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Meet the Speakers</h2>
      <div className="flex flex-col gap-6 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 px-4">
        {speakerPosters.map((poster, index) => (
          <motion.div
            key={index}
            className="w-full"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Image
              src={poster.src}
              alt={poster.alt}
              width={1080}
              height={1350}
              className="rounded-lg w-full h-auto object-cover"
              priority
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}