"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Users, CalendarCheck, Wallet, ChevronRight, Clock, Video } from "lucide-react";
import Link from "next/link";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function DoctorDashboardPage() {
  const { user } = usePrivy();
  const [doctor, setDoctor] = useState<Record<string, any> | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "doctors", user.id));
      if (snap.exists()) setDoctor(snap.data());
    };
    fetch();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "appointments"),
      where("doctorId", "==", user.id)
    );

    const patientCache: Record<string, { name: string; image: string | null }> = {};

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const rawAppts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const resolvedAppts = await Promise.all(
          rawAppts.map(async (appt: any) => {
            if (!appt.patientId) return { ...appt, patientName: "Patient" };
            if (patientCache[appt.patientId]) {
              return { ...appt, patientName: patientCache[appt.patientId].name };
            }
            try {
              const pSnap = await getDoc(doc(db, "patients", appt.patientId));
              if (pSnap.exists()) {
                const pData = pSnap.data();
                patientCache[appt.patientId] = { name: pData.fullName || "Patient", image: pData.profileImage || null };
                return { ...appt, patientName: pData.fullName || "Patient" };
              }
            } catch (err) {}
            return { ...appt, patientName: "Patient" };
          })
        );
        setAppointments(resolvedAppts);
      } catch (err) {
        console.error("Dashboard appts error", err);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const firstName = doctor?.fullName?.split(" ")[0] || "Doctor";

  const uniquePatients = new Set(appointments.map(a => a.patientId).filter(Boolean)).size;
  const totalAppointmentsCount = appointments.length;

  const activeAppointments = appointments.filter(a => a.status === "Scheduled");

  const recentEarnings = appointments.filter(a => a.status === "Completed").reduce((acc, curr) => acc + (Number(curr.consultationFee) || 0), 0);

  const stats = [
    { label: "Total Patients", value: uniquePatients.toString(), icon: Users, color: "bg-blue-100 text-blue-600" },
    { label: "Total Appointments", value: totalAppointmentsCount.toString(), icon: CalendarCheck, color: "bg-brand-secondary/10 text-brand-secondary" },
    { label: "Total Earnings", value: `$${recentEarnings}`, icon: Wallet, color: "bg-green-100 text-green-600" },
  ];

  const schedule = activeAppointments
    .sort((a, b) => {
      const dateA = a.appointmentDate || "";
      const dateB = b.appointmentDate || "";
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.startTime || "").localeCompare(b.startTime || "");
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div {...fadeUp()}>
        <h1 className="text-2xl md:text-3xl font-extrabold text-brand-primary">
          Welcome back, Dr. {firstName} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here is what's happening with your practice today.</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-gray-100">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-brand-primary">{value}</p>
              <p className="text-sm text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-brand-primary text-lg">Active Appointments</h2>
              <Link href="/doctor/dashboard/appointments" className="text-xs font-bold text-brand-secondary hover:underline flex items-center gap-1">
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {schedule.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500 font-medium">No active appointments scheduled.</p>
                </div>
              ) : (
                schedule.map((s) => {
                  const timeStr = s.slot || `${s.startTime || ""} - ${s.endTime || ""}`;
                  const [startTime, endTime] = timeStr.split(" - ");
                  const isVideo = true;
                  
                  return (
                    <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-brand-secondary/30 transition-colors">
                      <div className="flex sm:flex-col items-center justify-center sm:w-20 shrink-0 sm:border-r border-gray-100 sm:pr-4">
                        <span className="text-xs text-gray-400 font-bold">{s.appointmentDate ? new Date(s.appointmentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : (s.day || 'Today')}</span>
                        <span className="text-sm font-extrabold text-brand-primary mt-0.5">{startTime?.split(" ")[0] || startTime}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-brand-primary text-sm truncate">{s.patientName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Video size={12} className="text-blue-500" />
                          Video Consult
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 sm:mt-0 flex-wrap justify-end">
                        <AppointmentAction appointment={s} />
                        <Link href={`/doctor/dashboard/appointments/${s.id}`} className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors text-center">
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Pending Appointment Requests - Coming Soon */}
          <motion.div {...fadeUp(0.15)} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 opacity-70">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-brand-primary text-base">New Requests</h2>
              <span className="w-auto px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-bold rounded-full flex items-center justify-center">Coming Soon</span>
            </div>
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-500">Appointment request system will be available in the next update.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function AppointmentAction({ appointment }: { appointment: any }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [canJoin, setCanJoin] = useState(false);

  useEffect(() => {
    const calculateTarget = () => {
      const [hours, minutes] = (appointment.startTime || "00:00").split(":").map(Number);
      
      if (appointment.appointmentDate) {
        const d = new Date(appointment.appointmentDate);
        d.setHours(hours, minutes, 0, 0);
        return d;
      }
      
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const targetDay = days.indexOf(appointment.day);
      
      const now = new Date();
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      
      let currentDay = d.getDay();
      let diff = targetDay - currentDay;
      if (diff < 0) diff += 7;
      
      d.setDate(d.getDate() + diff);
      return d;
    };

    const targetDate = calculateTarget();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      
      const endTime = new Date(targetDate.getTime());
      if (appointment.endTime) {
        const [eH, eM] = appointment.endTime.split(":").map(Number);
        endTime.setHours(eH, eM, 0, 0);
      } else {
        endTime.setHours(endTime.getHours() + 1);
      }
      const endDistance = endTime.getTime() - now;

      if (endDistance <= 0) {
        setCanJoin(false);
        setTimeLeft("Completed");
        return;
      }

      if (distance <= 0) {
        setCanJoin(true);
        setTimeLeft("");
        return;
      }

      setCanJoin(false);
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else {
        setTimeLeft(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [appointment]);

  if (canJoin) {
    return (
      <Link href={`/doctor/dashboard/consultation/${appointment.id}`} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-secondary transition-colors shadow-lg animate-pulse cursor-pointer">
        <Video size={13} /> Join Call
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-1.5 rounded-xl min-w-[70px] text-center">
        {timeLeft}
      </span>
      <button disabled className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-200 text-gray-400 cursor-not-allowed" title="Available once booked time starts">
        Join Call
      </button>
    </div>
  );
}
