"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { LogOut, Building2, RotateCw, Menu } from "lucide-react";

export default function StaffTopbar() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [hospital, setHospital] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStaffProfile(null);
        return;
      }
      const [hospSnap, staffSnap] = await Promise.all([
        getDoc(doc(db, "hospitals", slug)),
        getDoc(doc(db, "hospital_staff", user.uid)),
      ]);
      if (hospSnap.exists()) setHospital(hospSnap.data());
      if (staffSnap.exists()) setStaffProfile(staffSnap.data());
    });
    return () => unsubscribe();
  }, [slug]);

  const handleLogout = async () => {
    await signOut(auth);
    // Reloads the page to trigger the layout's login modal automatically
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 md:px-6 h-16 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => window.dispatchEvent(new Event("toggleStaffSidebar"))}
          className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="w-9 h-9 bg-brand-primary/10 text-brand-primary rounded-lg flex items-center justify-center">
          <Building2 size={18} />
        </div>
        <div className="hidden sm:block">
          <p className="font-bold text-gray-900 leading-tight text-sm">{hospital?.name || "Hospital Workspace"}</p>
          <p className="text-xs text-gray-400">Staff Portal</p>
        </div>
      </div>

      {staffProfile && (
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900">{staffProfile?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{staffProfile?.role?.replace("_", " ")}</p>
          </div>
          <div className="w-9 h-9 bg-brand-primary/10 text-brand-primary font-bold rounded-full flex items-center justify-center text-sm">
            {staffProfile?.name?.charAt(0) || "?"}
          </div>
          <button
            onClick={handleRefresh}
            title="Refresh page data"
            className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
          >
            <RotateCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
}
