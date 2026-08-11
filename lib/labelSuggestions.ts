/**
 * Contextual label suggestions for each patient record tab.
 * Staff start typing a label and these suggestions appear as autocomplete pills.
 */

export const LABEL_SUGGESTIONS: Record<string, string[]> = {
  basic_info: [
    "Blood Group", "Genotype", "Allergies", "Emergency Contact", "Next of Kin",
    "Occupation", "Nationality", "State of Origin", "Religion", "Marital Status"
  ],
  summary: [
    "Chief Complaint", "Presenting Illness", "History", "Past Medical History",
    "Family History", "Social History", "Review of Systems", "Provisional Diagnosis",
    "Final Diagnosis", "Discharge Summary"
  ],
  consultation: [
    "Blood Pressure", "Temperature", "Pulse Rate", "Respiratory Rate", "SpO2",
    "Weight (kg)", "Height (cm)", "BMI", "AVPU Score", "GCS Score",
    "Doctor's Assessment", "Treatment Plan", "Medications Prescribed", "Follow-Up Date",
    "Referral", "Admission Notes"
  ],
  lab: [
    "FBC", "PCV", "WBC Count", "Platelet Count", "Haemoglobin",
    "Blood Glucose (Fasting)", "Blood Glucose (Random)", "HbA1c",
    "Urea", "Creatinine", "eGFR", "LFT - ALT", "LFT - AST", "LFT - ALP",
    "Bilirubin (Total)", "Electrolytes - Na", "Electrolytes - K",
    "Urinalysis", "Urine M/C/S", "Blood Culture", "Sputum AFB",
    "Malaria RDT", "Malaria Film", "HIV Screening", "Hepatitis B (HBsAg)",
    "Hepatitis C", "VDRL / TPHA", "ECG", "Chest X-Ray", "Abdomen USS",
    "Pelvic USS", "CT Scan", "MRI", "Sample Collected By", "Lab Technician",
    "Date Collected", "Date Resulted"
  ],
  pharmacy: [
    "Drug Name", "Dose", "Frequency", "Route", "Duration",
    "Quantity Dispensed", "Dispensed By", "Instructions to Patient",
    "Drug Interaction Note", "Substitution Reason"
  ],
  audit_log: [],
  // Generic fallback for any custom tabs
  _default: [
    "Date", "Time", "Note", "Observation", "Finding", "Recommendation",
    "Status", "Done By", "Verified By"
  ]
};

/**
 * Get suggestions for a given tab key. Falls back to _default if not found.
 */
export function getSuggestions(tabKey: string): string[] {
  return LABEL_SUGGESTIONS[tabKey] || LABEL_SUGGESTIONS["_default"];
}
