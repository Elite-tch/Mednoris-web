"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Stethoscope,
  CreditCard,
  ShieldCheck,
  Bot,
  Users,
  Settings,
  Bell,
  MessageCircle,
  Upload,
  User,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
  { label: "My Records", href: "/patient/dashboard/vault", icon: FileText },
  { label: "Upload", href: "/patient/dashboard/upload", icon: Upload },
  { label: "Appointments", href: "/patient/dashboard/appointments", icon: CalendarDays },
  { label: "Doctors", href: "/patient/dashboard/doctors", icon: Stethoscope },
  { label: "Medical Passport", href: "/patient/dashboard/passport", icon: CreditCard },
  { label: "Access Requests", href: "/patient/dashboard/permissions", icon: ShieldCheck },
  { label: "Chat", href: "/patient/dashboard/chat", icon: MessageCircle },
  { label: "AI Assistant", href: "/patient/dashboard/ai-assistant", icon: Bot },
  { label: "Notifications", href: "/patient/dashboard/notifications", icon: Bell },
  { label: "Family", href: "/patient/dashboard/family", icon: Users },
  { label: "Profile", href: "/patient/dashboard/profile", icon: User },
  { label: "Settings", href: "/patient/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-brand-primary text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <img src="/logo.png" alt="Mednoris" className="w-8 h-8 object-contain brightness-0 invert" />
        <span className="text-lg font-extrabold tracking-tight">MEDNORIS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-1 overflow-y-auto sidebar-scroll">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/patient/dashboard"
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
