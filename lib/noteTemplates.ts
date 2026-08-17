/**
 * Quick-insert note templates for the clinical entry "Type Note" mode.
 * Each tab has its own list of pre-written phrases that doctors can click
 * to insert into the note textarea, then edit freely.
 *
 * To add or edit templates, update this file only — no component changes needed.
 */

export interface NoteTemplate {
  label: string; // Short button label shown as a pill
  text: string;  // Full text inserted into the textarea
}

export const NOTE_TEMPLATES: Record<string, NoteTemplate[]> = {
  consultation: [
    {
      label: "Normal Vitals",
      text: "BP: 120/80mmHg, Temp: 36.6°C, Pulse: 72bpm, RR: 16/min, SpO2: 98%. General condition: stable.",
    },
    {
      label: "No Complaints",
      text: "Patient presents with no active complaints. General condition appears satisfactory.",
    },
    {
      label: "Follow-Up Required",
      text: "Patient advised to return for follow-up in [X] days. Review [medication/condition] at next visit.",
    },
    {
      label: "Referred",
      text: "Patient referred to [Specialist/Department] for further evaluation and management of [condition].",
    },
    {
      label: "Admitted",
      text: "Patient admitted to [ward/unit] for observation and management. Admission diagnosis: [diagnosis].",
    },
    {
      label: "Discharged",
      text: "Patient discharged in stable condition. Discharge medications: [list]. Advised to return if symptoms worsen.",
    },
    {
      label: "Prescription Issued",
      text: "Prescription issued for [drug name, dose, frequency, duration]. Patient counselled on medication use.",
    },
    {
      label: "Complaint",
      text: "Patient complaints of [symptom] for [duration]. Associated symptoms: [symptoms]. No known drug allergies.",
    },
  ],

  lab: [
    {
      label: "Sample Collected",
      text: "Sample collected at [time]. Type: [blood/urine/swab]. Sent to lab for [test name]. Results pending.",
    },
    {
      label: "Results Normal",
      text: "Laboratory results reviewed. All values within normal limits. No immediate clinical concern noted.",
    },
    {
      label: "Abnormal — Action",
      text: "Abnormal result noted for [test]. Value: [result] (Reference: [range]). Action taken: [action].",
    },
    {
      label: "Pending Results",
      text: "Awaiting laboratory results for [test]. Expected turnaround: [time]. Patient informed.",
    },
  ],

  pharmacy: [
    {
      label: "Dispensed",
      text: "Medication dispensed: [drug name] [dose], [frequency], for [duration]. Quantity: [qty]. Patient counselled.",
    },
    {
      label: "Out of Stock",
      text: "[Drug name] currently out of stock. Patient advised to obtain from [alternative source]. Substitution: [drug].",
    },
    {
      label: "Patient Counselled",
      text: "Patient counselled on proper medication use, storage, and potential side effects of [drug name].",
    },
    {
      label: "Substitution",
      text: "Prescribed [original drug] substituted with [substitute drug] due to [reason]. Prescriber informed.",
    },
  ],

  // Fallback for all custom/unknown tabs
  _default: [
    {
      label: "Observation",
      text: "Observation recorded at [time]: [details].",
    },
    {
      label: "Note",
      text: "Clinical note: [details]. Done by: [name].",
    },
    {
      label: "Action Taken",
      text: "Action taken: [details]. Follow-up: [plan].",
    },
  ],
};

/**
 * Get note templates for a given tab key. Falls back to _default if not found.
 */
export function getNoteTemplates(tabKey: string): NoteTemplate[] {
  return NOTE_TEMPLATES[tabKey] || NOTE_TEMPLATES["_default"];
}
