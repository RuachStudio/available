"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Vote from "@/app/components/Vote";

function PollOverlay({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: () => void;
}) {
  return (
    // Make the overlay itself scrollable
    <div className="fixed inset-0 z-[9999] bg-black/70 overflow-y-auto overscroll-contain">
      {/* Use items-start + min-h to allow panel to push page and scroll */}
      <div className="min-h-full flex items-start justify-center p-4">
        {/* Make the panel scroll within the viewport */}
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="sticky top-3 float-right mr-3 bg-black text-white hover:bg-red-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-2xl transition-colors duration-300"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="p-6 clear-both">
            <Vote onComplete={onComplete} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ThankYouContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [showPoll, setShowPoll] = useState(false);

  // Lock background scroll when overlay is open
  useEffect(() => {
    if (showPoll) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showPoll]);

  // Read params once per change
  const status = useMemo(
    () => params.get("checkout") || params.get("register") || "",
    [params]
  );
  const wantsPoll = useMemo(() => params.get("poll") === "1", [params]);
  const debugPoll = useMemo(() => params.get("poll") === "debug", [params]);

  useEffect(() => {
    const done =
      typeof window !== "undefined" &&
      localStorage.getItem("gcc_poll_done") === "1";
    if (debugPoll) {
      setShowPoll(true);
      return;
    }
    setShowPoll(wantsPoll && !done);

    // diagnostics
    // eslint-disable-next-line no-console
    console.log("[thank-you]", {
      status,
      wantsPoll,
      debugPoll,
      alreadyDone: done,
      url: typeof window !== "undefined" ? window.location.href : "(server)",
    });
  }, [wantsPoll, debugPoll, status]);

  const handlePollComplete = () => {
    try {
      localStorage.setItem("gcc_poll_done", "1");
    } catch {}
    setShowPoll(false);

    // Remove poll query from URL so refresh doesn't bring it back
    try {
      const sp = new URLSearchParams(Array.from(params.entries()));
      sp.delete("poll");
      const base = "/thank-you";
      const q = sp.toString();
      router.replace(q ? `${base}?${q}` : base);
    } catch {}
  };

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
          <Link
            href="/"
            className="px-5 py-3 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Back to Home
          </Link>
          <Link
            href="/register"
            className="px-5 py-3 rounded border border-gray-300 hover:bg-gray-100"
          >
            Reserve My Spot
          </Link>
        </div>
      </div>

      {showPoll && (
        <PollOverlay
          onClose={() => setShowPoll(false)}
          onComplete={handlePollComplete}
        />
      )}
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          <span className="inline-block animate-pulse">Loading…</span>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}