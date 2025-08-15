"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Vote from "./Vote";

const shirtSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

type Attendee = {
  name: string;
  phone: string;
  email: string;
  address: string;
  wantsShirt: boolean;
  shirtSize: string;
  notes: string;
};

type RegistrationForm = {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  prayerRequest: string;
  primaryWantsShirt: boolean;
  primaryShirtSize: string;
  attendees: Attendee[];
};

interface ConferenceRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConferenceRegistration({ isOpen, onClose }: ConferenceRegistrationProps) {
  const [ticketCount, setTicketCount] = useState(1);
  const [showPoll, setShowPoll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegistrationForm>({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
    prayerRequest: "",
    primaryWantsShirt: false,
    primaryShirtSize: "",
    attendees: [
      { name: "", phone: "", email: "", address: "", wantsShirt: false, shirtSize: "", notes: "" },
    ],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, idx?: number) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name } = target;
    const fieldValue =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
    if (idx !== undefined) {
      const updatedAttendees: Attendee[] = [...formData.attendees];
      updatedAttendees[idx] = { ...updatedAttendees[idx], [name]: fieldValue } as Attendee;
      setFormData({ ...formData, attendees: updatedAttendees });
    } else {
      setFormData({ ...formData, [name]: fieldValue } as RegistrationForm);
    }
  };

