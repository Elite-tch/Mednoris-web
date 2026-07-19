"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  MessageCircle,
  Bell,
  Bot,
  User,
  Settings,
} from "lucide-react";

import { usePrivy } from "@privy-io/react-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const navItems = [
  { label: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
  { label: "Appointments", href: "/doctor/dashboard/appointments", icon: CalendarDays },
  { label: "Availability", href: "/doctor/dashboard/availability", icon: Clock },
  { label: "Chat", href: "/doctor/dashboard/chat", icon: MessageCircle },
  { label: "Notifications", href: "/doctor/dashboard/notifications", icon: Bell },
  { label: "AI Assistant", href: "/doctor/dashboard/ai-assistant", icon: Bot },
  { label: "Profile", href: "/doctor/dashboard/profile", icon: User },
  { label: "Settings", href: "/doctor/dashboard/settings", icon: Settings },
];

export default function DoctorSidebar() {
  const pathname = usePathname();
  const { user } = usePrivy();
  const [status, setStatus] = useState("Pending Verification");

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "doctors", user.id));
      if (snap.exists() && snap.data().status) {
        setStatus(snap.data().status);
      }
    };
    fetch();
  }, [user]);

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-brand-primary text-white shrink-0">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Mednoris" className="w-22 h-22 object-contain brightness-0 invert" />
          </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 flex flex-col">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                isActive
                  ? "bg-brand-secondary text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-white/70"} />
              {item.label}
            </Link>
          );
        })}
      </div>
      
      
    </aside>
  );
}
