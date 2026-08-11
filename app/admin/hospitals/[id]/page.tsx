"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Plus, Building2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HospitalDetailsAdminPage() {
  const params = useParams();
  const router = useRouter();
  const hospitalId = params.id as string;

  const [hospital, setHospital] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Slot Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRole, setNewRole] = useState("receptionist");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [newFullAccess, setNewFullAccess] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);

  useEffect(() => {
    fetchData();
  }, [hospitalId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const hSnap = await getDoc(doc(db, "hospitals", hospitalId));
      if (hSnap.exists()) {
        setHospital({ id: hSnap.id, ...hSnap.data() });
      }

      const sSnap = await getDocs(collection(db, `hospitals/${hospitalId}/slots`));
      const s = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSlots(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = isCustomRole ? customRoleInput.trim().toLowerCase().replace(/\s+/g, "_") : newRole;
    if (!finalRole) return;
    setAddingSlot(true);
    try {
      await addDoc(collection(db, `hospitals/${hospitalId}/slots`), {
        role: finalRole,
        fullAccess: newFullAccess,
        isFilled: false,
        assignedToUid: null,
        createdAt: serverTimestamp(),
      });
      setShowAddForm(false);
      setNewRole("receptionist");
      setIsCustomRole(false);
      setCustomRoleInput("");
      setNewFullAccess(false);
      fetchData();
    } catch (err) {
      console.error("Error adding slot", err);
    } finally {
      setAddingSlot(false);
    }
  };


  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  if (!hospital) {
    return <div className="py-12 text-center text-red-500">Hospital not found.</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/hospitals" className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{hospital.name}</h1>
          <p className="text-gray-500 flex items-center gap-2">
            Workspace Slug: <span className="font-bold text-gray-700">/h/{hospital.slug}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hospital Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Building2 size={24} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-4">Hospital Details</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact Name</p>
              <p className="text-sm font-semibold text-gray-900">{hospital.contactName}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
              <p className="text-sm font-semibold text-gray-900">{hospital.contactEmail}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
              {hospital.status === "pending_setup" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full">
                  <AlertCircle size={12} /> Pending Setup
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Staff Slots Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Provisioned Staff Slots</h3>
                <p className="text-sm text-gray-500">Manage department access slots for this hospital.</p>
              </div>
              {!showAddForm && (
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-brand-secondary transition-colors"
                >
                  <Plus size={16} /> Add Slot
                </button>
              )}
            </div>

            {showAddForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleAddSlot} 
                className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6 space-y-4 overflow-hidden"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Pre-assigned Role / Department</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "receptionist", label: "Receptionist" },
                      { value: "consultation", label: "Consultation (Doctor)" },
                      { value: "lab", label: "Lab Technician" },
                      { value: "pharmacy", label: "Pharmacist" },
                    ].map((r) => (
                      <label
                        key={r.value}
                        className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-colors ${
                          !isCustomRole && newRole === r.value
                            ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                            : "border-gray-200 hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          checked={!isCustomRole && newRole === r.value}
                          onChange={() => { setIsCustomRole(false); setNewRole(r.value); }}
                          className="hidden"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          !isCustomRole && newRole === r.value ? "border-brand-primary" : "border-gray-300"
                        }`}>
                          {!isCustomRole && newRole === r.value && (
                            <div className="w-2 h-2 rounded-full bg-brand-primary" />
                          )}
                        </div>
                        <span className="text-sm font-bold">{r.label}</span>
                      </label>
                    ))}
                    {/* Others option */}
                    <label
                      className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-colors col-span-2 ${
                        isCustomRole
                          ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                          : "border-gray-200 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        checked={isCustomRole}
                        onChange={() => setIsCustomRole(true)}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isCustomRole ? "border-brand-primary" : "border-gray-300"
                      }`}>
                        {isCustomRole && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                      </div>
                      <span className="text-sm font-bold">Others</span>
                    </label>
                  </div>
                  {isCustomRole && (
                    <input
                      type="text"
                      value={customRoleInput}
                      onChange={(e) => setCustomRoleInput(e.target.value)}
                      placeholder="e.g. Physiotherapist"
                      autoFocus
                      className="mt-3 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white"
                    />
                  )}
                </div>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative flex items-center mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={newFullAccess}
                      onChange={(e) => setNewFullAccess(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-brand-primary transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-900">Grant Full Access (Clinical)</span>
                    <span className="block text-xs text-gray-500">Allows viewing of all patient record tabs, not just the assigned department.</span>
                  </div>
                </label>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={addingSlot} className="px-4 py-2 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl transition-colors disabled:opacity-50">
                    {addingSlot ? "Saving..." : "Create Slot"}
                  </button>
                </div>
              </motion.form>
            )}

            <div className="space-y-3">
              {slots.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-xl">
                  No staff slots provisioned yet.
                </div>
              ) : (
                slots.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 capitalize text-sm">{slot.role.replace(/_/g, " ")}</span>
                        {slot.fullAccess && (
                          <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase rounded-md">Full Access</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {slot.isFilled ? (
                          <span className="text-green-600 font-medium">Filled — managed by hospital owner</span>
                        ) : (
                          <span className="text-orange-500 font-medium">Unassigned Slot</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
