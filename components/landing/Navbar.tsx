"use client";

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Navbar() {
  const { login, logout, authenticated, user } = usePrivy();
  const pathname = usePathname();
  const [role, setRole] = useState("patient");
  const [isFetchingRole, setIsFetchingRole] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      if (authenticated && user) {
        setIsFetchingRole(true);
        try {
          const docRef = doc(db, "users", user.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().role) {
            setRole(docSnap.data().role.toLowerCase());
          }
        } catch (e) {
          console.error("Error fetching user role:", e);
        } finally {
          setIsFetchingRole(false);
        }
      }
    };
    fetchRole();
  }, [authenticated, user]);

  const getDisplayName = () => {
    if (user?.email?.address) {
      const email = user.email.address;
      return email.length > 15 ? email.slice(0, 12) + "..." : email;
    }
    if (user?.wallet?.address) {
      return user.wallet.address.slice(0, 6) + "...";
    }
    return "User";
  };

  return (
    <nav className="w-full  text-brand-primary bg-[#f8f7fb] px-8 flex justify-between items-center shadow-lg sticky top-0 z-50">
      <div className=" h-20 sm:h-20">
        <Link href='/'>
        <Image src='/logo.png' alt='logo'  width={80} height={42}  /> </Link>   
        </div>
      
      <div className="hidden md:flex gap-8 text-sm uppercase tracking-wide">
        {([
          { href: "/",            label: "Home" },
          { href: "/about",       label: "About Us" },
          { href: "#doctors",    label: "Find a Doctor" },
          { href: "/contact",    label: "Contact" },
          { href: "/for-hospitals", label: "For Hospitals" },
        ] as { href: string; label: string }[]).map(({ href, label }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : href.startsWith("#")
              ? false
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`relative py-1 transition-colors ${
                isActive
                  ? "text-brand-accent font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-brand-accent after:rounded-full"
                  : "hover:text-brand-accent"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="flex gap-4">
        {authenticated ? (
          <>
            <span className="flex items-center text-sm font-medium mr-4">
              {getDisplayName()}
            </span>
            <Link 
              href={`/${role}/dashboard`}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-brand-primary text-white hover:opacity-90 transition-opacity cursor-pointer flex items-center"
            >
              Dashboard
            </Link>
            <button 
              onClick={logout} 
              className="px-5 py-2 text-sm font-semibold rounded-full border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={login} 
              className="px-5 py-2 text-sm font-semibold rounded-full border border-brand-primary hover:bg-white hover:text-brand-primary transition-colors cursor-pointer"
            >
              Login
            </button>
            <button 
              onClick={login} 
              className="px-5 py-2 text-sm font-semibold rounded-full bg-brand-primary text-[#f8f7fb]  hover:opacity-90 transition-opacity cursor-pointer"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
