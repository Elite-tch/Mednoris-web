"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { href: "/",            label: "Home" },
  { href: "/about",       label: "About Us" },
  { href: "#doctors",    label: "Find a Doctor" },
  { href: "/contact",    label: "Contact" },
  { href: "/for-hospitals", label: "For Hospitals" },
];

export default function Navbar() {
  const { logout, authenticated, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("patient");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      if (authenticated && user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().role) {
            setRole(docSnap.data().role.toLowerCase());
          }
        } catch (e) {
          console.error("Error fetching user role:", e);
        }
      }
    };
    fetchRole();
  }, [authenticated, user]);

  const getDisplayName = () => {
    if (user?.email) {
      const email = user.email;
      return email.length > 15 ? email.slice(0, 12) + "..." : email;
    }
    return "User";
  };

  return (
    <nav className="w-full text-brand-primary bg-[#f8f7fb] px-8 flex justify-between items-center shadow-lg sticky top-0 z-50">
      <div className="h-20 sm:h-20">
        <Link href='/'>
          <Image src='/logo.png' alt='logo' width={80} height={42} />
        </Link>
      </div>
      
      <div className="hidden md:flex gap-8 text-sm uppercase tracking-wide">
        {navLinks.map(({ href, label }) => {
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

      {/* Desktop Actions */}
      <div className="hidden md:flex gap-4">
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
              onClick={() => router.push('/auth')} 
              className="px-5 py-2 text-sm font-semibold rounded-full border border-brand-primary hover:bg-white hover:text-brand-primary transition-colors cursor-pointer"
            >
              Login
            </button>
            <button 
              onClick={() => router.push('/auth')} 
              className="px-5 py-2 text-sm font-semibold rounded-full bg-brand-primary text-[#f8f7fb] hover:opacity-90 transition-opacity cursor-pointer"
            >
              Sign Up
            </button>
          </>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-brand-primary p-2">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[280px] bg-white z-50 flex flex-col md:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <span className="text-xl font-extrabold tracking-tight text-brand-primary">MENU</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-gray-800 p-2">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
                {navLinks.map(({ label, href }) => {
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
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive ? "bg-brand-primary/10 text-brand-primary" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-6 border-t border-gray-100 flex flex-col gap-3">
                {authenticated ? (
                  <>
                    <span className="text-sm font-medium text-center text-gray-500 mb-2">
                      {getDisplayName()}
                    </span>
                    <Link 
                      href={`/${role}/dashboard`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-3 text-center text-sm font-semibold rounded-xl bg-brand-primary text-white hover:opacity-90 transition-opacity"
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }} 
                      className="w-full py-3 text-center text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => { router.push('/auth'); setIsMobileMenuOpen(false); }} 
                      className="w-full py-3 text-center text-sm font-semibold rounded-xl border border-brand-primary text-brand-primary hover:bg-brand-primary/5 transition-colors"
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => { router.push('/auth'); setIsMobileMenuOpen(false); }} 
                      className="w-full py-3 text-center text-sm font-semibold rounded-xl bg-brand-primary text-white hover:opacity-90 transition-opacity"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
