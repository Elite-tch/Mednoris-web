"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Clock } from "lucide-react";

// Generate time options in 30-minute increments
const generateTimes = () => {
  const times: { label: string; value: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hour = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? "AM" : "PM";
      const label = `${hour}:${m === 0 ? "00" : "30"} ${ampm}`;
      const value = `${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
      times.push({ label, value });
    }
  }
  return times;
};

const TIMES = generateTimes();

interface TimeSelectorProps {
  value: string; // "HH:MM" 24h format
  onChange: (val: string) => void;
}

export default function TimeSelector({ value, onChange }: TimeSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = TIMES.find((t) => t.value === value) || TIMES[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (open) {
      const el = document.getElementById(`time-opt-${value}`);
      el?.scrollIntoView({ block: "center" });
    }
  }, [open, value]);

  return (
    <div ref={ref} className="relative select-none">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors cursor-pointer min-w-[110px] ${
          open
            ? "border-brand-secondary bg-brand-secondary/5 text-brand-primary"
            : "border-gray-200 bg-white text-gray-700 hover:border-brand-secondary/50"
        }`}
      >
        <Clock size={13} className="text-brand-secondary/70 shrink-0" />
        <span className="flex-1 text-left">{selected.label}</span>
        <ChevronDown
          size={13}
          className={`text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {TIMES.map((t) => (
              <button
                key={t.value}
                id={`time-opt-${t.value}`}
                type="button"
                onClick={() => {
                  onChange(t.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  t.value === value
                    ? "bg-brand-secondary text-white"
                    : "text-gray-700 hover:bg-brand-secondary/10 hover:text-brand-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
