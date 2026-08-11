"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Plus, CheckSquare, AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";

// A single saved form entry (immutable)
function FormEntry({ entry, onCorrection }: { entry: any; onCorrection: (entry: any) => void }) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveCorrection = async () => {
    setSaving(true);
    onCorrection({ ...entry, correctionText });
    setShowCorrection(false);
    setSaving(false);
  };

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden mb-3">
      <div className="flex items-start justify-between gap-4 p-4 bg-white">
        <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {entry.fields?.map((f: any, i: number) => (
            <div key={i} className="min-w-0">
              <p className="text-xs text-gray-400 font-medium truncate">{f.label}</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{f.value || <span className="italic text-gray-300">—</span>}</p>
            </div>
          ))}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-400">{entry.addedBy} · {entry.addedAt}</p>
          {!entry.isCorrected && (
            <button
              onClick={() => setShowCorrection(v => !v)}
              className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-700"
            >
              <Plus size={12} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Corrections */}
      {entry.corrections?.map((c: any, i: number) => (
        <div key={i} className="px-4 py-3 bg-orange-50 border-t border-orange-100 flex items-start gap-2">
          <AlertTriangle size={14} className="text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-orange-700">Correction by {c.correctedBy}</p>
            <p className="text-sm text-orange-800">{c.note}</p>
            <p className="text-xs text-orange-400 mt-0.5">{c.correctedAt}</p>
          </div>
        </div>
      ))}

      {showCorrection && (
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

// Dynamic tab form
function TabContent({ patient, tabKey, staffProfile, onUpdate }: { patient: any; tabKey: string; staffProfile: any; onUpdate: () => void }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formFields, setFormFields] = useState([{ label: "", value: "" }]);
  const [saving, setSaving] = useState(false);
  const entries: any[] = patient.tabs?.[tabKey] || [];

  const now = () => new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const addField = () => setFormFields(f => [...f, { label: "", value: "" }]);
  const updateField = (i: number, key: "label" | "value", val: string) => {
    setFormFields(f => f.map((field, idx) => idx === i ? { ...field, [key]: val } : field));
  };

  const saveEntry = async () => {
    if (!formFields.some(f => f.label.trim())) return;
    setSaving(true);
    const newEntry = {
      fields: formFields.filter(f => f.label.trim()),
      addedBy: staffProfile.name,
      addedByRole: staffProfile.role,
      addedAt: now(),
      corrections: [],
    };
    const patRef = doc(db, "hospital_patients", patient.id);
    await updateDoc(patRef, {
      [`tabs.${tabKey}`]: arrayUnion(newEntry),
    });

    await addDoc(collection(db, "audit_logs"), {
      hospitalSlug: patient.hospitalSlug,
      actorName: staffProfile.name,
      actorRole: staffProfile.role,
      action: `Updated ${tabKey} tab for patient ${patient.firstName} ${patient.lastName} (${patient.mednorisId})`,
      timestamp: serverTimestamp(),
    });

    setFormFields([{ label: "", value: "" }]);
    setShowAddForm(false);
    setSaving(false);
    onUpdate();
  };

  const handleCorrection = async (entry: any, correctionText: string) => {
    const entryIndex = entries.findIndex(e => e.addedAt === entry.addedAt && e.addedBy === entry.addedBy);
    if (entryIndex === -1) return;
    const updatedEntries = entries.map((e, i) => {
      if (i !== entryIndex) return e;
      return {
        ...e,
        corrections: [...(e.corrections || []), {
          note: correctionText,
          correctedBy: staffProfile.name,
          correctedAt: now(),
        }]
      };
    });
    await updateDoc(doc(db, "hospital_patients", patient.id), {
      [`tabs.${tabKey}`]: updatedEntries,
    });
    await addDoc(collection(db, "audit_logs"), {
      hospitalSlug: patient.hospitalSlug,
      actorName: staffProfile.name,
      actorRole: staffProfile.role,
      action: `Added a correction to ${tabKey} tab for patient ${patient.firstName} ${patient.lastName}`,
      timestamp: serverTimestamp(),
    });
    onUpdate();
  };

  return (
    <div>
      <div className="space-y-1 mb-4">
        {entries.length === 0 && !showAddForm && (
          <div className="text-center py-10 text-gray-300">
            <CheckSquare size={36} className="mx-auto mb-2" />
            <p className="text-sm">No entries yet. Click "Add Form" to begin.</p>
          </div>
        )}
        {entries.map((entry, i) => (
          <FormEntry
            key={i}
            entry={entry}
            onCorrection={(e) => handleCorrection(e, e.correctionText)}
          />
        ))}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
            <p className="text-sm font-bold text-gray-700 mb-3">New Entry</p>
            {formFields.map((field, i) => (
              <div key={i} className="flex gap-3 mb-2">
                <input value={field.label} onChange={e => updateField(i, "label", e.target.value)} placeholder="Label (e.g. Blood Pressure)" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white" />
                <input value={field.value} onChange={e => updateField(i, "value", e.target.value)} placeholder="Value (e.g. 120/80)" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white" />
              </div>
            ))}
            <button onClick={addField} className="text-xs font-bold text-brand-primary hover:underline mt-1 mb-4 flex items-center gap-1">
              <Plus size={13} /> Add another field
            </button>
            <div className="flex gap-2">
              <button onClick={saveEntry} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-brand-secondary disabled:opacity-70">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckSquare size={14} />}
                Save Entry
              </button>
              <button onClick={() => { setShowAddForm(false); setFormFields([{ label: "", value: "" }]); }} className="px-4 py-2 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showAddForm && (
        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors">
          <Plus size={14} /> Add Form
        </button>
      )}
    </div>
  );
}

