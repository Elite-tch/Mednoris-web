"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter, usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait until Privy is ready
    if (!ready) return;

    const checkUser = async () => {
      // Allow unrestricted access to the landing page and specific public routes
      if (!authenticated) {
        if (pathname !== "/" && !pathname.startsWith("/public")) {
          // If trying to access a protected route while unauthenticated, redirect home
          router.replace("/");
        }
        setIsChecking(false);
        return;
      }

      if (user) {
        try {
          // Check if the user exists in our unified 'users' collection
          const userDocRef = doc(db, "users", user.id);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            const role = data.role ? data.role.toLowerCase() : "patient";
            const targetDashboard = `/${role}/dashboard`;

            // User is onboarded. If they are on the landing page or onboarding page, redirect them to dashboard.
            if (pathname === "/" || pathname === "/onboarding") {
              router.replace(targetDashboard); 
            }
          } else {
            // User is NOT onboarded. If they aren't already on the onboarding page, redirect them there.
            if (pathname !== "/onboarding") {
              router.replace("/onboarding");
            }
          }
        } catch (error) {
          console.error("Error checking user in Firebase:", error);
        } finally {
          setIsChecking(false);
        }
      }
    };

    checkUser();
  }, [ready, authenticated, user, pathname, router]);

  if (!ready || isChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8f7fb]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
