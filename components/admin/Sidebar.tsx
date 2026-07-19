"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck } from "lucide-react";

const navItems = [
  { label: "Platform Analytics", href: "/admin", icon: LayoutDashboard },
  { label: "Verification Queue", href: "/admin/verification", icon: ShieldCheck },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-gray-900 text-white shrink-0">
      <div className="h-20 flex items-center px-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Mednoris" className="w-8 h-8 object-contain brightness-0 invert" />
          <span className="text-xl font-extrabold tracking-tight">ADMIN</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 flex flex-col">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          
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
