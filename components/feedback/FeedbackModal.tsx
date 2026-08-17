"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  MessageSquare,
  ImagePlus,
  Trash2,
  CheckCircle2,
  Mail,
  Phone,
} from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  FEEDBACK_EMAIL,
  FEEDBACK_TYPES,
  FEEDBACK_WHATSAPP,
  type FeedbackType,
} from "@/lib/feedbackConfig";
import {
  FEEDBACK_IMAGE_LIMITS,
  validateFeedbackImages,
} from "@/lib/feedbackValidation";
import { useFeedbackSubmitter } from "./useFeedbackSubmitter";

interface ImagePreview {
  id: string;
  file: File;
  previewUrl: string;
}

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const submitter = useFeedbackSubmitter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState("");
  const [type, setType] = useState<FeedbackType | "">("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, submitting, onClose]);

  useEffect(() => {
    if (open) return;
    setMessage("");
    setType("");
    setError("");
    setSubmitting(false);
    setSubmitted(false);
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return [];
    });
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";

    const validationError = validateFeedbackImages(images.length, selected);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    const newPreviews = selected.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter your feedback before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const uploadedImages: { url: string; name: string }[] = [];
      for (const img of images) {
        const url = await uploadToCloudinary(img.file);
        uploadedImages.push({ url, name: img.file.name });
      }

      const pageUrl =
        typeof window !== "undefined" ? window.location.pathname : "";

      const payload = {
        message: message.trim(),
        ...(type ? { type } : {}),
        ...(uploadedImages.length > 0 ? { images: uploadedImages } : {}),
        submittedBy: submitter.uid ?? submitter.name,
        submittedByName: submitter.name,
        submittedByRole: submitter.role,
        submittedByAuth: submitter.authType,
        hospitalSlug: submitter.hospitalSlug,
        pageUrl,
        status: "open",
        submittedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "feedback"), payload);

      fetch("/api/notify-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: docRef.id,
          message: payload.message,
          type: type || undefined,
          images: uploadedImages,
          submittedBy: submitter.name,
          submittedByRole: submitter.role,
          hospitalSlug: submitter.hospitalSlug,
          pageUrl,
        }),
      }).catch((err) => console.error("Feedback notify failed:", err));

      setSubmitted(true);
    } catch (err) {
      console.error("Feedback submission error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={submitting ? undefined : onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg z-10 my-auto overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                <MessageSquare size={20} className="text-brand-primary" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Send Feedback</h2>
                <p className="text-xs text-gray-500">Help us improve Mednoris</p>
              </div>
            </div>
            {!submitting && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close feedback modal"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {submitted ? (
            <div className="px-6 py-10 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">
                Thank you!
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Your feedback has been received.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-colors text-sm"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Your feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="What's on your mind? Bug, suggestion, or general feedback"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Feedback type <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FeedbackType | "")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-colors"
                >
                  <option value="">Select a type</option>
                  {FEEDBACK_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Screenshots{" "}
                  <span className="text-gray-400 font-normal">
                    (optional, max {FEEDBACK_IMAGE_LIMITS.maxCount})
                  </span>
                </label>

                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group"
                      >
                        <img
                          src={img.previewUrl}
                          alt={img.file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Remove ${img.file.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length < FEEDBACK_IMAGE_LIMITS.maxCount && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 text-sm text-gray-600 hover:border-brand-secondary hover:text-brand-primary transition-colors w-full justify-center"
                  >
                    <ImagePlus size={18} />
                    Add images (JPG, PNG — max 10MB each)
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FEEDBACK_IMAGE_LIMITS.accept}
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="rounded-2xl bg-[#f8f7fb] border border-gray-100 p-4 space-y-2">
                <p className="text-xs font-bold text-gray-700">
                  Prefer to reach us directly?
                </p>
                <p className="text-xs text-gray-500">
                  Message us on WhatsApp or email.
                </p>
                <div className="flex flex-col gap-1.5 pt-1">
                  {FEEDBACK_WHATSAPP && (
                    <a
                      href={`https://wa.me/${FEEDBACK_WHATSAPP.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors"
                    >
                      <Phone size={14} />
                      WhatsApp: {FEEDBACK_WHATSAPP}
                    </a>
                  )}
                  <a
                    href={`mailto:${FEEDBACK_EMAIL}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors break-all"
                  >
                    <Mail size={14} />
                    {FEEDBACK_EMAIL}
                  </a>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
