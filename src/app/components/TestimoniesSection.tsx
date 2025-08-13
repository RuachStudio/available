
"use client";
import { motion } from "framer-motion";

type PromoVideo = {
  id: string;
  videoUrl: string;
};

const promoVideos: PromoVideo[] = [
  { id: "1", videoUrl: "/videos/available_promo.mp4" },
  { id: "2", videoUrl: "/videos/available-promo2.mp4" },
  { id: "3", videoUrl: "/videos/available_promo3.mp4" },
];

export default function PromoVideosSection() {
  return (
    <section className="py-12 md:py-20 px-6 bg-black text-white">
      <motion.h2
        className="text-2xl md:text-3xl font-extrabold mb-2 md:mb-3 text-center tracking-tight"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        AVAILABLE <span className="text-red-500">Hype Reels</span>
      </motion.h2>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 160, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
        className="mx-auto mb-6 md:mb-8 h-1 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-500"
      />
      <div className="-mx-6 px-6 flex gap-4 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:mx-0 md:px-0">
        {promoVideos.map(({ id, videoUrl }) => (
          <motion.div
            key={id}
            className="snap-start shrink-0 w-[72vw] max-w-[380px] md:w-full bg-gray-900 rounded-xl p-3 shadow-md hover:shadow-xl transition"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: "9 / 16" }}>
              <video
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}