'use client'

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { LogOut, Search, Menu, X, RotateCw } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { navItems } from "./Sidebar";

export default function AdminTopbar() {
  const { logout } = usePrivy();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pathname = usePathname();

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between gap-4">
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-md relative hidden md:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search doctors, patients..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-brand-secondary"
        />
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-gray-900 z-50 flex flex-col md:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Mednoris" className="w-8 h-8 object-contain brightness-0 invert" />
                  <span className="text-xl font-extrabold tracking-tight text-white">ADMIN</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white p-2">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
                {navItems.map(({ label, href, icon: Icon }) => {
                  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive ? "bg-brand-secondary text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-gray-900 leading-tight">System Admin</p>
          <p className="text-xs text-gray-400">Platform Control</p>
        </div>
        
        <button
          onClick={handleRefresh}
          title="Refresh page data"
          className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors cursor-pointer"
        >
          <RotateCw size={16} className={refreshing ? "animate-spin" : ""} />
        </button>
        <button
          onClick={logout}
          title="Logout"
          className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
