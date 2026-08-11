"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, updateDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { X, Loader2, CheckCircle2, Copy } from "lucide-react";

type ProvisionModalProps = {
  request: any;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ProvisionHospitalModal({ request, onClose, onSuccess }: ProvisionModalProps) {
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Auto-generate a suggested slug from the hospital name on mount
  useEffect(() => {
    if (request?.isAlreadyProvisioned) {
      setSlug(request.slug);
      setGeneratedLink(`${window.location.origin}/h/${request.slug}/admin`);
    } else if (request?.hospitalName) {
      const suggested = request.hospitalName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(suggested);
    }
  }, [request]);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) {
      setError("Please provide a workspace slug.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the slug as the document ID in the 'hospitals' collection for easy routing
      // and to ensure uniqueness
      const hospRef = doc(db, "hospitals", slug.trim());
      
      await setDoc(hospRef, {
        name: request.hospitalName,
        slug: slug.trim(),
        contactName: request.contactName,
        contactEmail: request.email,
        contactPhone: request.phone,
        facilityType: request.facilityType || [],
        status: "pending_setup", // waiting for owner to activate
        demoRequestId: request.id,
        createdAt: serverTimestamp(),
      });

      // Update the demo request status
      const reqRef = doc(db, "hospital_demo_requests", request.id);
      await updateDoc(reqRef, { 
        status: "approved",
        provisionedSlug: slug.trim(),
        provisionedAt: serverTimestamp(),
      });

      // Generate the secure setup link
      // In production, this would be a secure, expiring JWT token link. 
      // For now, we point to the dashboard page with the slug (which renders the onboarding modal if pending).
      const link = `${window.location.origin}/h/${slug.trim()}/admin`;
      setGeneratedLink(link);

    } catch (err: any) {
      console.error("Provisioning error:", err);
      setError(err.message || "Failed to provision hospital. The slug might already be in use.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDoneAndSendEmail = async () => {
    if (!generatedLink) return;
    setSendingEmail(true);
    try {
      await fetch("/api/admin/send-hospital-setup-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: request.email,
          hospitalName: request.hospitalName,
          contactName: request.contactName,
          setupLink: generatedLink,
        }),
      });
    } catch (e) {
      console.error("Failed to send email:", e);
    } finally {
      setSendingEmail(false);
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-gray-900">
            {request?.isAlreadyProvisioned ? "Workspace Details" : generatedLink ? "Hospital Provisioned!" : "Provision Hospital Workspace"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {generatedLink ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  {request?.isAlreadyProvisioned ? "Setup Link" : "Workspace Created Successfully"}
                </h3>
                <p className="text-sm text-gray-500">
                  {request?.isAlreadyProvisioned 
                    ? <span>Here is the setup link for <strong>{request.hospitalName}</strong>. This hospital is currently <strong>{request.status === 'active' ? 'Active' : 'Pending Setup'}</strong>.</span>
                    : <span>The workspace for <strong>{request.hospitalName}</strong> is ready. Send this secure setup link to the owner so they can activate their account.</span>
                  }
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-3">
                <code className="text-xs text-gray-700 flex-1 truncate text-left">{generatedLink}</code>
                <button 
                  onClick={copyLink}
                  className={`p-2 bg-white border border-gray-200 rounded-lg transition-colors shrink-0 flex items-center gap-2 ${copied ? "text-primary border-primary bg-primary/10" : "text-gray-600 hover:text-brand-primary hover:border-brand-primary"}`}
                  title="Copy Link"
                >
                  {copied ? <><CheckCircle2 size={16} /><span className="text-xs font-bold">Copied!</span></> : <Copy size={16} />}
                </button>
              </div>

              {request?.isAlreadyProvisioned ? (
                <button 
                  onClick={onClose}
                  className="w-full flex items-center justify-center py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              ) : (
                <button 
                  onClick={handleDoneAndSendEmail}
                  disabled={sendingEmail}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-70"
                >
                  {sendingEmail ? <Loader2 size={18} className="animate-spin" /> : null}
                  Done & Send Link to Hospital
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleProvision} className="space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hospital:</span>
                  <span className="font-bold text-gray-900">{request.hospitalName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Owner/Contact:</span>
                  <span className="font-medium text-gray-900">{request.contactName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium text-gray-900">{request.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Workspace URL Slug</label>
                <p className="text-xs text-gray-500 mb-2">
                  This creates their dedicated login URL (e.g., mednoris.com/h/<strong>{slug || "slug"}</strong>/login).
                </p>
                <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-accent/20 focus-within:border-brand-accent transition-all">
                  <span className="px-3 text-gray-500 bg-gray-50 border-r border-gray-200 text-sm font-medium h-full flex items-center">
                    /h/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    className="w-full py-3 px-3 text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-70"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  Provision Workspace
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
