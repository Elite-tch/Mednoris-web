"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Plus, CheckSquare, AlertTriangle, RotateCcw, Lock, Printer } from "lucide-react";
import Link from "next/link";
import { useCrypto } from "@/contexts/CryptoContext";
import { encryptData, decryptData, unwrapKey } from "@/lib/crypto";
import { writeAuditLog } from "@/lib/audit";
import { trackDailyEvent, DailyStatEvent } from "@/lib/stats";
import { getVisibleSections, getAccessLevel, RecordSection } from "@/lib/rbac";
import { getSuggestions } from "@/lib/labelSuggestions";

function QRCodeCanvas({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function renderQR() {
      if (!canvasRef.current || !value) return;
      try {
        const QRCode = (await import("qrcode")).default;
        await QRCode.toCanvas(canvasRef.current, value, {
          width: 180,
          margin: 2,
          color: { dark: "#1e1b4b", light: "#ffffff" },
        });
      } catch (err) {
        console.error("QR render error", err);
      }
    }
    renderQR();
  }, [value]);

  return <canvas ref={canvasRef} className="rounded-2xl shadow-sm mx-auto" />;
}

// A single saved form entry (immutable)
function FormEntry({ entry, onCorrection, dek, accessLevel }: { entry: any; onCorrection: (entry: any) => void; dek: Uint8Array | null; accessLevel: string }) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [decryptionError, setDecryptionError] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(true);
  
  useEffect(() => {
    async function decryptEntry() {
      if (!dek) return;
      try {
        if (entry.encryptedFields) {
          const decryptedFields = await decryptData(entry.encryptedFields.ciphertext, entry.encryptedFields.iv, dek);
          setFields(decryptedFields);
        } else if (entry.fields) {
          setFields(entry.fields); // Legacy unencrypted fallback
        }

        if (entry.encryptedCorrections) {
          const decryptedCorrections = await decryptData(entry.encryptedCorrections.ciphertext, entry.encryptedCorrections.iv, dek);
          setCorrections(decryptedCorrections);
        } else if (entry.corrections) {
          setCorrections(entry.corrections); // Legacy unencrypted fallback
        } else {
          setCorrections([]);
        }
      } catch (err) {
        console.error("Decryption error", err);
        setDecryptionError(true);
      } finally {
        setIsDecrypting(false);
      }
    }
    decryptEntry();
  }, [entry, dek]);

  const handleSaveCorrection = async () => {
    setSaving(true);
    await onCorrection({ ...entry, correctionText });
    setShowCorrection(false);
    setCorrectionText("");
    setSaving(false);
  };

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden mb-3">
      <div className="flex items-start justify-between gap-4 p-4 bg-white">
        <div className="flex-1">
          {decryptionError ? (
            <div className="text-red-500 text-sm flex items-center gap-2"><Lock size={14}/> Failed to load secure data. Please log in again.</div>
          ) : isDecrypting ? (
            <div className="text-gray-400 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading Secure Data...</div>
          ) : fields.length === 0 ? (
            <div className="text-gray-400 text-sm italic">No data entries.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {fields.map((f: any, i: number) => (
                <div key={i} className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium truncate">{f.label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{f.value || <span className="italic text-gray-300">—</span>}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-400">{entry.addedBy} · {entry.addedAt}</p>
          {accessLevel === "full" && (
            <button
              onClick={() => setShowCorrection(v => !v)}
              className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-700"
            >
              <RotateCcw size={12} /> Add Correction
            </button>
          )}
        </div>
      </div>

      {/* Corrections */}
      {corrections.map((c: any, i: number) => (
        <div key={i} className="px-4 py-3 bg-orange-50 border-t border-orange-100 flex items-start gap-2">
          <AlertTriangle size={14} className="text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-orange-700">Correction by {c.correctedBy}</p>
            <p className="text-sm text-orange-800">{c.note}</p>
            <p className="text-xs text-orange-400 mt-0.5">{c.correctedAt}</p>
          </div>
        </div>
      ))}

      {showCorrection && accessLevel === "full" && (
        <div className="px-4 py-3 bg-orange-50 border-t border-orange-100 space-y-2">
          <textarea
            value={correctionText}
            onChange={e => setCorrectionText(e.target.value)}
            placeholder="Describe the correction (e.g., BP should read 120/80, not 210/80)"
            rows={2}
            className="w-full px-3 py-2 border border-orange-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-300 resize-none bg-white"
          />
          <div className="flex gap-2">
            <button onClick={handleSaveCorrection} disabled={saving || !correctionText.trim()} className="px-4 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50">
              Save Correction
            </button>
            <button onClick={() => setShowCorrection(false)} className="px-4 py-1.5 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Summary Tab to display aggregated information across allowed departments
function SummaryContent({ patient, visibleTabs, staffProfile, dek }: { patient: any; visibleTabs: string[]; staffProfile: any; dek: Uint8Array | null }) {
  const tabsToAggregate = visibleTabs.filter(t => t !== "basic_info" && t !== "summary" && t !== "audit_log");
  
  const allEntries: { tabKey: string; entry: any }[] = [];
  tabsToAggregate.forEach(tabKey => {
    const entries = patient.tabs?.[tabKey] || [];
    entries.forEach((entry: any) => {
      allEntries.push({ tabKey, entry });
    });
  });

  // Sort entries from newest to oldest based on entryTimestamp
  allEntries.sort((a, b) => (b.entry.entryTimestamp || 0) - (a.entry.entryTimestamp || 0));

  if (allEntries.length === 0) {
    return (
      <div className="text-center py-10 text-gray-300">
        <CheckSquare size={36} className="mx-auto mb-2" />
        <p className="text-sm">No clinical records found in accessible departments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allEntries.map(({ tabKey, entry }, idx) => (
        <div key={idx}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-1 rounded">
              {tabKey.replace(/_/g, " ")}
            </span>
          </div>
          <FormEntry
            entry={entry}
            dek={dek}
            accessLevel="view" // Summary is purely view-only aggregation
            onCorrection={async () => {}} // Corrections should be made in the actual tab
          />
        </div>
      ))}
    </div>
  );
}

// Dynamic tab form
function TabContent({ patient, tabKey, staffProfile, dek, accessLevel, onUpdate }: { patient: any; tabKey: string; staffProfile: any; dek: Uint8Array | null; accessLevel: string; onUpdate: () => void }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formFields, setFormFields] = useState([{ label: "", value: "" }]);
  const [saving, setSaving] = useState(false);
  const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);
  const [labelSearch, setLabelSearch] = useState("");
  const entries: any[] = patient.tabs?.[tabKey] || [];
  const suggestions = getSuggestions(tabKey);

  const now = () => new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const addField = () => setFormFields(f => [...f, { label: "", value: "" }]);
  const updateField = (i: number, key: "label" | "value", val: string) => {
    setFormFields(f => f.map((field, idx) => idx === i ? { ...field, [key]: val } : field));
    if (key === "label") setLabelSearch(val);
  };

  const applyLabelSuggestion = (i: number, suggestion: string) => {
    updateField(i, "label", suggestion);
    setActiveFieldIndex(null);
    setLabelSearch("");
  };

  const filteredSuggestions = (search: string) =>
    suggestions.filter(s => s.toLowerCase().includes(search.toLowerCase()) && search.trim() !== "").slice(0, 6);

  const saveEntry = async () => {
    if (!formFields.some(f => f.label.trim()) || !dek) return;
    setSaving(true);
    
    // Encrypt the raw data fields
    const rawFields = formFields.filter(f => f.label.trim());
    const encryptedFields = await encryptData(rawFields, dek);
    const encryptedCorrections = await encryptData([], dek); // Empty array initially

    const newEntry = {
      encryptedFields,
      encryptedCorrections,
      addedBy: staffProfile.name,
      addedByRole: staffProfile.role,
      addedAt: now(),
      entryTimestamp: Date.now() // to uniquely identify this entry
    };
    
    const patRef = doc(db, "hospital_patients", patient.id);
    await updateDoc(patRef, {
      [`tabs.${tabKey}`]: arrayUnion(newEntry),
    });

    const tabStatMap: Record<string, DailyStatEvent> = {
      consultation: "consultations",
      lab: "labEntries",
      pharmacy: "pharmacyEntries",
    };
    const statEvent = tabStatMap[tabKey];

    await Promise.all([
      writeAuditLog(patient.hospitalSlug, {
        actorName: staffProfile.name,
        actorRole: staffProfile.role,
        action: `Added clinical entry to ${tabKey} tab for patient ${patient.mednorisId}`,
      }),
      ...(statEvent ? [trackDailyEvent(patient.hospitalSlug, statEvent)] : []),
    ]);

    setFormFields([{ label: "", value: "" }]);
    setShowAddForm(false);
    setSaving(false);
    onUpdate();
  };

  const handleCorrection = async (entry: any, correctionText: string) => {
    if (!dek) return;
    const entryIndex = entries.findIndex(e => e.entryTimestamp === entry.entryTimestamp && e.addedBy === entry.addedBy);
    if (entryIndex === -1) return;
    
    // Decrypt existing corrections, append new one, and re-encrypt
    let currentCorrections: any[] = [];
    if (entry.encryptedCorrections) {
       currentCorrections = await decryptData(entry.encryptedCorrections.ciphertext, entry.encryptedCorrections.iv, dek);
    }
    
    const newCorrection = {
      note: correctionText,
      correctedBy: staffProfile.name,
      correctedAt: now(),
    };
    
    currentCorrections.push(newCorrection);
    const newEncryptedCorrections = await encryptData(currentCorrections, dek);

    const updatedEntries = entries.map((e, i) => {
      if (i !== entryIndex) return e;
      return {
        ...e,
        encryptedCorrections: newEncryptedCorrections
      };
    });
    
    await updateDoc(doc(db, "hospital_patients", patient.id), {
      [`tabs.${tabKey}`]: updatedEntries,
    });
    
    await writeAuditLog(patient.hospitalSlug, {
      actorName: staffProfile.name,
      actorRole: staffProfile.role,
      action: `Appended correction to ${tabKey} tab for patient ${patient.mednorisId}`,
    });
    onUpdate();
  };

  if (accessLevel === "none") {
    return (
      <div className="text-center py-10 text-red-500">
        <Lock size={36} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm font-bold">Access Denied</p>
        <p className="text-xs">Your role ({staffProfile?.role}) does not have permission to view this section.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-1 mb-4">
        {entries.length === 0 && !showAddForm && (
          <div className="text-center py-10 text-gray-300">
            <CheckSquare size={36} className="mx-auto mb-2" />
            <p className="text-sm">No entries yet.</p>
          </div>
        )}
        {entries.map((entry, i) => (
          <FormEntry
            key={i}
            entry={entry}
            onCorrection={(e) => handleCorrection(e, e.correctionText)}
            dek={dek}
            accessLevel={accessLevel}
          />
        ))}
      </div>

      <AnimatePresence>
        {showAddForm && accessLevel === "full" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Lock size={14} className="text-green-600"/> Secure Data Entry</p>
            {formFields.map((field, i) => (
              <div key={i} className="flex gap-3 mb-2 relative">
                <div className="flex-1 relative">
                  <input
                    value={field.label}
                    onChange={e => { updateField(i, "label", e.target.value); setActiveFieldIndex(i); }}
                    onFocus={() => setActiveFieldIndex(i)}
                    onBlur={() => setTimeout(() => setActiveFieldIndex(null), 150)}
                    placeholder="Label (e.g. Blood Pressure)"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white"
                  />
                  {activeFieldIndex === i && filteredSuggestions(field.label).length > 0 && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      {filteredSuggestions(field.label).map(s => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={() => applyLabelSuggestion(i, s)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-brand-primary/5 hover:text-brand-primary font-medium transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Show top suggestion pills when field is empty */}
                  {activeFieldIndex === i && field.label === "" && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-1.5">Common Labels</p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.slice(0, 8).map(s => (
                          <button
                            key={s}
                            type="button"
                            onMouseDown={() => applyLabelSuggestion(i, s)}
                            className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-brand-primary hover:text-white transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <input value={field.value} onChange={e => updateField(i, "value", e.target.value)} placeholder="Value (e.g. 120/80)" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white" />
              </div>
            ))}
            <button onClick={addField} className="text-xs font-bold text-brand-primary hover:underline mt-1 mb-4 flex items-center gap-1">
              <Plus size={13} /> Add another field
            </button>
            <div className="flex gap-2">
              <button onClick={saveEntry} disabled={saving || !dek} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-brand-secondary disabled:opacity-70">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                Save Secure Entry
              </button>
              <button onClick={() => { setShowAddForm(false); setFormFields([{ label: "", value: "" }]); }} className="px-4 py-2 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showAddForm && accessLevel === "full" && (
        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors">
          <Plus size={14} /> Add Secure Entry
        </button>
      )}
    </div>
  );
}

export default function StaffPatientProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const patientId = params.id as string;
  
  const [patient, setPatient] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<string>("basic_info");
  const [newlyAddedTabs, setNewlyAddedTabs] = useState<string[]>([]);
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  // Decrypted patient detail fields (populated from encryptedDetails or legacy plaintext)
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [patientHeadshot, setPatientHeadshot] = useState<string | null>(null);

  const { dek } = useCrypto();

  const baseVisibleTabs = staffProfile ? getVisibleSections(staffProfile.role, staffProfile.fullAccess) : [];
  const existingPatientTabs = Object.keys(patient?.tabs || {}).filter(k => k !== "receptionist" && k !== "audit_log" && k !== "basic_info" && k !== "summary");
  
  const computedVisibleTabs = staffProfile?.fullAccess 
    ? Array.from(new Set([...baseVisibleTabs, ...existingPatientTabs, ...newlyAddedTabs]))
    : baseVisibleTabs;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const s = await getDoc(doc(db, "hospital_staff", user.uid));
      if (s.exists()) {
        const data = s.data();
        setStaffProfile(data);
        const tabs = getVisibleSections(data.role, data.fullAccess);
        if (tabs.length > 0) setActiveTab(tabs[0]);
      }
    });
    return () => unsubscribe();
  }, [slug]);

  const fetchPatient = async () => {
    setLoading(true);
    const snap = await getDoc(doc(db, "hospital_patients", patientId));
    if (snap.exists()) {
      setPatient({ id: snap.id, ...snap.data() });
    }
    setLoading(false);
  };

  useEffect(() => { fetchPatient(); }, [patientId]);

  // Decrypt patient details once both patient and dek are available
  useEffect(() => {
    async function decryptPatientDetails() {
      if (!patient || !dek) {
        // Fallback: use plaintext fields if they exist (legacy records)
        if (patient) {
          setPatientDetails({
            firstName: patient.firstName,
            lastName: patient.lastName,
            dob: patient.dob,
            gender: patient.gender,
            phone: patient.phone,
            address: patient.address,
          });
          setPatientHeadshot(patient.headshotBase64 || null);
        }
        return;
      }
      try {
        if (patient.encryptedDetails) {
          let activeDEK = dek;
          if (patient.hospitalWrappedDEK && patient.hospitalWrapIV) {
            activeDEK = await unwrapKey(patient.hospitalWrappedDEK, patient.hospitalWrapIV, dek);
          }
          const details = await decryptData(patient.encryptedDetails.ciphertext, patient.encryptedDetails.iv, activeDEK);
          setPatientDetails(details);
        } else {
          // Legacy plaintext fallback
          setPatientDetails({
            firstName: patient.firstName,
            lastName: patient.lastName,
            dob: patient.dob,
            gender: patient.gender,
            phone: patient.phone,
            address: patient.address,
          });
        }
        if (patient.encryptedHeadshot) {
          const headshot = await decryptData(patient.encryptedHeadshot.ciphertext, patient.encryptedHeadshot.iv, dek);
          setPatientHeadshot(headshot);
        } else {
          setPatientHeadshot(patient.headshotBase64 || null);
        }
      } catch (err) {
        console.error("Failed to decrypt patient details", err);
      }
    }
    decryptPatientDetails();
  }, [patient, dek]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  }

  if (!patient || computedVisibleTabs.length === 0) {
    return (
      <div className="p-8">
        <Link href={`/h/${slug}/staff/patients`} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft size={18} /> Back to Directory
        </Link>
        <p className="text-red-500 font-bold">Access Denied or Patient Not Found.</p>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-8 max-w-5xl mx-auto">
      <Link href={`/h/${slug}/staff/patients`} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={18} /> Back to Directory
      </Link>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6 flex flex-wrap items-center gap-6 relative overflow-hidden">
        {/* Subtle lock watermark to remind them it's secure */}
        <Lock size={120} className="absolute -right-10 -bottom-10 text-gray-50 opacity-50 pointer-events-none" />
        
        <div className="w-16 h-16 bg-purple-50 text-purple-600 font-black text-2xl rounded-full flex items-center justify-center shrink-0 z-10 overflow-hidden border border-purple-100">
          {patientHeadshot ? (
            <img src={patientHeadshot} alt="Headshot" className="w-full h-full object-cover" />
          ) : (
            (patientDetails?.firstName || patient.firstName)?.charAt(0) || "?"
          )}
        </div>
        <div className="flex-1 min-w-0 z-10">
          <h2 className="text-2xl font-black text-gray-900">
            {patientDetails ? `${patientDetails.firstName} ${patientDetails.lastName}` : patient.mednorisId}
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <code className="text-xs font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-lg">{patient.mednorisId}</code>
            {patientDetails && (
              <span className="text-xs text-gray-400 capitalize">{patientDetails.gender} · DOB: {patientDetails.dob}</span>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-gray-400 z-10">
          <p>Registered by <strong className="text-gray-700">{patient.createdBy}</strong></p>
          <p>{patient.createdAt?.toDate?.()?.toLocaleDateString("en-GB") || "—"}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-gray-100 overflow-x-auto hide-scrollbar">
          {computedVisibleTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab ? "border-brand-primary text-brand-primary bg-brand-primary/5" : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
            >
              {tab.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
          {staffProfile?.fullAccess && (
            <div className="px-3">
              {isAddingTab ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newTabName}
                    onChange={e => setNewTabName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && newTabName.trim()) {
                        const key = newTabName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
                        if (!computedVisibleTabs.includes(key)) {
                          setNewlyAddedTabs(prev => [...prev, key]);
                        }
                        setActiveTab(key);
                        setIsAddingTab(false);
                        setNewTabName("");
                      }
                      if (e.key === "Escape") {
                        setIsAddingTab(false);
                        setNewTabName("");
                      }
                    }}
                    placeholder="e.g. Scientific Report"
                    className="w-40 px-3 py-1.5 border border-brand-primary/30 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                  <button onClick={() => { setIsAddingTab(false); setNewTabName(""); }} className="text-gray-400 hover:text-gray-600">
                    <Plus size={16} className="rotate-45" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsAddingTab(true)} className="flex items-center gap-1 text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors whitespace-nowrap">
                  <Plus size={14} /> Add Tab
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-6">
          {!dek ? (
            <div className="text-center py-10 text-red-500">
              <Lock size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold">Secure Session Expired</p>
              <p className="text-xs">Your secure session was closed. Please log in again to view clinical records.</p>
            </div>
          ) : activeTab === "basic_info" ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Patient Details</h3>
                <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">Registration Info</span>
              </div>
              {!patientDetails ? (
                <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-sm">
                  <Loader2 size={16} className="animate-spin" /> Loading patient record...
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</p>
                    <p className="text-sm font-semibold text-gray-900">{patientDetails.firstName} {patientDetails.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mednoris ID</p>
                    <p className="text-sm font-semibold text-gray-900">{patientDetails.mednorisId || patient.mednorisId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</p>
                    <p className="text-sm font-semibold text-gray-900">{patientDetails.dob || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gender</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{patientDetails.gender || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                    <p className="text-sm font-semibold text-gray-900">{patientDetails.phone || "—"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Home Address</p>
                    <p className="text-sm font-semibold text-gray-900">{patientDetails.address || "—"}</p>
                  </div>
                </div>
              )}

              {/* QR Code and Print Button */}
              {staffProfile?.fullAccess && patientDetails && (
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col items-center">
                  <style>{`
                    @media print {
                      @page { margin: 0; }
                      body * {
                        visibility: hidden;
                      }
                      #patient-qr-card, #patient-qr-card * {
                        visibility: visible;
                      }
                      #patient-qr-card {
                        position: fixed;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        width: 100%;
                        max-width: 400px;
                        background: white !important;
                        border: none !important;
                        margin: 0;
                      }
                    }
                  `}</style>
                  
                  <div className="inline-block bg-white border border-gray-200 rounded-3xl p-6 space-y-4 mb-4" id="patient-qr-card">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Mednoris ID Card</p>
                    <div className="flex justify-center">
                      <QRCodeCanvas value={`${window.location.origin}/patient/${patientDetails.mednorisId || patient.mednorisId}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-gray-900">{patientDetails.firstName} {patientDetails.lastName}</p>
                      <code className="text-brand-primary font-bold text-sm">{patientDetails.mednorisId || patient.mednorisId}</code>
                      <p className="text-xs text-gray-400 mt-1">{patientDetails.hospitalName || patient.hospitalName || "Hospital"}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary text-sm transition-colors print:hidden"
                  >
                    <Printer size={16} /> Print ID Card
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === "summary" ? (
            <SummaryContent
              patient={patient}
              visibleTabs={computedVisibleTabs}
              staffProfile={staffProfile}
              dek={dek}
            />
          ) : (
            <TabContent
              patient={patient}
              tabKey={activeTab}
              staffProfile={staffProfile}
              dek={dek}
              accessLevel={getAccessLevel(staffProfile?.role, activeTab, staffProfile?.fullAccess)}
              onUpdate={fetchPatient}
            />
          )}
        </div>
      </div>
    </div>
  );
}
