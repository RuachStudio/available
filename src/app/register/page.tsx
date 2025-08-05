"use client";
export const dynamic = 'force-dynamic';

import ConferenceRegistration from "../components/ConfrenceRegistration";

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