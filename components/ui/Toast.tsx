"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const show = requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // wait for exit animation
    }, 4000);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
      } ${
        type === "success"
          ? "bg-primary text-white"
          : "bg-red-800 text-white"
      }`}
    >
      {type === "success" ? (
        <CheckCircle size={18} className="text-white shrink-0" />
      ) : (
        <XCircle size={18} className="text-white shrink-0" />
      )}
      <p className="text-sm font-semibold">{message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-1 p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
}
