"use client"
import RSVPForm from "../components/RSVPForm";
export default function RSVPPage() {
    return (
      <main className="min-h-screen bg-black text-white px-6 py-16">
        <h1 className="text-3xl font-bold mb-8 text-center">RSVP</h1>
        <RSVPForm />
      </main>
    );
  }