"use client";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Loader2, Clock, DollarSign, Plus, Trash2, CheckCircle, CalendarDays } from "lucide-react";
import TimeSelector from "@/components/doctor/TimeSelector";
import Toast, { ToastType } from "@/components/ui/Toast";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type TimeSlot = { start: string; end: string; dates?: string[] };
type DaySchedule = { active: boolean; slots: TimeSlot[] };
type Schedule = Record<string, DaySchedule>;

const defaultSchedule = (): Schedule =>
  days.reduce(
    (acc, day) => ({
      ...acc,
      [day]: { active: false, slots: [] },
    }),
    {}
  );

export default function DoctorAvailabilityPage() {
  const { user } = usePrivy();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fee, setFee] = useState("50");
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule());
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "doctors", user.id));
      if (snap.exists()) {
        const data = snap.data();
        if (data.availability) setSchedule(data.availability);
        if (data.consultationFee) setFee(data.consultationFee);
      }
    };
    loadData();
  }, [user]);

  const toggleDay = (day: string) => {
    const current = schedule[day];
    setSchedule({
      ...schedule,
      [day]: {
        active: !current.active,
        slots:
          !current.active && current.slots.length === 0
            ? [{ start: "09:00", end: "17:00", dates: [] }]
            : current.slots,
      },
    });
  };

  const addSlot = (day: string) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        slots: [...schedule[day].slots, { start: "09:00", end: "17:00", dates: [] }],
      },
    });
  };

  const removeSlot = (day: string, index: number) => {
    const newSlots = schedule[day].slots.filter((_, i) => i !== index);
    setSchedule({ ...schedule, [day]: { ...schedule[day], slots: newSlots } });
  };

  const updateSlot = (day: string, index: number, field: "start" | "end", value: string) => {
    const newSlots = schedule[day].slots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    setSchedule({ ...schedule, [day]: { ...schedule[day], slots: newSlots } });
  };

  const addDateToSlot = (day: string, slotIndex: number, date: string) => {
    if (!date) return;
    const newSlots = schedule[day].slots.map((slot, i) => {
      if (i !== slotIndex) return slot;
      const current = slot.dates || [];
      if (current.includes(date)) return slot; // prevent dupes
      return { ...slot, dates: [...current, date].sort() };
    });
    setSchedule({ ...schedule, [day]: { ...schedule[day], slots: newSlots } });
  };

  const removeDateFromSlot = (day: string, slotIndex: number, date: string) => {
    const newSlots = schedule[day].slots.map((slot, i) => {
      if (i !== slotIndex) return slot;
      return { ...slot, dates: (slot.dates || []).filter((d) => d !== date) };
    });
    setSchedule({ ...schedule, [day]: { ...schedule[day], slots: newSlots } });
  };

  const toggleDatePanel = (key: string) =>
    setExpandedDates((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "doctors", user.id), {
        availability: schedule,
        consultationFee: fee,
      });
      setSaved(true);
      setToast({ message: "Availability saved successfully!", type: "success" });
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      setToast({ message: "Failed to save. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-brand-primary mb-1">Availability Manager</h1>
      <p className="text-gray-400 text-sm mb-8">Set your consultation fees and define when patients can book with you.</p>

      {/* Fee Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <DollarSign size={20} />
          </div>
          <div>
            <h2 className="font-bold text-brand-primary">Consultation Fee</h2>
            <p className="text-xs text-gray-400">Set your base rate per session (USD)</p>
          </div>
        </div>
        <div className="relative max-w-xs">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
          <input
            type="number"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-brand-primary focus:outline-none focus:border-brand-secondary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="font-bold text-brand-primary">Working Hours & Dates</h2>
            <p className="text-xs text-gray-400">Enable days, add time slots, and optionally pin specific dates</p>
          </div>
        </div>

        <div className="space-y-4">
          {days.map((day) => {
            const { active, slots } = schedule[day];
            return (
              <div key={day} className={`rounded-xl border transition-colors ${active ? "border-brand-secondary/30 bg-brand-secondary/5" : "border-gray-100 bg-gray-50"}`}>
                {/* Day header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleDay(day)}
                      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${active ? "bg-brand-secondary" : "bg-gray-300"}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : ""}`} />
                    </button>
                    <span className={`font-bold text-sm w-24 ${active ? "text-brand-primary" : "text-gray-400"}`}>{day}</span>
                  </div>

                  {active ? (
                    <button
                      onClick={() => addSlot(day)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-secondary border border-brand-secondary/30 rounded-lg hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus size={13} /> Add Slot
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Unavailable</span>
                  )}
                </div>

                {/* Time slots */}
                {active && slots.length > 0 && (
                  <div className="px-4 pb-4 space-y-3">
                    {slots.map((slot, i) => {
                      const dateKey = `${day}-${i}`;
                      const isDateOpen = expandedDates[dateKey];
                      const slotDates = slot.dates || [];

                      return (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl">
                          {/* Time row */}
                          <div className="flex items-center gap-3 px-3 py-2">
                            <span className="text-xs text-gray-400 font-semibold w-12 shrink-0">Slot {i + 1}</span>
                            <TimeSelector value={slot.start} onChange={(v) => updateSlot(day, i, "start", v)} />
                            <span className="text-gray-400 text-sm shrink-0">to</span>
                            <TimeSelector value={slot.end} onChange={(v) => updateSlot(day, i, "end", v)} />
                            <div className="ml-auto flex items-center gap-2">
                              <button
                                onClick={() => toggleDatePanel(dateKey)}
                                title="Add specific dates"
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  isDateOpen
                                    ? "bg-brand-secondary/10 text-brand-secondary"
                                    : "text-gray-400 hover:text-brand-secondary hover:bg-brand-secondary/5"
                                }`}
                              >
                                <CalendarDays size={13} />
                                {slotDates.length > 0 ? `${slotDates.length} date${slotDates.length > 1 ? "s" : ""}` : "Dates"}
                              </button>
                              <button
                                onClick={() => removeSlot(day, i)}
                                className="w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Date picker panel */}
                          {isDateOpen && (
                            <div className="border-t border-gray-100 px-3 py-3 bg-gray-50">
                              <p className="text-xs text-gray-500 font-semibold mb-2 flex items-center gap-1">
                                <CalendarDays size={12} /> Specific dates for this slot
                              </p>
                              <div className="flex items-center gap-2 mb-3">
                                <input
                                  type="date"
                                  id={`date-${dateKey}`}
                                  min={new Date().toISOString().split("T")[0]}
                                  className="flex-1 p-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-brand-secondary"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`date-${dateKey}`) as HTMLInputElement;
                                    if (input?.value) {
                                      addDateToSlot(day, i, input.value);
                                      input.value = "";
                                    }
                                  }}
                                  className="px-3 py-2 bg-brand-secondary text-white text-xs font-bold rounded-lg hover:bg-brand-primary transition-colors cursor-pointer"
                                >
                                  Add
                                </button>
                              </div>

                              {slotDates.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {slotDates.map((date) => (
                                    <span
                                      key={date}
                                      className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-primary/10 text-brand-primary text-xs font-bold rounded-lg"
                                    >
                                      {new Date(date).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                      <button
                                        type="button"
                                        onClick={() => removeDateFromSlot(day, i, date)}
                                        className="text-brand-primary/60 hover:text-red-500 transition-colors cursor-pointer"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">No specific dates pinned — this slot repeats weekly.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Prompt to add slot */}
                {active && slots.length === 0 && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => addSlot(day)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-brand-secondary/40 rounded-lg text-sm text-brand-secondary/70 font-semibold hover:border-brand-secondary hover:text-brand-secondary transition-colors cursor-pointer"
                    >
                      <Plus size={14} /> Add your first time slot
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center justify-center gap-2 w-full py-4 font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer ${
          saved ? "bg-primary text-white" : "bg-brand-secondary text-white hover:bg-brand-primary"
        }`}
      >
        {saving ? (
          <><Loader2 size={18} className="animate-spin" /> Saving...</>
        ) : saved ? (
          <><CheckCircle size={18} /> Saved!</>
        ) : (
          <><Save size={18} /> Save Availability</>
        )}
      </button>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
