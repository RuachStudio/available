"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Vote from "@/app/components/Vote";

export default function ThankYouPage() {
  const params = useSearchParams();
  const [showPoll, setShowPoll] = useState(false);

  useEffect(() => {
    const wantsPoll = params.get("poll") === "1";
    const alreadyDone =
      typeof window !== "undefined" && localStorage.getItem("gcc_poll_done") === "1";
    if (wantsPoll && !alreadyDone) {
      setShowPoll(true);
    }
  }, [params]);

  const handlePollComplete = () => {
    try {
      localStorage.setItem("gcc_poll_done", "1");
    } catch {}
    setShowPoll(false);
  };

  const status = params.get("checkout") || params.get("register");

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {status === "success" ? "Thank you for your purchase!" : "Thank you!"}
        </h1>
        <p className="text-gray-600 mb-8">
          {status === "success"
            ? "Your order was received. A confirmation email is on its way."
            : "We appreciate your support and registration."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/" className="px-5 py-3 rounded bg-red-600 text-white hover:bg-red-700">
            Back to Home
          </a>
          <a href="/register" className="px-5 py-3 rounded border border-gray-300 hover:bg-gray-100">
            Reserve My Spot
          </a>
        </div>
      </div>

      {showPoll && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl relative">
            <button
              onClick={() => setShowPoll(false)}
              className="absolute top-3 right-3 bg-black text-white hover:bg-red-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-2xl transition-colors duration-300"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="p-6">
              <Vote onComplete={handlePollComplete} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}