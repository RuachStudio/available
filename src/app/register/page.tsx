// app/register/page.tsx

"use client";
import ConferenceRegistration from "../components/ConferenceRegistration";

export default function RegisterPage() {
  return (
    <section id="registration-section" className="py-12">
      <ConferenceRegistration 
        isOpen={true} 
        onClose={() => {}} 
      />
    </section>
  );
}