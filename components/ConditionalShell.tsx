"use client";
import { usePathname } from "next/navigation";
import Navbar from "./landing/Navbar";
import Footer from "./landing/Footer";

const SHELL_EXCLUDED_PREFIXES = [
  "/patient",
  "/doctor",
  "/admin",
  "/h",
  "/MED-",
  "/auth",
];

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideShell = SHELL_EXCLUDED_PREFIXES.some(prefix =>
    pathname.startsWith(prefix)
  );

  if (hideShell) {
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
