"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Activity, History, Settings, UserPlus, QrCode, X } from "lucide-react";

export default function HospitalSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const slug = params.slug as string;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggleHospitalSidebar", handleToggle);
    return () => window.removeEventListener("toggleHospitalSidebar", handleToggle);
  }, []);

  // Close sidebar on navigation on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const base = `/h/${slug}/admin`;

  const navItems = [
    { label: "Overview", href: base, icon: LayoutDashboard, exact: true },
    { label: "Patients", href: `${base}/patients`, icon: Users, exact: false },
    { label: "Staff Management", href: `${base}/staff`, icon: UserPlus, exact: false },
    { label: "Audit Logs", href: `${base}/logs`, icon: History, exact: false },
    { label: "Settings", href: `${base}/settings`, icon: Settings, exact: false },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 min-h-screen bg-brand-primary text-white shrink-0 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 md:h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          <Link href="/?view=landing" className="flex items-center gap-2">
            <img src="/logo.png" alt="Mednoris" className="h-8 md:h-10 object-contain brightness-0 invert" />
          </Link>
          <button className="md:hidden text-white/70 hover:text-white" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

      {/* Section Label */}
      <div className="px-6 pt-6 pb-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
          Admin Panel
        </p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-white/60"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      </aside>
    </>
  );
}
