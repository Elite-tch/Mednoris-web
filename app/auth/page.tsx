"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "login" | "signup";
type Role = "patient" | "doctor";

export default function AuthPage() {
  const router = useRouter();
  const { signInWithGoogle, user, loading } = useAuth();

  // Form state
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Google role picker overlay
  const [showGoogleRolePicker, setShowGoogleRolePicker] = useState(false);
  const [googlePickerRole, setGooglePickerRole] = useState<Role>("patient");
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);
  const [savingGoogleRole, setSavingGoogleRole] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (!loading && user) {
      redirectByRole(user.uid);
    }
  }, [user, loading]);

  const redirectByRole = async (uid: string) => {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const r = snap.data().role?.toLowerCase() ?? "patient";
      router.replace(`/${r}/dashboard`);
    }
  };

  const clearError = () => setError("");

  // ── Email/Password Sign Up ──────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // Write user doc
      await setDoc(doc(db, "users", uid), {
        role,
        email: cred.user.email,
        createdAt: serverTimestamp(),
      });

      // Write role-specific doc
      await setDoc(doc(db, role === "patient" ? "patients" : "doctors", uid), {
        fullName: name.trim(),
        email: cred.user.email,
        role,
        createdAt: serverTimestamp(),
        ...(role === "doctor" ? { status: "Pending Verification" } : {}),
      });

      router.replace(`/${role}/dashboard`);
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Email/Password Login ────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await redirectByRole(cred.user.uid);
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Google Sign In ──────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError("");
    setGoogleSubmitting(true);
    try {
      const { user: googleUser } = await signInWithGoogle();
      const snap = await getDoc(doc(db, "users", googleUser.uid));
      const userExists = snap.exists();

      if (mode === "login" && !userExists) {
        setError("No account found for this Google email. Please sign up instead.");
        auth.signOut();
        return;
      }

      if (!userExists) {
        setPendingGoogleUser(googleUser);
        setShowGoogleRolePicker(true);
        return;
      }

      // Existing user → detect role from DB
      await redirectByRole(googleUser.uid);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(friendlyError(err.code));
      }
    } finally {
      setGoogleSubmitting(false);
    }
  };

  // ── Save Google role and redirect ───────────────────────────────────────
  const handleGoogleRoleConfirm = async () => {
    if (!pendingGoogleUser) return;
    setSavingGoogleRole(true);
    try {
      const uid = pendingGoogleUser.uid;
      await setDoc(doc(db, "users", uid), {
        role: googlePickerRole,
        email: pendingGoogleUser.email,
        createdAt: serverTimestamp(),
      });
      await setDoc(
        doc(db, googlePickerRole === "patient" ? "patients" : "doctors", uid),
        {
          fullName: pendingGoogleUser.displayName || "",
          email: pendingGoogleUser.email,
          role: googlePickerRole,
          createdAt: serverTimestamp(),
          ...(googlePickerRole === "doctor" ? { status: "Pending Verification" } : {}),
        }
      );
      router.replace(`/${googlePickerRole}/dashboard`);
    } catch {
      setError("Failed to save your role. Please try again.");
    } finally {
      setSavingGoogleRole(false);
    }
  };

  // ── Forgot password ─────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotSent(true);
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setForgotLoading(false);
    }
  };

  const friendlyError = (code: string) => {
    switch (code) {
      case "auth/email-already-in-use": return "An account with this email already exists.";
      case "auth/invalid-email": return "Please enter a valid email address.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential": return "Invalid email or password.";
      case "auth/too-many-requests": return "Too many attempts. Please try again later.";
      case "auth/weak-password": return "Password must be at least 6 characters.";
      default: return "Something went wrong. Please try again.";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8f7fb]">
        <Loader2 className="animate-spin text-brand-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ── Left Panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-brand-primary flex-col">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-[#3d2a62] to-[#1e1040] z-0" />

        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 z-0" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-brand-secondary/20 z-0 translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-64 h-64 rounded-full bg-white/5 z-0" />

        <div className="relative z-10 flex flex-col h-full px-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Mednoris" className="w-30 h-30 object-contain brightness-0 invert" />
          </Link>

          {/* Hero content */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-black text-white leading-tight mb-6"
            >
              Your Health Records,<br />
              Always in Your Control.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-white/70 text-lg leading-relaxed mb-10"
            >
              A privacy-first platform for patients and verified doctors.
              Store records securely, book consultations, and share only what you choose.
            </motion.p>
          </div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6"
          >
            <p className="text-white/90 text-sm leading-relaxed italic mb-4">
              "Finally a platform that puts patients first. My records are always with me no matter which hospital I visit."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-secondary/60 flex items-center justify-center text-white font-bold text-sm">A</div>
              <div>
                <p className="text-white text-sm font-bold">Adaeze O.</p>
                <p className="text-white/50 text-xs">Patient, Lagos</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────── */}
      <div className="flex-1 bg-[#f8f7fb] relative overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center p-6 sm:p-10">
          {/* Mobile logo */}
          <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
            <img src="/logo.png" alt="Mednoris" className="w-8 h-8 object-contain" />
            <span className="text-lg font-black text-brand-primary">MEDNORIS</span>
          </Link>

          <div className="w-full max-w-md pt-8 lg:pt-0">
          <AnimatePresence mode="wait">
            {showForgot ? (
              /* ── Forgot password form ── */
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={() => { setShowForgot(false); setForgotSent(false); setError(""); }}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-primary mb-8 transition-colors"
                >
                  <ArrowLeft size={16} /> Back to login
                </button>

                <h1 className="text-3xl font-black text-gray-900 mb-2">Reset Password</h1>
                <p className="text-gray-500 text-sm mb-8">Enter your email and we'll send you a reset link.</p>

                {forgotSent ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                    <p className="text-green-700 font-bold mb-1">Email sent!</p>
                    <p className="text-green-600 text-sm">Check your inbox for the password reset link.</p>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <InputField
                      label="Email Address"
                      type="email"
                      value={forgotEmail}
                      onChange={setForgotEmail}
                      placeholder="name@example.com"
                      icon={<Mail size={16} />}
                      required
                    />
                    {error && <ErrorBubble msg={error} />}
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2"
                    >
                      {forgotLoading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : "Send Reset Link"}
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              /* ── Main Auth Form ── */
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-3xl font-black text-gray-900 mb-1">
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h1>
                <p className="text-gray-500 text-sm mb-8">
                  {mode === "login"
                    ? "Enter your credentials to access your dashboard."
                    : "Join Mednoris, it's free and takes less than a minute."}
                </p>

                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={submitting || googleSubmitting}
                  className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-gray-200 rounded-xl bg-white hover:border-brand-primary/40 hover:shadow-sm transition-all font-semibold text-gray-700 text-sm mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {googleSubmitting ? (
                    <><Loader2 size={18} className="animate-spin text-gray-400" /> Connecting...</>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Or with email</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Form */}
                <form onSubmit={mode === "signup" ? handleSignUp : handleLogin} className="space-y-4">

                  {/* Name — signup only */}
                  {mode === "signup" && (
                    <InputField
                      label="Full Name"
                      type="text"
                      value={name}
                      onChange={setName}
                      placeholder="e.g. Emeka Okafor"
                      icon={<User size={16} />}
                      required
                    />
                  )}

                  <InputField
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="name@example.com"
                    icon={<Mail size={16} />}
                    required
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-semibold text-gray-700">Password</label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => { setShowForgot(true); setForgotEmail(email); setError(""); }}
                          className="text-xs font-semibold text-brand-secondary hover:text-brand-primary transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <PasswordField
                      value={password}
                      onChange={setPassword}
                      placeholder="••••••••"
                      show={showPassword}
                      toggle={() => setShowPassword(v => !v)}
                    />
                  </div>

                  {mode === "signup" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                      <PasswordField
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="••••••••"
                        show={showConfirm}
                        toggle={() => setShowConfirm(v => !v)}
                      />
                    </div>
                  )}

                  {/* Role selector — signup only */}
                  {mode === "signup" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">I am a...</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(["patient", "doctor"] as Role[]).map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                              role === r
                                ? "border-brand-primary bg-brand-primary/5"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            {/* Custom radio circle */}
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              role === r ? "border-brand-primary bg-brand-primary" : "border-gray-300"
                            }`}>
                              {role === r && <span className="w-2 h-2 rounded-full bg-white" />}
                            </span>
                            <span className={`text-sm font-bold capitalize ${role === r ? "text-brand-primary" : "text-gray-700"}`}>
                              {r === "patient" ? "Patient" : "Doctor"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {error && <ErrorBubble msg={error} />}

                  <button
                    type="submit"
                    disabled={submitting || googleSubmitting}
                    className="w-full py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? <><Loader2 size={18} className="animate-spin" /> Please wait...</>
                      : mode === "login" ? "Login to Dashboard" : "Create Account"}
                  </button>
                </form>

                {/* Toggle mode */}
                <p className="text-center text-sm text-gray-500 mt-6">
                  {mode === "login" ? (
                    <>Don't have an account?{" "}
                      <button onClick={() => { setMode("signup"); clearError(); }} className="font-bold text-brand-primary hover:text-brand-secondary transition-colors">
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <>Already have an account?{" "}
                      <button onClick={() => { setMode("login"); clearError(); }} className="font-bold text-brand-primary hover:text-brand-secondary transition-colors">
                        Login
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>

      {/* ── Google Role Picker Overlay ──────────────────────── */}
      <AnimatePresence>
        {showGoogleRolePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <img src="/logo.png" alt="Mednoris" className="w-8 h-8 object-contain" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">One last step!</h2>
                <p className="text-gray-500 text-sm">Tell us who you are so we can set up your account correctly.</p>
              </div>

              <div className="space-y-3 mb-6">
                {(["patient", "doctor"] as Role[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setGooglePickerRole(r)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all text-left ${
                      googlePickerRole === r
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      googlePickerRole === r ? "border-brand-primary bg-brand-primary" : "border-gray-300"
                    }`}>
                      {googlePickerRole === r && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                    <div>
                      <p className={`font-bold ${googlePickerRole === r ? "text-brand-primary" : "text-gray-700"}`}>
                        {r === "patient" ? "I'm a Patient" : "I'm a Doctor"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r === "patient" ? "Manage my health records" : "Provide consultations to patients"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {error && <ErrorBubble msg={error} />}

              <button
                onClick={handleGoogleRoleConfirm}
                disabled={savingGoogleRole}
                className="w-full py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {savingGoogleRole
                  ? <><Loader2 size={18} className="animate-spin" /> Setting up...</>
                  : "Continue to Dashboard"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function InputField({
  label, type, value, onChange, placeholder, icon, required,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ReactNode; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:border-brand-primary transition-colors"
        />
      </div>
    </div>
  );
}

function PasswordField({
  value, onChange, placeholder, show, toggle,
}: {
  value: string; onChange: (v: string) => void;
  placeholder: string; show: boolean; toggle: () => void;
}) {
  return (
    <div className="relative">
      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full pl-10 pr-11 py-3 border-2 border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:border-brand-primary transition-colors"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function ErrorBubble({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl"
    >
      {msg}
    </motion.div>
  );
}
