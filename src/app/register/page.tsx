// app/register/page.tsx
export const dynamic = 'force-dynamic';
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