const DEFAULT_TABS = ["basic_info", "summary", "consultation", "lab", "pharmacy"];

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const patientId = params.id as string;
  
  const [patient, setPatient] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("basic_info");
  const [customTabs, setCustomTabs] = useState<string[]>([]);
  const [showAddTab, setShowAddTab] = useState(false);
  const [newTabName, setNewTabName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const s = await getDoc(doc(db, "hospital_staff", user.uid));
      if (s.exists()) setStaffProfile(s.data());
    });
    return () => unsubscribe();
  }, [slug]);

  const fetchPatient = async () => {
    setLoading(true);
    const snap = await getDoc(doc(db, "hospital_patients", patientId));
    if (snap.exists()) {
      const data = { id: snap.id, ...snap.data() };
      setPatient(data);
      const existingTabKeys = Object.keys((data as any).tabs || {});
      const extras = existingTabKeys.filter(k => !DEFAULT_TABS.includes(k));
      setCustomTabs(extras);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPatient(); }, [patientId]);

  const addCustomTab = async () => {
    const key = newTabName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key || DEFAULT_TABS.includes(key) || customTabs.includes(key)) return;
    await updateDoc(doc(db, "hospital_patients", patientId), { [`tabs.${key}`]: [] });
    setCustomTabs(t => [...t, key]);
    setActiveTab(key);
    setNewTabName("");
    setShowAddTab(false);
  };

  const allTabs = [...DEFAULT_TABS, ...customTabs];

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  }

  if (!patient) {
    return (
      <div className="p-8">
        <Link href={`/h/${slug}/admin/patients`} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft size={18} /> Back to Directory
        </Link>
        <p className="text-red-500">Patient not found.</p>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-8">
      <Link href={`/h/${slug}/admin/patients`} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={18} /> Back to Directory
      </Link>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6 flex flex-wrap items-center gap-6">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 font-black text-2xl rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-purple-100">
          {patient.headshotBase64 ? (
            <img src={patient.headshotBase64} alt="Headshot" className="w-full h-full object-cover" />
          ) : (
            patient.firstName?.charAt(0)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black text-gray-900">{patient.firstName} {patient.lastName}</h2>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <code className="text-xs font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-lg">{patient.mednorisId}</code>
            <span className="text-xs text-gray-400 capitalize">{patient.gender} · DOB: {patient.dob}</span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>Registered by <strong className="text-gray-700">{patient.createdBy}</strong></p>
          <p>{patient.createdAt?.toDate?.()?.toLocaleDateString("en-GB") || "—"}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-gray-100 overflow-x-auto">
          {allTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab ? "border-brand-primary text-brand-primary" : "border-transparent text-gray-500 hover:text-gray-900"}`}
            >
              {tab.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
          <div className="ml-auto px-3 flex items-center shrink-0">
            {!showAddTab ? (
              <button onClick={() => setShowAddTab(true)} className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors py-4 px-2">
                <Plus size={14} /> Add Tab
              </button>
            ) : (
              <div className="flex items-center gap-2 py-2">
                <input
                  value={newTabName}
                  onChange={e => setNewTabName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCustomTab()}
                  placeholder="Tab name..."
                  autoFocus
                  className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-primary/20 w-32"
                />
                <button onClick={addCustomTab} className="p-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary"><Plus size={14} /></button>
                <button onClick={() => setShowAddTab(false)} className="p-1.5 text-gray-400 rounded-lg hover:bg-gray-100"><ArrowLeft size={14} /></button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "basic_info" ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Patient Details</h3>
                <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">Registration Info</span>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</p>
                  <p className="text-sm font-semibold text-gray-900">{patient.firstName} {patient.lastName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mednoris ID</p>
                  <p className="text-sm font-semibold text-gray-900">{patient.mednorisId}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</p>
                  <p className="text-sm font-semibold text-gray-900">{patient.dob || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gender</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{patient.gender || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                  <p className="text-sm font-semibold text-gray-900">{patient.phone || "—"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Home Address</p>
                  <p className="text-sm font-semibold text-gray-900">{patient.address || "—"}</p>
                </div>
              </div>
            </div>
          ) : (
            <TabContent
              patient={patient}
              tabKey={activeTab}
              staffProfile={staffProfile}
              onUpdate={fetchPatient}
            />
          )}
        </div>
      </div>
    </div>
  );
}
