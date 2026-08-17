"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { FEEDBACK_ENABLED } from "@/lib/feedbackConfig";
import FeedbackModal from "./FeedbackModal";

export default function FloatingFeedbackWidget() {
  const [open, setOpen] = useState(false);

  if (!FEEDBACK_ENABLED) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-brand-primary text-white font-bold rounded-full shadow-lg hover:bg-brand-secondary hover:shadow-xl transition-all text-sm"
        aria-label="Send feedback"
      >
        <MessageSquarePlus size={18} />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
