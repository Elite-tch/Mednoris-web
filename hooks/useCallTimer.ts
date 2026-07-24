"use client";

import { useState, useEffect } from "react";

export type CallTimerState = {
  timeRemaining: string;   // e.g. "14:22"
  isExpired: boolean;
  showWarning: boolean;    // true when <= 5 mins remain
  minutesLeft: number;
};

export function useCallTimer(
  appointment: any,
  onExpire: () => void
): CallTimerState {
  const [state, setState] = useState<CallTimerState>({
    timeRemaining: "",
    isExpired: false,
    showWarning: false,
    minutesLeft: 999,
  });

  useEffect(() => {
    if (!appointment?.endTime) return;

    // Build the end Date from today's date + endTime string ("HH:MM")
    const buildEndDate = () => {
      const [eH, eM] = (appointment.endTime as string).split(":").map(Number);

      // If appointment has a specific date, use that
      if (appointment.appointmentDate) {
        const d = new Date(appointment.appointmentDate);
        d.setHours(eH, eM, 0, 0);
        return d;
      }

      // Otherwise it's a recurring slot — use today's date
      const d = new Date();
      d.setHours(eH, eM, 0, 0);
      return d;
    };

    const endDate = buildEndDate();

    let expireFired = false;
    let warningFired = false;

    const tick = () => {
      const now = Date.now();
      const diff = endDate.getTime() - now;

      if (diff <= 0) {
        setState({ timeRemaining: "00:00", isExpired: true, showWarning: false, minutesLeft: 0 });
        if (!expireFired) {
          expireFired = true;
          onExpire();
        }
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      const showWarning = minutes < 5;
      if (showWarning && !warningFired) warningFired = true;

      setState({
        timeRemaining: formatted,
        isExpired: false,
        showWarning,
        minutesLeft: minutes,
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [appointment, onExpire]);

  return state;
}
