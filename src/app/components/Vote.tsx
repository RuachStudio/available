"use client";
import { useState, useEffect } from "react";
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

interface VoteProps {
  onComplete?: () => void;
}

export default function SpeakerPoll({ onComplete }: VoteProps) {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/poll")
      .then((res) => res.json())
      .then((data: { speaker: string; votes: number }[]) => {
        const mapped = Object.fromEntries(data.map((item) => [item.speaker, item.votes]));
        setVotes(mapped);
      });
  }, []);

  const handleVote = async (speaker: string) => {
    if (hasVoted) return;
    await fetch("/api/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speaker }),
    });

    setVotes((prev) => ({ ...prev, [speaker]: (prev[speaker] || 0) + 1 }));
    setSelected(speaker);
    setHasVoted(true);

    // Trigger onComplete callback to auto-close modal
    if (onComplete) {
      setTimeout(() => onComplete(), 800); // slight delay for animation
    }
  };

  const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0);

  return (
    <section className="py-12 bg-gray-900 text-white">
      <h2 className="text-3xl font-bold text-center mb-6">Who Are You Most Excited to See?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {speakerPosters.map((speaker) => {
          const count = votes[speaker.alt] || 0;
          const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;

          return (
            <motion.div
              key={speaker.alt}
              className={`p-4 rounded-lg bg-gray-800 hover:scale-105 transition cursor-pointer ${
                selected === speaker.alt ? "border-2 border-yellow-400" : ""
              }`}
              whileHover={{ scale: 1.03 }}
              onClick={() => handleVote(speaker.alt)}
            >
              <Image src={speaker.src} alt={speaker.alt} width={500} height={600} className="rounded-lg mb-3 w-full h-auto" />
              <h3 className="text-xl font-semibold text-center">{speaker.alt}</h3>

              {hasVoted && (
                <div className="mt-4">
                  <div className="bg-gray-700 h-3 rounded">
                    <motion.div
                      className="bg-yellow-400 h-3 rounded"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-sm mt-1 text-center">{percentage.toFixed(1)}% ({count} votes)</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {!hasVoted && (
        <p className="text-center mt-4 text-gray-400">Tap a speaker to cast your vote!</p>
      )}
    </section>
  );
}