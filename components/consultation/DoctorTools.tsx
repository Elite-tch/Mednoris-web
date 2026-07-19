"use client";
import { useState } from "react";
import { Lock, FileText, Pill, ShieldCheck, Check } from "lucide-react";

export default function DoctorTools({ appointmentId }: { appointmentId: string }) {
  const [activeTab, setActiveTab] = useState<"records" | "notes" | "prescription">("records");
  const [accessRequested, setAccessRequested] = useState(false);
  const [prescriptionSent, setPrescriptionSent] = useState(false);

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-100 p-2">
        <button 
          onClick={() => setActiveTab("records")}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'records' ? 'bg-brand-primary/5 text-brand-primary' : 'text-gray-400 hover:text-gray-700'}`}
        >
          Records
        </button>
        <button 
          onClick={() => setActiveTab("notes")}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'notes' ? 'bg-brand-primary/5 text-brand-primary' : 'text-gray-400 hover:text-gray-700'}`}
        >
          Notes
        </button>
        <button 
          onClick={() => setActiveTab("prescription")}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'prescription' ? 'bg-brand-primary/5 text-brand-primary' : 'text-gray-400 hover:text-gray-700'}`}
        >
          Prescribe
        </button>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {/* RECORDS TAB */}
        {activeTab === "records" && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <Lock size={32} />
            </div>
            <div>
              <h3 className="font-bold text-brand-primary mb-1">Patient Records Locked</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Patient privacy is protected. You must request access to view their medical history.
              </p>
            </div>
            <button 
              onClick={() => setAccessRequested(true)}
              disabled={accessRequested}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer ${accessRequested ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-brand-secondary text-white hover:bg-brand-primary'}`}
            >
              {accessRequested ? <><Check size={16}/> Access Requested</> : <><ShieldCheck size={16}/> Request Access</>}
            </button>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === "notes" && (
          <div className="flex flex-col h-full">
             <div className="flex items-center gap-2 mb-4 text-brand-primary font-bold">
               <FileText size={18} className="text-brand-secondary"/>
               <h3>Private Consultation Notes</h3>
             </div>
             <textarea 
               placeholder="Write your diagnostic notes here... (Only visible to you)"
               className="flex-1 w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 resize-none text-sm focus:outline-none focus:border-brand-secondary focus:ring-0"
             />
          </div>
        )}

        {/* PRESCRIPTION TAB */}
        {activeTab === "prescription" && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4 text-brand-primary font-bold">
               <Pill size={18} className="text-brand-secondary"/>
               <h3>Issue Prescription</h3>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1">Medication Name</label>
                 <input type="text" placeholder="e.g. Amoxicillin" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-secondary" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">Dosage</label>
                   <input type="text" placeholder="e.g. 500mg" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-secondary" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">Duration</label>
                   <input type="text" placeholder="e.g. 5 Days" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-secondary" />
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1">Instructions</label>
                 <textarea rows={2} placeholder="e.g. Take twice daily after meals" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:border-brand-secondary" />
               </div>

               <button 
                onClick={() => setPrescriptionSent(true)}
                disabled={prescriptionSent}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer mt-4 ${prescriptionSent ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-brand-primary text-white hover:bg-brand-secondary'}`}
               >
                 {prescriptionSent ? "Sent for Patient Approval" : "Send Prescription"}
               </button>
               <p className="text-center text-xs text-gray-400 italic">
                 Patient must approve to save to their records.
               </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
