/**
 * Daily statistics tracker for Mednoris hospital dashboards.
 * Stores per-day counters under hospitals/{slug}/daily_stats/{YYYY-MM-DD}
 */

import { db } from "@/lib/firebase";
import { doc, setDoc, increment } from "firebase/firestore";

export type DailyStatEvent =
  | "patientsRegistered"
  | "consultations"
  | "labEntries"
  | "pharmacyEntries"
  | "staffAdded";

/**
 * Atomically increments a daily counter for a given hospital.
 * Creates the document if it doesn't exist yet.
 */
export async function trackDailyEvent(
  slug: string,
  event: DailyStatEvent,
  amount = 1
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const statRef = doc(db, "hospitals", slug, "daily_stats", today);

  await setDoc(
    statRef,
    {
      date: today,
      [event]: increment(amount),
    },
    { merge: true }
  );
}

/**
 * Returns the last N calendar dates as YYYY-MM-DD strings (oldest first).
 */
export function getLastNDates(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Formats a YYYY-MM-DD date string into a short day label (Mon, Tue, …)
 */
export function formatDayLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
  });
}
