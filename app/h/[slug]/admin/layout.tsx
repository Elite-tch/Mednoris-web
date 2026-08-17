"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Loader2, X, ShieldAlert } from "lucide-react";
import HospitalSidebar from "@/components/hospital/HospitalSidebar";
import HospitalTopbar from "@/components/hospital/HospitalTopbar";
import OnboardingModal from "@/components/hospital/OnboardingModal";
import AdminLoginModal from "@/components/hospital/AdminLoginModal";
import FloatingFeedbackWidget from "@/components/feedback/FloatingFeedbackWidget";
import { useCrypto } from "@/contexts/CryptoContext";

function StaffBlockedModal({ slug }: { slug: string }) {
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
          You are logged in as <span className="font-bold text-gray-700">Staff</span>.
          Staff members cannot access the Admin Dashboard. Please use your Admin credentials.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSwitch}
            className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors text-sm"
          >
            Logout &amp; Switch Account
          </button>
          <a
            href={`/h/${slug}/staff`}
            className="w-full py-3 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 text-sm block"
          >
            Go to Staff Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { dek } = useCrypto();

  const [loading, setLoading] = useState(true);
  const [hospital, setHospital] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [staffBlocked, setStaffBlocked] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubAuth: (() => void) | null = null;

    async function init() {
      const hospSnap = await getDoc(doc(db, "hospitals", slug));
      if (cancelled) return;

      if (!hospSnap.exists()) { router.push("/"); return; }
      const hospData = hospSnap.data();
      setHospital(hospData);

      unsubAuth = onAuthStateChanged(auth, async (user) => {
        if (cancelled) return;

        if (!user) {
          setStaffBlocked(false);
          if (hospData.status === "pending_setup") {
            setShowOnboarding(true);
            setLoading(false);
          } else {
            setShowLogin(true);
            setLoading(false);
          }
          return;
        }

        // Verify user belongs here and is an admin
        const staffSnap = await getDoc(doc(db, "hospital_staff", user.uid));
        if (cancelled) return;

        const staffData = staffSnap.exists() ? staffSnap.data() : null;

        if (!staffData || staffData.hospitalSlug !== slug) {
          const { signOut } = await import("firebase/auth");
          await signOut(auth);
          return;
        }

        if (staffData.role !== "admin" && staffData.role !== "owner") {
          if (cancelled) return;
          setStaffBlocked(true);
          setShowLogin(false);
          setShowOnboarding(false);
          setLoading(false);
          return;
        }

        if (cancelled) return;
        setStaffBlocked(false);
        setShowLogin(false);
        setShowOnboarding(false);
        setUserAuthenticated(true);
        setLoading(false);
      });
    }

    init();

    return () => {
      cancelled = true;
      if (unsubAuth) unsubAuth();
    };
  }, [slug, router]);

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
      {(showLogin || needsRelogin) && (
        <AdminLoginModal slug={slug} hospitalName={hospital?.name} />
      )}
      
      {staffBlocked && <StaffBlockedModal slug={slug} />}

      {showOnboarding && hospital && (
        <OnboardingModal
          hospital={hospital}
          slug={slug}
          onSuccess={() => window.location.reload()}
        />
      )}

      {!staffBlocked && !showLogin && !showOnboarding && (
        <>
          <HospitalSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <HospitalTopbar />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
          {!needsRelogin && <FloatingFeedbackWidget />}
        </>
      )}
    </div>
  );
}
