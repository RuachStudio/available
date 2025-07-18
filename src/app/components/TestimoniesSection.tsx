

"use client";

type Testimony = {
  id: string;
  name: string;
  quote: string;
  videoUrl: string;
};

const mockTestimonies: Testimony[] = [
  {
    id: "1",
    name: "Jordan",
    quote: "God had to break me before He could use me.",
    videoUrl: "/videos/testimony1.mp4",
  },
  {
    id: "2",
    name: "Alyssa",
    quote: "I surrendered my addiction and found real freedom.",
    videoUrl: "/videos/testimony2.mp4",
  },
  {
    id: "3",
    name: "Marcus",
    quote: "I let go of control and gave God my yes.",
    videoUrl: "/videos/testimony3.mp4",
  },
];

export default function TestimoniesSection() {
  return (
    <section className="py-20 px-6 bg-black text-white">
      <h2 className="text-3xl font-bold mb-8 text-center">Real People. Real Surrender.</h2>
      <div className="overflow-x-auto whitespace-nowrap flex gap-6 pb-4">
        {mockTestimonies.map(({ id, name, quote, videoUrl }) => (
          <div
            key={id}
            className="w-72 bg-gray-900 rounded-lg p-4 shadow-md shrink-0"
          >
            <video
              src={videoUrl}
              controls
              className="w-full h-40 object-cover rounded mb-3"
            />
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-gray-300 italic">“{quote}”</p>
          </div>
        ))}
      </div>
    </section>
  );
}