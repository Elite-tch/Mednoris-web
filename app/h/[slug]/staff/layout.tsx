"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Loader2, ShieldAlert } from "lucide-react";
import StaffSidebar from "@/components/hospital/StaffSidebar";
import StaffTopbar from "@/components/hospital/StaffTopbar";
import StaffLoginModal from "@/components/hospital/StaffLoginModal";
import { useCrypto } from "@/contexts/CryptoContext";

/** Shown when a hospital admin tries to access the staff-only dashboard. */
function AdminBlockedModal({ slug }: { slug: string }) {
  const handleSwitch = async () => {
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative p-8 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm mb-6">
          You are logged in as a <span className="font-bold text-gray-700">Hospital Admin</span>.
          Admins cannot access the Staff Dashboard. Please log in with your staff credentials.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSwitch}
            className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors text-sm"
          >
            Logout &amp; Use Staff Login
          </button>
          <a
            href={`/h/${slug}/admin`}
            className="w-full py-3 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 text-sm block"
          >
            Go to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default function StaffDashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params.slug as string;
  const { dek } = useCrypto();

  const [loading, setLoading] = useState(true);
  const [hospital, setHospital] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [adminBlocked, setAdminBlocked] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubAuth: (() => void) | null = null;

    async function init() {
      // Fetch hospital to ensure it exists
      const hospSnap = await getDoc(doc(db, "hospitals", slug));
      if (cancelled) return;

      if (!hospSnap.exists()) {
        setLoading(false);
        return;
      }
      setHospital(hospSnap.data());

      // Set up a single auth listener — stored outside so cleanup can reach it
      unsubAuth = onAuthStateChanged(auth, async (user) => {
        if (cancelled) return;

        console.log("Auth state changed. User:", user?.uid);

        if (!user) {
          console.log("No user, showing login modal.");
          setAdminBlocked(false);
          setShowLogin(true);
          setLoading(false);
          return;
        }

        // Verify user is a registered staff member of this hospital
        const staffSnap = await getDoc(doc(db, "hospital_staff", user.uid));
        if (cancelled) return;

        const staffData = staffSnap.exists() ? staffSnap.data() : null;
        console.log("Staff data:", staffData, "Current slug:", slug);

        // Must exist and belong to this hospital
        if (!staffData || staffData.hospitalSlug !== slug) {
          console.log("Blocking: Invalid staff data or wrong hospital slug.");
          const { signOut } = await import("firebase/auth");
          await signOut(auth);
          // onAuthStateChanged will fire again with null — state set there
          return;
        }

        // Admins and Owners are NOT allowed here — they must use the admin dashboard
        if (staffData.role === "admin" || staffData.role === "owner") {
          console.log("Blocking: User is an admin.");
          if (cancelled) return;
          setAdminBlocked(true);
          setShowLogin(false);
          setLoading(false);
          return;
        }

        // Valid non-admin staff member ✓
        if (cancelled) return;
        setAdminBlocked(false);
        setShowLogin(false);
        setUserAuthenticated(true);
        setLoading(false);
      });
    }

    init();

    // This cleanup runs before the next effect or on unmount.
    // In React StrictMode (dev) this ensures we never have two listeners active.
    return () => {
      cancelled = true;
      if (unsubAuth) unsubAuth();
    };
  }, [slug]);

  // If user is authenticated but DEK was lost (e.g. page refresh), show login again
  const needsRelogin = userAuthenticated && !dek && !showLogin;

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8f7fb]">
        <Loader2 className="animate-spin text-brand-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7fb]">
      {/* Staff login overlay — re-shown automatically if DEK is lost on refresh */}
      {(showLogin || needsRelogin) && (
        <StaffLoginModal slug={slug} hospitalName={hospital?.name} />
      )}

      {/* Block admins — hide dashboard content entirely */}
      {adminBlocked && <AdminBlockedModal slug={slug} />}

      {/* Dashboard shell renders only when the user is authenticated and not blocked */}
      {!adminBlocked && !showLogin && (
        <>
          <StaffSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <StaffTopbar />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </>
      )}
    </div>
  );
}
