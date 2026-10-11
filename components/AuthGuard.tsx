"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

// Public routes that don't need authentication
const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/contact",
  "/auth",
];

const PUBLIC_PREFIXES = [
  "/for-hospitals",
  "/admin",
  "/h",
  "/MED-",
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, authenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isPublic =
      PUBLIC_ROUTES.includes(pathname) ||
      PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

    if (!authenticated) {
      // Unauthenticated user trying to access a protected route → send to auth
      if (!isPublic) {
        router.replace("/auth");
      }
      return;
    }

    // Authenticated user
    if (!user) return;

    const checkUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          const role = data.role ? data.role.toLowerCase() : "patient";
          const targetDashboard = `/${role}/dashboard`;

          // Redirect from landing or /auth to the correct dashboard
          const isViewingLanding =
            typeof window !== "undefined" &&
            window.location.search.includes("view=landing");

          if ((pathname === "/" && !isViewingLanding) || pathname === "/auth") {
            router.replace(targetDashboard);
          }
        } else {
          // No Firestore user doc yet — send to auth page for role selection
          if (pathname !== "/auth") {
            router.replace("/auth");
          }
        }
      } catch (error) {
        console.error("Error checking user in Firebase:", error);
      }
    };

    checkUser();
  }, [loading, authenticated, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8f7fb]">
        <Loader2 className="animate-spin text-brand-primary" size={36} />
      </div>
    );
  }

  return <>{children}</>;
}