  const handleTicketChange = (count: number) => {
    setTicketCount(count);
    const newAttendees: Attendee[] = Array(count)
      .fill(null)
      .map((_, i) =>
        formData.attendees[i] || ({ name: "", phone: "", email: "", address: "", wantsShirt: false, shirtSize: "", notes: "" } as Attendee)
      );
    setFormData({ ...formData, attendees: newAttendees });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions
    setIsSubmitting(true);

    try {
      // 1) Duplicate check with robust handling
      const duplicateCheck = await fetch("/api/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.contactEmail,
          phone: formData.contactPhone,
        }),
      });

      const dupCT = duplicateCheck.headers.get("content-type") || "";
      let duplicateResult: any = null;
      if (dupCT.includes("application/json")) {
        duplicateResult = await duplicateCheck.json().catch(() => null);
      }
      if (!duplicateCheck.ok) {
        const body = dupCT.includes("application/json")
          ? duplicateResult || {}
          : await duplicateCheck.text().catch(() => "");
        console.error("/api/check-duplicate failed:", {
          status: duplicateCheck.status,
          statusText: duplicateCheck.statusText,
          body,
        });
        setErrorMessage("⚠️ Unable to validate duplicates. Please try again.");
        setTimeout(() => setErrorMessage(null), 4000);
        setIsSubmitting(false);
        return;
      }
      if (duplicateResult?.exists) {
        setErrorMessage("⚠️ This email or phone number is already registered.");
        setTimeout(() => setErrorMessage(null), 4000);
        setIsSubmitting(false);
        return;
      }

      // 2) Submit registration (robust)
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const regCT = res.headers.get("content-type") || "";
      let regData: any = null;

      if (!res.ok) {
        const body = regCT.includes("application/json")
          ? await res.json().catch(() => ({}))
          : await res.text().catch(() => "");
        console.error("Registration failed:", {
          status: res.status,
          statusText: res.statusText,
          body,
        });
        if (
          regCT.includes("application/json") &&
          (body as any)?.error === "Duplicate entry" &&
          (body as any)?.field?.includes("contactPhone")
        ) {
          setErrorMessage("⚠️ This phone number is already registered.");
        } else if (
          regCT.includes("application/json") &&
          (body as any)?.error === "Duplicate entry" &&
          (body as any)?.field?.includes("contactEmail")
        ) {
          setErrorMessage("⚠️ This email is already registered.");
        } else {
          setErrorMessage("❌ Registration failed. Please try again.");
        }
        setTimeout(() => setErrorMessage(null), 4000);
        setIsSubmitting(false);
        return;
      }

      if (regCT.includes("application/json")) {
        regData = await res.json().catch(() => null);
      } else {
        // Unexpected content-type
        const text = await res.text().catch(() => "");
        console.error("Expected JSON from /api/register, received:", text.slice(0, 500));
      }

      console.log("Registration successful:", regData);
      setSuccessMessage("✅ Registration successful! A confirmation email has been sent.");
      setTimeout(() => setSuccessMessage(null), 4000);
      setShowPoll(true); // Show poll instead of closing modal

      // 3) Build shirt line items
      const selectedShirts: { size: string; attendeeName: string }[] = [];
      if (formData.primaryWantsShirt && formData.primaryShirtSize) {
        selectedShirts.push({
          size: formData.primaryShirtSize,
          attendeeName: formData.contactName || "Primary",
        });
      }
      formData.attendees.forEach((a: Attendee) => {
        if (a.wantsShirt && a.shirtSize) {
          selectedShirts.push({ size: a.shirtSize, attendeeName: a.name || "Guest" });
        }
      });

      if (selectedShirts.length > 0) {
        try {
          // Use the singular route we implemented
          const checkoutRes = await fetch("/api/checkout/shirt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shirts: selectedShirts,
              contact: {
                name: formData.contactName,
                email: formData.contactEmail,
                phone: formData.contactPhone,
              },
            }),
          });

          const coCT = checkoutRes.headers.get("content-type") || "";
          if (!checkoutRes.ok) {
            const body = coCT.includes("application/json")
              ? await checkoutRes.json().catch(() => ({}))
              : await checkoutRes.text().catch(() => "");
            console.warn("Stripe session error:", {
              status: checkoutRes.status,
              statusText: checkoutRes.statusText,
              body,
            });
          } else if (!coCT.includes("application/json")) {
            const text = await checkoutRes.text().catch(() => "");
            console.error("Expected JSON from /api/checkout/shirt, received:", text.slice(0, 500));
          } else {
            const checkoutData = await checkoutRes.json().catch(() => null);
            if (checkoutData?.url) {
              window.location.href = checkoutData.url; // Redirect to Stripe Checkout
              return;
            } else {
              console.warn("Stripe session response missing URL:", checkoutData);
            }
          }
        } catch (err) {
          console.error("Stripe session creation failed", err);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("❌ There was an issue submitting your registration.");
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {successMessage && (
        <div className="fixed top-5 inset-x-0 flex justify-center z-50">
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity">
            {successMessage}
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-20 inset-x-0 flex justify-center z-50">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity">
            {errorMessage}
          </div>
        </div>
      )}
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-auto">
          <AnimatePresence mode="wait">
            {!showPoll ? (
              <motion.div
                key="registration"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-2xl text-black relative max-h-[90vh] overflow-y-auto"
              >
                {/* Close Button */}
                <button 
                  onClick={onClose} 
                  className="absolute top-3 right-3 bg-black text-white hover:bg-red-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-2xl transition-colors duration-300"
                  aria-label="Close"
                >
                  ✕
                </button>
      <h2 className="text-2xl font-bold text-center mb-4">Conference Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Primary Contact */}
        <input name="contactName" type="text" placeholder="Your Full Name" required className="w-full p-3 border rounded-lg" onChange={handleChange} />
        <input name="contactPhone" type="tel" placeholder="Your Phone Number" required className="w-full p-3 border rounded-lg" onChange={handleChange} />
        <input name="contactEmail" type="email" placeholder="Your Email" required className="w-full p-3 border rounded-lg" onChange={handleChange} />
        <input name="contactAddress" type="text" placeholder="Your Mailing Address (Optional)" className="w-full p-3 border rounded-lg" onChange={handleChange} />

        {/* Shirt selection for Primary Contact */}
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="primaryWantsShirt"
              checked={formData.primaryWantsShirt}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <span className="font-medium">Add AVAILABLE Tee to my registration</span>
          </label>
          {formData.primaryWantsShirt && (
            <select
              name="primaryShirtSize"
              required
              className="w-full p-3 border rounded-lg"
              value={formData.primaryShirtSize}
              onChange={handleChange}
            >
              <option value="">Select T-Shirt Size</option>
              {shirtSizes.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          )}
          <p className="text-sm text-gray-500">Shirts are optional and purchased after registration via secure checkout.</p>
        </div>

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
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    name="wantsShirt"
                    checked={attendee.wantsShirt}
                    onChange={(e) => handleChange(e, idx)}
                    className="h-4 w-4"
                  />
                  <span>Add AVAILABLE Tee</span>
                </label>
                {attendee.wantsShirt && (
                  <select name="shirtSize" required value={attendee.shirtSize} className="w-full p-2 border rounded mb-2" onChange={(e) => handleChange(e, idx)}>
                    <option value="">Select T-Shirt Size</option>
                    {shirtSizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                )}
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

        <p className="text-xs text-gray-500">Note: If you add a shirt, you’ll be redirected to secure payment after submitting.</p>

        <button 
          type="submit" 
          className={`w-full py-3 rounded-lg font-semibold transition ${
            isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800"
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Registration"}
        </button>
      </form>
              </motion.div>
            ) : (
              <motion.div
                key="poll"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-3xl text-black relative max-h-[90vh] overflow-y-auto"
              >
                {/* Close Button */}
                <button 
                  onClick={onClose} 
                  className="absolute top-3 right-3 bg-black text-white hover:bg-red-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-2xl transition-colors duration-300"
                  aria-label="Close"
                >
                  ✕
                </button>
                {/* Pass auto-close callback to Vote */}
                <Vote onComplete={onClose} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}