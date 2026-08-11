"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Loader2, Save, Building2, ShieldCheck, CreditCard } from "lucide-react";

export default function SettingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [hospital, setHospital] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const [h, s] = await Promise.all([
        getDoc(doc(db, "hospitals", slug)),
        getDoc(doc(db, "hospital_staff", user.uid)),
      ]);
      
      if (h.exists()) {
        const data = h.data();
        setHospital(data);
        setName(data.name || "");
      }
      
      if (s.exists()) {
        setStaffProfile(s.data());
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [slug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await updateDoc(doc(db, "hospitals", slug), { name });
      setHospital((prev: any) => ({ ...prev, name }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError("Failed to update settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  }

  // Only admins or owners should see this page
  if (staffProfile?.role !== "admin" && staffProfile?.role !== "owner") {
    return (
      <div className="p-8 text-center">
        <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2">Only Owner Admins can access workspace settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Workspace Settings</h2>
        <p className="text-gray-500">Manage your hospital's profile and Mednoris Layer 2 configuration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="font-bold text-gray-900 mb-1">General Profile</h3>
          <p className="text-sm text-gray-500">Update your hospital's public name and basic details.</p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
        >
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Hospital Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-4 top-3.5 text-gray-400" />
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Workspace URL (Slug)</label>
              <input 
                type="text" 
                disabled 
                value={slug} 
                className="w-full px-4 py-3 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl text-sm font-mono cursor-not-allowed" 
              />
              <p className="text-xs text-gray-400 mt-1.5">The slug cannot be changed once the workspace is provisioned.</p>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">Settings saved successfully!</p>}

            <div className="pt-2 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={saving || name === hospital?.name} 
                className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-50 text-sm"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      <hr className="my-8 border-gray-100" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="font-bold text-gray-900 mb-1">Subscription & Billing</h3>
          <p className="text-sm text-gray-500">Manage your Mednoris Layer 2 plan.</p>
        </div>
        
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="font-bold text-brand-primary">Enterprise Plan</p>
                <p className="text-xs text-brand-primary/70">Active & Verified</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white text-brand-primary text-xs font-bold rounded-full shadow-sm">
              Layer 2
            </span>
          </div>
          
          <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors text-sm w-full justify-center border border-gray-200">
            <CreditCard size={16} />
            Manage Billing in Stripe
          </button>
        </div>
      </div>
    </div>
  );
}
