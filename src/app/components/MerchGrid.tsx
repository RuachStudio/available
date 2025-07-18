

// Responsive merch grid with image, title, description, and Stripe checkout link
"use client";

type MerchItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  checkoutLink: string;
};

const mockMerch: MerchItem[] = [
  {
    id: "1",
    title: "AVAILABLE Tee",
    description: "Declare it. Wear it.",
    image: "/images/shirt1.png",
    checkoutLink: "/checkout/shirt1",
  },
  {
    id: "2",
    title: "Wristband – I'm Available",
    description: "A daily reminder to surrender.",
    image: "/images/wristband.png",
    checkoutLink: "/checkout/wristband",
  },
  {
    id: "3",
    title: "AVAILABLE Sticker Pack",
    description: "Slap the message everywhere.",
    image: "/images/stickers.png",
    checkoutLink: "/checkout/stickers",
  },
];

export default function MerchGrid() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {mockMerch.map((item) => (
        <div
          key={item.id}
          className="bg-gray-900 rounded-lg p-6 text-center shadow hover:shadow-xl transition"
        >
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-64 object-cover rounded"
          />
          <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
          <p className="text-sm text-gray-400 mb-4">{item.description}</p>
          <a
            href={item.checkoutLink}
            className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold"
          >
            Add to Cart
          </a>
        </div>
      ))}
    </div>
  );
}