"use client";
import { usePathname } from "next/navigation";
import Navbar from "./landing/Navbar";
import Footer from "./landing/Footer";

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPatientArea = pathname.startsWith("/patient");
  const isDoctorArea = pathname.startsWith("/doctor");
  const isAdminArea = pathname.startsWith("/admin");
  const isHospitalArea = pathname.startsWith("/h");

  // Only hide the Navbar and Footer if we are inside the dashboard areas
  if (isPatientArea || isDoctorArea || isAdminArea || isHospitalArea) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
