"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
  FileText, Calendar, ShieldCheck, CalendarClock, CheckCircle2,
  ChevronRight, Bot, Sparkles, Upload, Clock, BadgeCheck, Video, User
} from "lucide-react";
import Link from "next/link";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function DashboardPage() {
  const { user } = usePrivy();
  const [patient, setPatient] = useState<Record<string, string> | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [hour] = useState(new Date().getHours());

  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  useEffect(() => {
    const fetchPatient = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "patients", user.id));
      if (snap.exists()) setPatient(snap.data() as Record<string, string>);
    };
    fetchPatient();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "appointments"),
      where("patientId", "==", user.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAppointments(appts);
    });
    return () => unsubscribe();
  }, [user]);

  const firstName = patient?.fullName?.split(" ")[0] || "there";

  const totalAppointmentsCount = appointments.length;
  const activeAppointments = appointments.filter(a => a.status === "Scheduled");
  
  const schedule = activeAppointments
    .sort((a, b) => {
      const dateA = a.appointmentDate || "";
      const dateB = b.appointmentDate || "";
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.startTime || "").localeCompare(b.startTime || "");
    })
    .slice(0, 3); // Show top 3 upcoming

  const stats = [
    { label: "Total Records", value: "0", icon: FileText, color: "bg-brand-secondary/10 text-brand-secondary" },
    { label: "Total Appointments", value: totalAppointmentsCount.toString(), icon: Calendar, color: "bg-green-100 text-green-600" },
    { label: "Active Permissions", value: "0", icon: ShieldCheck, color: "bg-orange-100 text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div {...fadeUp()}>
        <p className="text-gray-500 text-sm">{greeting},</p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-brand-primary">
          {firstName} 👋
        </h1>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (spans 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Consultations */}
          <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-brand-primary text-lg">Upcoming Consultations</h2>
              <Link href="/patient/dashboard/appointments" className="text-xs font-bold text-brand-secondary hover:underline flex items-center gap-1">
                View All <ChevronRight size={14} />
              </Link>
            </div>
            
            <div className="space-y-4">
              {schedule.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500 font-medium">No upcoming appointments.</p>
                </div>
              ) : (
                schedule.map((s) => {
                  const isVideo = true;
                  const timeStr = s.slot || `${s.startTime || ""} - ${s.endTime || ""}`;
                  const [startTime] = timeStr.split(" - ");
                  
                  return (
                    <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-brand-secondary/30 transition-colors">
                      <div className="flex sm:flex-col items-center justify-center sm:w-20 shrink-0 sm:border-r border-gray-100 sm:pr-4">
                        <span className="text-xs text-gray-400 font-bold">{s.appointmentDate ? new Date(s.appointmentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : (s.day || 'Today')}</span>
                        <span className="text-sm font-extrabold text-brand-primary mt-0.5">{startTime?.split(" ")[0] || startTime}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-brand-primary text-sm truncate">Dr. {s.doctorName || "Doctor"}</p>
                        <p className="text-xs text-gray-400">{s.doctorSpecialty || "General Practice"}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                          <Video size={12} className="text-blue-500" />
                          Video Consult
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 sm:mt-0 flex-wrap justify-end">
                        <AppointmentAction appointment={s} />
                        <Link href={`/patient/dashboard/appointments`} className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors text-center">
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* My Medical Records */}
          <motion.div {...fadeUp(0.15)} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-brand-primary text-lg">My Medical Records</h2>
              <Link href="/patient/dashboard/vault" className="text-xs font-bold text-brand-secondary hover:underline flex items-center gap-1">
                View All <ChevronRight size={14} />
              </Link>
            </div>
            
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 mb-4">
              <p className="text-sm text-gray-500 font-medium">No medical records uploaded yet.</p>
            </div>
            
            <Link href="/patient/dashboard/upload" className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-brand-secondary/30 rounded-xl text-sm font-bold text-brand-secondary hover:bg-brand-secondary/5 transition-colors">
              <Upload size={16} /> Upload New Record
            </Link>
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Access Requests */}
          <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-brand-primary text-base">Access Requests</h2>
              <span className="w-6 h-6 bg-gray-100 text-gray-500 text-xs font-bold rounded-full flex items-center justify-center">0</span>
            </div>
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-500">No pending access requests.</p>
            </div>
          </motion.div>

          {/* Medical Passport - Coming Soon */}
          <motion.div {...fadeUp(0.15)}>
            <div className="bg-brand-primary/90 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden opacity-80">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full border-2 border-white/10"></div>
              <div className="absolute -right-2 -bottom-10 w-20 h-20 rounded-full border-2 border-white/10"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={18} className="text-white/70" />
                  <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Medical Passport</p>
                </div>
                <span className="w-auto px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full flex items-center justify-center">Coming Soon</span>
              </div>
              
              <div className="text-center py-6 rounded-xl border border-dashed border-white/20 bg-white/5">
                <p className="text-sm text-white/70 font-medium">Your unified medical identity is being built.</p>
              </div>
            </div>
          </motion.div>

          {/* AI Assistant */}
          <motion.div {...fadeUp(0.2)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
                <Bot size={20} />
              </div>
              <div>
                <p className="font-bold text-brand-primary text-sm">AI Assistant</p>
                <p className="text-xs text-gray-400">Ask anything about your health records...</p>
              </div>
            </div>
            <Link href="/patient/dashboard/ai-assistant" className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-secondary/10 text-brand-secondary text-xs font-bold rounded-xl hover:bg-brand-secondary hover:text-white transition-all">
              <Sparkles size={14} /> Open AI Assistant
            </Link>
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
      <Link href={`/patient/dashboard/consultation/${appointment.id}`} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-secondary transition-colors shadow-lg animate-pulse cursor-pointer">
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
