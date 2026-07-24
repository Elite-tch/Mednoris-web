"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, ArrowLeft, MessageSquare, ShieldAlert, Clock, AlertTriangle } from "lucide-react";

import VideoRoom from "@/components/consultation/VideoRoom";
import ConsultationChat from "@/components/consultation/ConsultationChat";
import DoctorTools from "@/components/consultation/DoctorTools";
import PatientTools from "@/components/consultation/PatientTools";
import { useCallTimer } from "@/hooks/useCallTimer";

export default function ConsultationRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = usePrivy();
  
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [activeRightPanelTab, setActiveRightPanelTab] = useState<"chat" | "tools">("tools");
  const [toast, setToast] = useState<string | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!user || !id) return;
      try {
        const snap = await getDoc(doc(db, "appointments", id as string));
        if (snap.exists()) {
          const data = snap.data();
          
          // Fallback: fetch patient name from patients collection if missing or saved as generic "Patient"
          if ((!data.patientName || data.patientName === "Patient") && data.patientId) {
            try {
              const pSnap = await getDoc(doc(db, "patients", data.patientId));
              if (pSnap.exists()) {
                data.patientName = pSnap.data().fullName || "Patient";
              }
            } catch (_) {}
          }
          
          setAppointment(data);
          
          if (data.doctorId === user.id) {
            setIsDoctor(true);
          } else if (data.patientId === user.id) {
            setIsDoctor(false);
          } else {
            setAppointment(null);
          }
        }
      } catch (e) {
        console.error("Failed to load appointment", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointment();
  }, [user, id]);

  const handleExpire = useCallback(() => {
    setToast("Your consultation time has ended. The call has been closed.");
    setTimeout(() => router.back(), 3500);
  }, [router]);

  const { timeRemaining, showWarning } = useCallTimer(appointment, handleExpire);

  if (!user || loading) {
    return (
      <div className="flex-1 bg-gray-50 rounded-3xl flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        <p className="mt-4 text-brand-primary font-bold">Joining Consultation Room...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex-1 bg-gray-50 rounded-3xl flex flex-col items-center justify-center text-center px-4 min-h-[500px]">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-bold text-brand-primary mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          You do not have permission to access this consultation room, or the appointment does not exist.
        </p>
        <button 
          onClick={() => router.back()}
          className="px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col overflow-hidden bg-transparent relative">

      {/* Expire Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-fade-in">
          <AlertTriangle size={20} />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      {/* 5-min Warning Banner */}
      {showWarning && !warningDismissed && (
        <div className="shrink-0 mb-3 flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-2xl shadow-sm animate-fade-in">
          <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shrink-0">
            <Clock size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-sm">Less than 5 minutes remaining!</p>
            <p className="text-xs text-amber-700 mt-0.5">Your consultation session will end soon. Time left: <span className="font-bold font-mono">{timeRemaining}</span></p>
          </div>
          <button
            onClick={() => setWarningDismissed(true)}
            className="text-amber-600 hover:text-amber-800 text-xs font-bold cursor-pointer px-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
             onClick={() => router.back()}
             className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-500 hover:bg-gray-50 hover:text-brand-primary transition-colors cursor-pointer shadow-sm"
           >
             <ArrowLeft size={18} />
           </button>
           <div>
             <h1 className="font-extrabold text-brand-primary text-xl">Consultation Room</h1>
             <p className="text-xs font-semibold text-gray-400">
               {isDoctor ? `Patient: ${appointment.patientName}` : `Dr. ${appointment.doctorName}`}
             </p>
           </div>
        </div>
        {/* LIVE badge + countdown */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {timeRemaining && (
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 font-mono text-xs font-bold shadow-sm transition-colors ${showWarning ? 'bg-amber-100 border border-amber-300 text-amber-700' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
              <Clock size={12} />
              {timeRemaining}
            </div>
          )}
          <div className="px-4 py-1.5 bg-red-50 border border-red-100 rounded-full flex items-center gap-2 shadow-sm">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             <span className="text-xs font-bold text-red-600 font-mono tracking-widest">LIVE</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden gap-4">
        
        {/* Left Panel: Video Room */}
        <section className="flex-1 min-w-0 h-full flex flex-col">
          <VideoRoom appointmentId={id as string} isDoctor={isDoctor} />
        </section>

        {/* Right Panel: Tools & Chat */}
        <section className="w-96 shrink-0 h-full flex flex-col gap-4">
          
          {/* Panel Toggle */}
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm shrink-0">
             <button 
               onClick={() => setActiveRightPanelTab("tools")}
               className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeRightPanelTab === 'tools' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:text-brand-primary hover:bg-gray-50'}`}
             >
               {isDoctor ? "Medical Tools" : "Action Center"}
             </button>
             <button 
               onClick={() => setActiveRightPanelTab("chat")}
               className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeRightPanelTab === 'chat' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:text-brand-primary hover:bg-gray-50'}`}
             >
               <MessageSquare size={16}/> Chat
             </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 min-h-0 relative">
            <div className={`absolute inset-0 transition-opacity duration-200 ${activeRightPanelTab === 'tools' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
               {isDoctor ? (
                 <DoctorTools appointmentId={id as string} />
               ) : (
                 <PatientTools appointmentId={id as string} />
               )}
            </div>

            <div className={`absolute inset-0 transition-opacity duration-200 ${activeRightPanelTab === 'chat' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
               <ConsultationChat appointmentId={id as string} userId={user.id} />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
