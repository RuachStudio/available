

"use client";

import { useState } from "react";

export default function RSVPForm() {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    reflection: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting RSVP:", formData);
    // TODO: Replace with Supabase insert or API call
    setSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      <input
        name="name"
        type="text"
        placeholder="Your Name"
        value={formData.name}
        onChange={handleChange}
        className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white"
        required
      />
      <input
        name="contact"
        type="text"
        placeholder="Phone or Email"
        value={formData.contact}
        onChange={handleChange}
        className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white"
        required
      />
      <textarea
        name="reflection"
        placeholder="What are you laying down? (Optional)"
        value={formData.reflection}
        onChange={handleChange}
        className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white"
        rows={4}
      />
      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-bold rounded transition"
      >
        {submitted ? "Thanks for RSVPing!" : "I’m Coming Broken, But Willing"}
      </button>
    </form>
  );
}