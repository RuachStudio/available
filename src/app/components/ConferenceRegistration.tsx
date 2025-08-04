"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const shirtSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

interface ConferenceRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConferenceRegistration({ isOpen, onClose }: ConferenceRegistrationProps) {
  const [ticketCount, setTicketCount] = useState(1);
  const [formData, setFormData] = useState({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
    prayerRequest: "",
    attendees: [
      { name: "", phone: "", email: "", address: "", shirtSize: "", notes: "" },
    ],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, idx?: number) => {
    const { name, value } = e.target;
    if (idx !== undefined) {
      const updatedAttendees = [...formData.attendees];
      updatedAttendees[idx] = { ...updatedAttendees[idx], [name]: value };
      setFormData({ ...formData, attendees: updatedAttendees });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleTicketChange = (count: number) => {
    setTicketCount(count);
    const newAttendees = Array(count)
      .fill(null)
      .map((_, i) => formData.attendees[i] || { name: "", phone: "", email: "", address: "", shirtSize: "", notes: "" });
    setFormData({ ...formData, attendees: newAttendees });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Registration failed");
      const data = await res.json();
      console.log("Registration successful:", data);

      alert("✅ Registration successful! A confirmation email has been sent.");
      onClose(); // Close modal on success
    } catch (error) {
      console.error("Error:", error);
      alert("❌ There was an issue submitting your registration.");
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-2xl text-black relative max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>
      <h2 className="text-2xl font-bold text-center mb-4">Conference Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Primary Contact */}
        <input name="contactName" type="text" placeholder="Your Full Name" required className="w-full p-3 border rounded-lg" onChange={handleChange} />
        <input name="contactPhone" type="tel" placeholder="Your Phone Number" required className="w-full p-3 border rounded-lg" onChange={handleChange} />
        <input name="contactEmail" type="email" placeholder="Your Email (Optional)" className="w-full p-3 border rounded-lg" onChange={handleChange} />
        <input name="contactAddress" type="text" placeholder="Your Mailing Address (Optional)" className="w-full p-3 border rounded-lg" onChange={handleChange} />

        {/* T-Shirt Size for Primary Contact */}
        <select
          name="primaryShirtSize"
          required
          className="w-full p-3 border rounded-lg"
          onChange={(e) => 
            setFormData({ 
              ...formData, 
              attendees: [
                { ...formData.attendees[0], shirtSize: e.target.value },
                ...formData.attendees.slice(1)
              ]
            })
          }
        >
          <option value="">Select T-Shirt Size</option>
          {shirtSizes.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        {/* Number of Tickets */}
        <div>
          <label className="block mb-1 font-semibold">Number of Tickets</label>
          <select
            value={ticketCount}
            onChange={(e) => handleTicketChange(Number(e.target.value))}
            className="w-full p-3 border rounded-lg"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Attendee Fields */}
        <AnimatePresence>
          {formData.attendees.map((attendee, idx) => (
            idx === 0 ? null : (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 border rounded-lg bg-gray-50 mt-2"
              >
                <h3 className="font-semibold mb-2">Attendee {idx + 1}</h3>
                <input name="name" placeholder="Full Name" required value={attendee.name} className="w-full p-2 border rounded mb-2" onChange={(e) => handleChange(e, idx)} />
                <input name="phone" placeholder="Phone Number" required value={attendee.phone} className="w-full p-2 border rounded mb-2" onChange={(e) => handleChange(e, idx)} />
                <input name="email" placeholder="Email (Optional)" value={attendee.email} className="w-full p-2 border rounded mb-2" onChange={(e) => handleChange(e, idx)} />
                <input name="address" placeholder="Mailing Address (Optional)" value={attendee.address} className="w-full p-2 border rounded mb-2" onChange={(e) => handleChange(e, idx)} />
                <select name="shirtSize" required value={attendee.shirtSize} className="w-full p-2 border rounded mb-2" onChange={(e) => handleChange(e, idx)}>
                  <option value="">Select T-Shirt Size</option>
                  {shirtSizes.map((size) => (
                    <option key={size}>{size}</option>
                  ))}
                </select>
                <textarea 
                  name="notes" 
                  placeholder="Special Notes (Dietary/Accessibility)" 
                  value={attendee.notes} 
                  onChange={(e) => handleChange(e, idx)} 
                  className="w-full p-2 border rounded"></textarea>
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {/* Prayer Requests */}
        <textarea
          name="prayerRequest"
          placeholder="Prayer Requests (Optional)"
          className="w-full p-3 border rounded-lg"
          onChange={handleChange}
        ></textarea>

        <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
          Submit Registration
        </button>
      </form>
          </motion.div>
        </div>
      )}
    </>
  );
}