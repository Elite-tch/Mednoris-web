"use client";
import { usePrivy } from "@privy-io/react-auth";
import { LogOut, Search } from "lucide-react";

export default function AdminTopbar() {
  const { logout } = usePrivy();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search doctors, patients..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-brand-secondary"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-gray-900 leading-tight">System Admin</p>
          <p className="text-xs text-gray-400">Platform Control</p>
        </div>
        
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
