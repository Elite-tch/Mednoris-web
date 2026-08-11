"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { LayoutDashboard, Users, QrCode, UserPlus } from "lucide-react";

export default function StaffSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const slug = params.slug as string;

  const base = `/h/${slug}/staff`;

  const navItems = [
    { label: "Overview", href: base, icon: LayoutDashboard, exact: true },
    { label: "Patients", href: `${base}/patients`, icon: Users, exact: false },
    { label: "Scan Patient", href: `${base}/patients/scan`, icon: QrCode, exact: false },
    { label: "Register Patient", href: `${base}/patients/add`, icon: UserPlus, exact: false },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-brand-primary text-white shrink-0">
      <div className="h-20 flex items-center px-6 border-b border-white/10">
        <Link href="/?view=landing" className="flex items-center gap-2">
          <img src="/logo.png" alt="Mednoris" className="h-22 w-22 object-contain brightness-0 invert" />
        </Link>
      </div>

      <div className="px-6 pt-6 pb-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
          Staff Operations
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === base : pathname.startsWith(item.href);
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
  );
}
