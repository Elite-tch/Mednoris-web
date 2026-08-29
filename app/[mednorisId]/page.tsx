"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { hashData, deriveKEK, unwrapKey, decryptData, base64ToArrayBuffer } from "@/lib/crypto";
import { Loader2, ShieldCheck, ShieldAlert, CalendarDays, Hospital, Fingerprint, User, Lock, Unlock, FileText, Pill, FlaskConical, MapPin } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientRecordPage() {
  const params = useParams();
  const mednorisId = (params.mednorisId as string).toUpperCase();

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dob, setDob] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [decryptedRecord, setDecryptedRecord] = useState<any>(null);
  const [decryptedTabs, setDecryptedTabs] = useState<any>(null);

  useEffect(() => {
    async function fetchRecord() {
      try {
        const searchHash = await hashData(mednorisId);
        const q = query(
          collection(db, "hospital_patients"),
          where("mednorisIdHash", "==", searchHash),
          limit(1)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setError("No patient record found for this Mednoris ID. Please verify the QR code is valid.");
          return;
        }

        const data = snap.docs[0].data();
        const hospitalSlug: string = data.hospitalSlug ?? "";

        let hospitalName = hospitalSlug;
        if (hospitalSlug) {
          const hospitalDoc = await getDoc(doc(db, "hospitals", hospitalSlug));
          if (hospitalDoc.exists()) {
            hospitalName = hospitalDoc.data().name ?? hospitalSlug;
          }
        }

        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
        setRecord({ ...data, mednorisId, hospitalSlug, hospitalName, registeredAt: createdAt });
      } catch (err: any) {
        console.error(err);
        setError("Failed to load patient record. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchRecord();
  }, [mednorisId]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    setUnlockError("");

    try {
      const hash = window.location.hash.replace("#key=", "");
      if (!hash) {
        throw new Error("Invalid QR code link. Security key missing.");
      }

      // 1. Derive KEK from DOB and QR Secret
      const qrSecretBytes = base64ToArrayBuffer(decodeURIComponent(hash));
      const qrKEK = await deriveKEK(dob, qrSecretBytes);

      // 2. Unwrap Patient DEK
      const patientDEK = await unwrapKey(record.qrWrappedDEK, record.qrWrapIV, qrKEK);

      // 3. Decrypt Patient Details
      const details = await decryptData(record.encryptedDetails.ciphertext, record.encryptedDetails.iv, patientDEK);
      
      // 4. Decrypt Clinical Tabs
      const tabs = record.tabs || {};
      const decryptedTabsData: any = {
        consultation: [],
        lab: [],
        pharmacy: []
      };

      for (const tabKey of ['consultation', 'lab', 'pharmacy']) {
        if (tabs[tabKey]) {
          for (const entry of tabs[tabKey]) {
            if (entry.encryptedEntry) {
              const data = await decryptData(entry.encryptedEntry.ciphertext, entry.encryptedEntry.iv, patientDEK);
              decryptedTabsData[tabKey].push({ ...entry, entryData: data });
            } else if (entry.encryptedFields) {
              const fields = await decryptData(entry.encryptedFields.ciphertext, entry.encryptedFields.iv, patientDEK);
              decryptedTabsData[tabKey].push({ ...entry, legacyFields: fields });
            } else if (entry.fields) {
              decryptedTabsData[tabKey].push({ ...entry, legacyFields: entry.fields });
            }
          }
        }
      }

      setDecryptedRecord(details);
      setDecryptedTabs(decryptedTabsData);
    } catch (err) {
      console.error("Unlock error", err);
      setUnlockError("Access Denied: Incorrect Date of Birth or invalid security key.");
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-sm font-medium text-gray-500">Loading medical record...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
       
        <h1 className="text-2xl font-black text-gray-900 mb-2">Record Not Found</h1>
        <p className="text-gray-500 max-w-xs mb-8 text-sm leading-relaxed">{error}</p>
        <Link href="/" className="px-6 py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-secondary transition-colors">
          Return to Mednoris
        </Link>
      </div>
    );
  }

  const renderTabEntries = (entries: any[], emptyMessage: string) => {
    if (!entries || entries.length === 0) {
      return <div className="text-sm text-gray-400 italic p-4 bg-gray-50 rounded-xl border border-gray-100">{emptyMessage}</div>;
    }
    return (
      <div className="space-y-4">
        {entries.sort((a,b) => b.entryTimestamp - a.entryTimestamp).map((entry, idx) => (
          <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3 mb-3">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">{entry.addedAt}</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-bold">{entry.addedByRole}</span>
            </div>
            
            {entry.entryData ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider shrink-0">{entry.entryData.label}</span>
                  {entry.entryData.value && <span className="text-sm font-semibold text-gray-900">{entry.entryData.value}</span>}
                </div>
                {entry.entryData.note && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 whitespace-pre-wrap">{entry.entryData.note}</p>
                )}
                {entry.entryData.attachments?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {entry.entryData.attachments.map((att: any, i: number) => (
                      <a key={i} href={att.storageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-lg text-xs font-medium text-primary transition-colors no-print">
                        <span className="truncate max-w-[150px]">{att.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {entry.legacyFields?.map((f: any, i: number) => (
                  <div key={i}>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{f.label}</p>
                    <p className="text-sm text-gray-900">{f.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; max-width: 100% !important; }
        }
      `}</style>

      <div className="min-h-screen bg-white flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 no-print">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Mednoris" className="h-18 w-auto object-contain" />
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Print / Save PDF
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center py-10 px-4 sm:px-6">
          
          <AnimatePresence mode="wait">
            {!decryptedRecord ? (
              <motion.div 
                key="locked"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg print-card"
              >
                {/* Limo/Identity Header */}
                <div className="bg-white rounded-t-3xl shadow-xl shadow-primary/20 border border-gray-100 overflow-hidden">
                  <div className="bg-primary px-8 py-8 relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "18px 18px" }}
                    />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Medical Record</p>
                        <h1 className="text-white text-2xl font-black leading-tight">Patient Identity</h1>
                        <p className="text-white/80 text-sm mt-1">Verified by Mednoris Network</p>
                      </div>
                     
                    </div>
                  </div>

                  <div className="px-8 py-6 space-y-5">
                    {/* Mednoris ID */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
                        <Fingerprint className="text-primary" size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-secondary  uppercase tracking-widest mb-0.5">Mednoris ID</p>
                        <p className="text-lg font-black text-gray-900 font-mono tracking-wider">{record.mednorisId}</p>
                      </div>
                    </div>
                    <hr className="border-gray-50" />
                    {/* Hospital */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
                        <Hospital className="text-primary" size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-0.5">Registering Hospital</p>
                        <p className="text-base font-black text-gray-900">{record.publicSnapshot?.hospitalName || record.hospitalName}</p>
                      </div>
                    </div>
                    <hr className="border-gray-50" />
                    {/* Doctor / Staff */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
                        <User className="text-primary" size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-0.5">Attending Staff</p>
                        <p className="text-base font-black text-gray-900">{record.publicSnapshot?.registeredByName || "Hospital Staff"}</p>
                        <p className="text-xs text-secondary capitalize mt-0.5">{record.publicSnapshot?.registeredByRole || ""}</p>
                      </div>
                    </div>
                    {/* Registration Date */}
                    <hr className="border-gray-50" />
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
                        <CalendarDays className="text-primary" size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-0.5">Date Registered</p>
                        <p className="text-base font-black text-gray-900">
                          {record.registeredAt ? record.registeredAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Unknown"}
                        </p>
                      </div>
                    </div>
                    {/* Address indicator */}
                    {record.publicSnapshot?.hasAddress && (
                      <>
                        <hr className="border-gray-50" />
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="text-primary" size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-0.5">Address on File</p>
                            <p className="text-sm text-gray-500 italic">Available after identity verification</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Security Challenge */}
                <div className="bg-white rounded-b-3xl shadow-xl shadow-primary border border-gray-100 p-8 border-t-4 border-t-primary no-print">
                  <div className="flex items-center gap-3 mb-4">
                    
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Unlock Clinical Records</h2>
                      <p className="text-xs text-gray-500">Patient data is End-to-End Encrypted</p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleUnlock} className="mt-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Patient's Date of Birth</label>
                    <input 
                      type="date" 
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors mb-4"
                    />
                    
                    {unlockError && (
                      <p className="text-xs text-primary bg-primary/10 p-3 rounded-xl border border-primary/20 mb-4 font-medium flex items-center gap-2">
                        <ShieldAlert size={14} /> {unlockError}
                      </p>
                    )}

                    <button 
                      type="submit" 
                      disabled={unlocking}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-secondary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {unlocking ? <Loader2 className="animate-spin" size={18} /> : <Unlock size={18} />}
                      {unlocking ? "Decrypting Records..." : "Decrypt & View Records"}
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="unlocked"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl print-card"
              >
                {/* Unlocked Header */}
                <div className="bg-white rounded-t-3xl border border-gray-100 overflow-hidden">
                  <div className=" px-8 py-8 relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "18px 18px" }}
                    />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Medical Record</p>
                        <h1 className="text-secondary text-3xl font-black leading-tight">{decryptedRecord.firstName} {decryptedRecord.lastName}</h1>
                        <p className="text-primary text-sm mt-1"> Gender {decryptedRecord.gender.toUpperCase()} • Born {decryptedRecord.dob}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                        <Unlock className="text-white" size={22} />
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-6 grid grid-cols-2 md:grid-cols-3 gap-6 bg-primary/5 border-b border-primary/10">
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Phone</p>
                      <p className="text-sm font-bold text-secondary">{decryptedRecord.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Hospital</p>
                      <p className="text-sm font-bold text-secondary">{record.publicSnapshot?.hospitalName || record.hospitalName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Attending Staff</p>
                      <p className="text-sm font-bold text-secondary">{record.publicSnapshot?.registeredByName || decryptedRecord?.createdBy || "—"}</p>
                    </div>
                    {decryptedRecord.address && (
                      <div className="col-span-full">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Address</p>
                        <p className="text-sm font-bold text-secondary">{decryptedRecord.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-background p-8 border-x border-gray-200">
                  <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <FileText className="text-primary" size={24} />
                    Consultation History
                  </h2>
                  {renderTabEntries(decryptedTabs.consultation, "No consultation records found.")}
                </div>

                <div className="bg-white p-8 border-x border-t border-gray-200">
                  <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <FlaskConical className="text-primary" size={24} />
                    Lab Results
                  </h2>
                  {renderTabEntries(decryptedTabs.lab, "No laboratory records found.")}
                </div>

                <div className="bg-background p-8 rounded-b-3xl border border-gray-200 shadow-lg">
                  <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <Pill className="text-primary" size={24} />
                    Pharmacy & Prescriptions
                  </h2>
                  {renderTabEntries(decryptedTabs.pharmacy, "No pharmacy records found.")}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-gray-400 mt-8 max-w-sm mx-auto no-print">
            Powered by{" "}
            <Link href="/" className="font-bold text-primary hover:underline">
              Mednoris
            </Link>{" "}
            - Secure Healthcare Identity Network
          </p>
        </main>
      </div>
    </>
  );
}
