"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DoctorNotificationsPage() {
  const { user } = usePrivy();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.id),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setNotifications(notifs);
      setLoading(false);

      // Mark all unread as read when viewing this page
      const unreadNotifs = notifs.filter((n) => !n.read);
      if (unreadNotifs.length > 0) {
        const markAsRead = async () => {
          const batch = writeBatch(db);
          unreadNotifs.forEach((n) => {
            const notifRef = doc(db, "notifications", n.id);
            batch.update(notifRef, { read: true });
          });
          try {
            await batch.commit();
          } catch (error) {
            console.error("Error marking notifications as read:", error);
          }
        };
        markAsRead();
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-brand-primary w-9 h-9" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Notifications</h1>
          <p className="text-gray-500 text-sm">Stay updated with your latest alerts and messages</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell size={28} className="text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">No notifications yet</h3>
            <p className="text-gray-500 text-sm">When you get messages or updates, they'll show up here.</p>
          </div>
        ) : (
          <div>
            {notifications.map((n, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={n.id}
              >
                <Link
                  href={n.link || "#"}
                  className={`block p-5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !n.read ? "bg-brand-secondary/5" : ""
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {!n.read ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary"></div>
                      ) : (
                        <CheckCheck size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm ${!n.read ? "font-bold text-brand-primary" : "font-medium text-gray-700"}`}>
                        {n.title}
                      </h4>
                      <p className={`text-sm mt-1 ${!n.read ? "text-gray-700" : "text-gray-500"}`}>{n.message}</p>
                      {n.createdAt && (
                        <p className="text-xs text-gray-400 mt-2 font-medium">
                          {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
