"use client";
import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { doc, collection, query, where, orderBy, limit, onSnapshot, updateDoc, writeBatch, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bell, Search, ChevronDown, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { navItems } from "./Sidebar";

export default function DoctorTopbar() {
  const { user, logout } = usePrivy();
  const [doctorName, setDoctorName] = useState("Doctor");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [status, setStatus] = useState("Pending Verification");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;

    // Real-time profile listener — updates instantly when profile or verification status changes
    const profileUnsub = onSnapshot(
      doc(db, "doctors", user.id),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setDoctorName(data.fullName || "Doctor");
          setProfileImage(data.profileImage ? data.profileImage : null);
          if (data.status) setStatus(data.status);
        }
      },
      (err) => console.error("Doctor profile listener error:", err)
    );

    // Unread notifications listener
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.id),
      where("read", "==", false),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const notifUnsub = onSnapshot(
      q,
      (snapshot) => {
        setNotifications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        console.error("Error fetching notifications:", error);
      }
    );

    return () => {
      profileUnsub();
      notifUnsub();
    };
  }, [user]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center gap-4">
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative hidden md:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients, records..."
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
              className="fixed inset-y-0 left-0 w-[280px] bg-brand-primary z-50 flex flex-col md:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Mednoris" className="w-8 h-8 object-contain brightness-0 invert" />
                  <span className="text-lg font-extrabold tracking-tight text-white">MEDNORIS</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white p-2">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
                {navItems.map(({ label, href, icon: Icon }) => {
                  const isActive = href === "/doctor/dashboard" ? pathname === href : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
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
      
      {/* Verification Status Badge */}
      <Link href="/doctor/dashboard/profile" className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors cursor-pointer ml-4 ${
        status === 'Verified' ? 'bg-secondary/10 text-secondary ' : 
        status === 'Rejected' ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : 
        'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
      }`}>
        <span className={`w-2 h-2 rounded-full ${
          status === 'Verified' ? 'bg-secondary' : 
          status === 'Rejected' ? 'bg-red-500' : 
          'bg-orange-500'
        }`}></span>
        {status}
      </Link>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-brand-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifs && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed left-2 right-2 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden sm:origin-top-right"
              >
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  {notifications.length > 0 && (
                    <span className="text-xs font-bold bg-brand-secondary/10 text-brand-secondary px-2 py-1 rounded-md">
                      {notifications.length} New
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center">
                      <Bell size={24} className="text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm font-medium">No new notifications</p>
                      <p className="text-gray-400 text-xs mt-1">You're all caught up!</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <Link 
                        key={n.id} 
                        href={n.link || "/doctor/dashboard/notifications"}
                        onClick={async () => {
                          setShowNotifs(false);
                          if (!n.read) {
                            try {
                              if (n.senderId) {
                                // Fetch all unread notifications to clear all from this sender (bypassing the 5 limit)
                                const q = query(collection(db, "notifications"), where("userId", "==", user?.id), where("read", "==", false));
                                const snap = await getDocs(q);
                                const batch = writeBatch(db);
                                let hasUpdates = false;
                                
                                snap.docs.forEach(d => {
                                  const data = d.data();
                                  if (data.senderId === n.senderId && data.type === n.type) {
                                    batch.update(doc(db, "notifications", d.id), { read: true });
                                    hasUpdates = true;
                                  }
                                });
                                
                                if (hasUpdates) await batch.commit();
                              } else {
                                await updateDoc(doc(db, "notifications", n.id), { read: true });
                              }
                            } catch (error) {
                              console.error("Failed to mark notification as read", error);
                            }
                          }
                        }}
                        className="block p-4 border-b border-gray-50 hover:bg-brand-secondary/5 transition-colors last:border-b-0 relative group"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-secondary scale-y-0 group-hover:scale-y-100 transition-transform origin-left"></div>
                        <p className="text-sm font-bold text-gray-900 mb-1">{n.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{n.message}</p>
                      </Link>
                    ))
                  )}
                </div>
                <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                  <Link 
                    href="/doctor/dashboard/notifications" 
                    onClick={() => setShowNotifs(false)}
                    className="text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors"
                  >
                    View All Notifications
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <Link href="/doctor/dashboard/profile" className="flex items-center gap-2 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-xl transition-colors">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-brand-secondary/20 flex items-center justify-center">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-brand-primary font-bold text-sm">
                {doctorName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-brand-primary leading-tight">Dr. {doctorName.split(' ')[0]}</p>
          </div>
        </Link>

        {/* Logout */}
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

