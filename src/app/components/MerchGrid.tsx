"use client";

import Image from "next/image";

type MerchItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  checkoutLink: string;
};

const merchItem: MerchItem = {
  id: "1",
  title: "AVAILABLE Tee",
  description: "Declare it. Wear it.",
  image: "/images/shirt.webp",
  checkoutLink: "/checkout/shirt1",
};

export default function MerchGrid() {
  return (
    <div className="bg-gray-900 rounded-lg p-6 text-center shadow hover:shadow-xl transition">
      <Image
        src={merchItem.image}
        alt={merchItem.title}
        width={1200}
        height={1200}
        className="w-full h-64 object-cover rounded"
        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 600px, 800px"
        priority
      />
      <h3 className="mt-4 text-xl font-semibold">{merchItem.title}</h3>
      <p className="text-sm text-gray-400 mb-4">{merchItem.description}</p>
      <a
        href={merchItem.checkoutLink}
        className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold"
      >
        Add to Cart
      </a>
    </div>
  );
}