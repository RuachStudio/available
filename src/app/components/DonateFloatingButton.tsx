"use client";

import { useState } from "react";

export default function DonateFloatingButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number | null>(25);

  const presetAmounts = [10, 25, 50, 100];

  const handleDonate = async () => {
    if (!amount || amount <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/checkout/donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("Donation error:", data);
        alert("Unable to start donation process.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong starting the donation process.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Donate Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setOpen(true)}
          className="bg-red-600/60 text-white rounded-full shadow-lg px-5 py-3 hover:bg-red-600/90 transition-all"
        >
          Donate
        </button>
      </div>

      {/* Popup Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-80 p-6 relative">
            {/* Close button */}
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Support Us</h2>
            <p className="text-gray-600 mb-4">Choose an amount to donate:</p>

            {/* Preset buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {presetAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`border rounded-lg py-2 font-semibold ${
                    amount === amt
                      ? "bg-red-600 text-white border-red-600"
                      : "border-gray-300 hover:border-red-600"
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Custom amount input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                Custom Amount
              </label>
              <input
                type="number"
                min="1"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter amount"
                value={amount ?? ""}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
              />
            </div>

            {/* Checkout button */}
            <button
              onClick={handleDonate}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-all"
            >
              {loading ? "Processing..." : `Donate $${amount ?? ""}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}