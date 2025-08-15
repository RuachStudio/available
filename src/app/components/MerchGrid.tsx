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
  async function handleAddToCart() {
    try {
      const response = await fetch("/api/checkout/shirt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const contentType = response.headers.get("content-type") || "";

      // Handle non-2xx responses with useful diagnostics
      if (!response.ok) {
        const body = contentType.includes("application/json")
          ? await response.json().catch(() => ({}))
          : await response.text().catch(() => "");
        console.error("Checkout failed:", {
          status: response.status,
          statusText: response.statusText,
          body,
        });
        alert(
          `Checkout failed (${response.status}). ` +
            (typeof body === "string" && body
              ? body.slice(0, 200)
              : "Please try again.")
        );
        return;
      }

      // For 2xx responses, only parse JSON if it is JSON
      if (!contentType.includes("application/json")) {
        const text = await response.text().catch(() => "");
        console.error("Expected JSON, received:", text.slice(0, 500));
        alert("Unexpected response from server. Please try again.");
        return;
      }

      const data = await response.json().catch(() => null);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("No URL in response:", data);
        alert("Failed to initiate checkout. Please try again.");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("An error occurred. Please try again.");
    }
  }

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
      <button
        onClick={handleAddToCart}
        className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold"
      >
        Add to Cart
      </button>
    </div>
  );
}