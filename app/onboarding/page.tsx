"use client";

import { useState } from "react";
import RoleSelection from "./components/RoleSelection";
import PatientForm from "./components/PatientForm";
import DoctorForm from "./components/DoctorForm";

export default function OnboardingPage() {
  const [role, setRole] = useState<"patient" | "doctor" | null>(null);

  return (
    <div className="min-h-[80vh] flex flex-col items-center bg-[#f8f7fb]  font-serif justify-center p-8">
      {!role && <RoleSelection onSelect={setRole} />}
      {role === "patient" && <PatientForm onBack={() => setRole(null)} />}
      {role === "doctor" && <DoctorForm onBack={() => setRole(null)} />}
    </div>
  );
}
