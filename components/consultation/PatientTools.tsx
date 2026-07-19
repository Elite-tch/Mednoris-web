"use client";
import { ShieldAlert, Pill, Check, X } from "lucide-react";

export default function PatientTools({ appointmentId }: { appointmentId: string }) {
  // In a real app, these states would be fetched from Firestore based on the doctor's actions
  const hasAccessRequest = true; 
  const hasPendingPrescription = true;

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-white">
        <h3 className="font-bold text-brand-primary">Action Center</h3>
      </div>
      
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gray-50">
        
        {/* Access Request Card */}
        {hasAccessRequest && (
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="font-bold text-brand-primary text-sm mb-1">Access Request</h4>
                <p className="text-xs text-gray-500 mb-3">
                  The doctor is requesting access to view your Medical Passport and past records.
                </p>
                <div className="flex items-center gap-2">
                  <button className="flex-1 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-secondary transition-colors cursor-pointer">
                    Grant Access
                  </button>
                  <button className="flex-1 py-2 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                    Deny
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Prescription Card */}
        {hasPendingPrescription && (
          <div className="bg-white border-2 border-brand-secondary/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary" />
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-brand-secondary/10 text-brand-secondary rounded-full flex items-center justify-center shrink-0">
                <Pill size={20} />
              </div>
              <div className="w-full">
                <h4 className="font-bold text-brand-primary text-sm mb-1">Pending Prescription</h4>
                <p className="text-xs text-gray-500 mb-2">
                  The doctor has issued a new prescription for your vault.
                </p>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 mb-3">
                  <p className="text-sm font-bold text-brand-primary">Amoxicillin 500mg</p>
                  <p className="text-xs text-gray-500">Twice daily for 5 Days</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 py-2 flex items-center justify-center gap-1 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors cursor-pointer">
                    <Check size={14}/> Approve & Save
                  </button>
                  <button className="py-2 px-3 bg-red-50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
                    <X size={14}/>
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  *Requires blockchain signature to commit to vault
                </p>
              </div>
            </div>
          </div>
        )}

        {!hasAccessRequest && !hasPendingPrescription && (
           <div className="h-full flex flex-col items-center justify-center text-gray-400">
             <p className="text-sm">No pending actions.</p>
           </div>
        )}

      </div>
    </div>
  );
}
