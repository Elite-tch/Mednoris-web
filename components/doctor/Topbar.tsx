"use client";
import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { doc, collection, query, where, orderBy, limit, onSnapshot, updateDoc, writeBatch, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bell, Search, ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function DoctorTopbar() {
  const { user, logout } = usePrivy();
  const [doctorName, setDoctorName] = useState("Doctor");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [status, setStatus] = useState("Pending Verification");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
      {/* Search */}
      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients, records..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-brand-secondary"
        />
      </div>
      
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
                className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden origin-top-right"
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

