"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, ArrowLeft, MessageSquare, ShieldAlert } from "lucide-react";

import VideoRoom from "@/components/consultation/VideoRoom";
import ConsultationChat from "@/components/consultation/ConsultationChat";
import DoctorTools from "@/components/consultation/DoctorTools";
import PatientTools from "@/components/consultation/PatientTools";

export default function ConsultationRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = usePrivy();
  
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [activeRightPanelTab, setActiveRightPanelTab] = useState<"chat" | "tools">("tools");

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!user || !id) return;
      try {
        const snap = await getDoc(doc(db, "appointments", id as string));
        if (snap.exists()) {
          const data = snap.data();
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
    <div className="h-[calc(100vh-120px)] flex flex-col overflow-hidden bg-transparent">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4 shrink-0">
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
        <div className="px-4 py-1.5 bg-red-50 border border-red-100 rounded-full flex items-center gap-2 shadow-sm">
           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
           <span className="text-xs font-bold text-red-600 font-mono tracking-widest">LIVE</span>
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
