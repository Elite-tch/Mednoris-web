"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Building2, Loader2, Lock, ArrowLeft, CheckCircle2, Key, AlertTriangle, Copy, Download, Check } from "lucide-react";
import Link from "next/link";
import { generateDEK, deriveKEK, generateRandomBytes, wrapKey, arrayBufferToBase64 } from "@/lib/crypto";

export default function OnboardingModal({ hospital, slug, onSuccess }: { hospital: any; slug: string; onSuccess?: () => void }) {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1); // 1: Password, 2: Recovery Code
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Recovery code states
  const [recoveryCode, setRecoveryCode] = useState("");
  const [savedConfirmation, setSavedConfirmation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("Mednoris Workspace Recovery Code", 20, 30);
      
      doc.setFontSize(14);
      doc.text("Hospital: " + hospital.name, 20, 50);
      doc.text("Admin: " + hospital.contactEmail, 20, 60);

      doc.setFontSize(12);
      doc.text("Store this document in a highly secure place.", 20, 80);
      doc.text("Without this code, you will permanently lose access to patient records", 20, 88);
      doc.text("if you forget your password.", 20, 96);

      doc.setFontSize(24);
      doc.setTextColor(200, 50, 0);
      doc.text(recoveryCode, 20, 130);
      
      doc.save(`mednoris-recovery-${hospital.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Pre-flight check: generate a strong recovery code
      const codeBytes = generateRandomBytes(16);
      const codeString = Array.from(codeBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      // Format as XXXX-XXXX-XXXX-XXXX
      const formattedCode = codeString.match(/.{1,4}/g)?.join('-') || codeString;
      setRecoveryCode(formattedCode);

      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to initiate setup.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalSetup = async () => {
    if (!savedConfirmation) {
      setError("You must confirm that you have saved the recovery code.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Generate Master DEK for the hospital
      const dek = await generateDEK();

      // 2. Wrap DEK with Owner's Password KEK
      const salt = generateRandomBytes(16);
      const kek = await deriveKEK(password, salt);
      const { wrappedBase64: wrappedDEK, ivBase64: wrapIV } = await wrapKey(dek, kek);

      // 3. Wrap DEK with Recovery Code KEK
      const recoverySalt = generateRandomBytes(16);
      const recoveryKek = await deriveKEK(recoveryCode, recoverySalt);
      const { wrappedBase64: recoveryWrappedDEK, ivBase64: recoveryWrapIV } = await wrapKey(dek, recoveryKek);

      // 4. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, hospital.contactEmail, password);
      const user = userCredential.user;

      // 5. Update Auth Profile
      await updateProfile(user, {
        displayName: hospital.contactName,
      });

      // 6. Create Staff Record in Firestore (with keys)
      await setDoc(doc(db, "hospital_staff", user.uid), {
        hospitalSlug: slug,
        hospitalName: hospital.name,
        role: "owner",
        name: hospital.contactName,
        email: hospital.contactEmail,
        salt: arrayBufferToBase64(salt),
        wrappedDEK,
        wrapIV,
        recoverySalt: arrayBufferToBase64(recoverySalt),
        recoveryWrappedDEK,
        recoveryWrapIV,
        createdAt: serverTimestamp(),
      });

      // 7. Update Hospital Status
      await updateDoc(doc(db, "hospitals", slug), {
        status: "active",
        activatedAt: serverTimestamp(),
      });

      setSuccess(true);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      console.error("Setup Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Try logging in.");
      } else {
        setError(err.message || "Failed to complete setup.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative w-full max-w-xl z-10">
       

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl shadow-brand-primary/10 border border-gray-100 overflow-y-auto max-h-[85vh]"
        >
          <div className="p-8">
            {success ? (
              <div className="text-center space-y-4 py-8">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Setup Complete!</h2>
                <p className="text-gray-500">Entering your dashboard...</p>
                <Loader2 className="animate-spin mx-auto text-brand-primary mt-4" size={24} />
              </div>
            ) : step === 1 ? (
              <>
                <div className="text-center mb-8">
                  
                  <h1 className="text-2xl font-black text-gray-900 mb-2">Activate Workspace</h1>
                  <p className="text-gray-500">
                    Welcome, {hospital.contactName}. Set up your admin account for <strong>{hospital.name}</strong>.
                  </p>
                </div>

                <form onSubmit={handleInitialSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Admin Email</label>
                    <input
                      type="email"
                      disabled
                      value={hospital.contactEmail}
                      className="w-full py-3 px-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm font-medium"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">This email is locked as the primary owner.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Create Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                      {error}
                    </div>
                  )}

                 <div className="flex justify-between items-center flex-wrap gap-4">
                   <button
                    type="submit"
                    disabled={submitting}
                    className="w-fit flex items-center px-10 justify-center gap-2 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-70 mt-4"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                    {submitting ? "Preparing..." : "Continue"}
                  </button>

                  <div className="mt-3 flex items-center border border-primary rounded-xl justify-center">
          <Link href="/for-hospitals" className="inline-flex items-center py-3.5 px-10 gap-2 text-gray-900 hover:text-gray-900 transition-colors font-medium">
            <ArrowLeft size={18} />
            Cancel
          </Link>
        </div>
                 </div>
                </form> 
              </>
            ) : (
              // STEP 2: Recovery Code
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Key size={32} />
                  </div>
                  <h1 className="text-2xl font-black text-gray-900 mb-2">Save Your Recovery Code</h1>
                  <p className="text-gray-600 text-sm">
                    Mednoris uses advanced zero-knowledge encryption. We cannot reset your password for you. If you lose your password, this code is the <strong>only way</strong> to recover your hospital's patient data.
                  </p>
                </div>

                <div className="bg-primary  rounded-2xl p-6 text-center mb-6 relative">
                  <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">Master Recovery Code</p>
                  <code className="text-md font-black text-white tracking-widest break-all">
                    {recoveryCode}
                  </code>
                  <div className="flex justify-center gap-3 mt-4">
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors"
                      type="button"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button 
                      onClick={handleDownloadPDF}
                      disabled={downloading}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-brand-primary rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors disabled:opacity-70"
                      type="button"
                    >
                      {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      {downloading ? "Saving..." : "Save PDF"}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">
                    If you lose both your password and this recovery code, your patient records will be permanently unrecoverable. Store this code in a secure place (like a password manager or physical safe) immediately.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer mb-6">
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    checked={savedConfirmation}
                    onChange={(e) => setSavedConfirmation(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    I have saved this recovery code in a secure location and understand that Mednoris cannot recover my data without it.
                  </span>
                </label>

                {error && (
                  <div className="p-3 mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <div className="flex justify-between gap-3 flex-wrap">
                  <button
                    onClick={() => setStep(1)}
                    disabled={submitting}
                    className="px-10  py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-70"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalSetup}
                    disabled={submitting || !savedConfirmation}
                    className=" flex px-10 items-center justify-center gap-2 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-70"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                    {submitting ? "Encrypting Workspace..." : "Complete Setup"}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
