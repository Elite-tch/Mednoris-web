# Product Requirements Document
## Mednoris — Hospital Records Layer (Layer 2)

---

## 1. Overview

The Hospital Records Layer is a secure digitization and storage system that allows hospitals and clinics to digitize, manage, and securely store patient records on the Mednoris infrastructure. It operates independently from the Patient–Doctor Consultation Layer (Layer 1).

Unlike Layer 1, where patients own and control their medical data, records in the Hospital Records Layer are owned and managed by the hospital. Patients do not have login access, editing rights, or account control over this data. Patients carry their records forward using a physical QR-coded ID card issued by the hospital.

This layer exists to solve a specific, narrow problem: replacing slow, error-prone, paper-based hospital record-keeping with a fast, digital, portable, and auditable system — without requiring patients to own a smartphone, create an account, or have digital literacy.

---

## 2. Problem Statement

- Hospitals, especially in underserved and rural areas, still rely heavily on paper files for patient records.
- Paper records are slow to retrieve, easily lost or damaged, and don't travel with the patient between hospitals.
- Existing digitization tools (e.g., OCR-based competitors) convert records to text, stripping away the original document's verifiability (letterhead, stamps, formatting) that doctors use to judge authenticity.
- Patients in low-connectivity or low-smartphone-access areas cannot realistically be expected to register for and use a patient-facing app to carry their own records.
- Hospital staff need accountability (audit logs) for who accessed, edited, or viewed a patient's record, given multiple staff may work on the same patient file.

---

## 3. Goals

- Let hospitals digitize and securely store patient records without requiring patients to use an app.
- Give patients a physical, portable way (QR card) to carry their records between hospitals.
- Preserve original document formats (images/scans) rather than converting to text, to support authenticity verification.
- Provide hospitals with full internal control (create, edit, delete) over records they generate.
- Provide other hospitals with controlled, limited (read-only) access to a patient's record via QR scan, with a public/private visibility toggle.
- Maintain a complete audit trail of all actions taken on a patient's record, attributable to individual staff members.
- Keep this layer's revenue model independent of patient app adoption or consultation bookings.

## 4. Non-Goals

- This layer does not give patients account access, login credentials, or editing rights over hospital-held records.
- This layer does not involve doctor-patient consultations, chat, or booking — that remains exclusive to Layer 1.
- This layer does not require hospitals to abandon their existing EHR systems (future integration may be considered, not required for MVP).
- This layer does not currently include USSD or feature-phone access (deferred to a future phase).

---

## 5. User Roles

### 5.1 Hospital Owner / Administrator
- Registers the hospital on Mednoris (manual/assisted onboarding, not self-serve).
- Creates and manages individual staff accounts (receptionists, doctors, nurses, records officers).
- Views the centralized audit log of all staff activity across all patients.
- Sets default visibility policy for the hospital's records (public/private).
- Reviews and approves/declines requests tied to the hospital's own account settings.

### 5.2 Hospital Staff (Receptionist, Doctor, Nurse, Records Officer)
- Individual login, issued by the Hospital Owner (unique credentials per staff member, even if permission levels are shared).
- Can register new patients, upload/scan existing paper records, and generate QR cards.
- Can search for existing patients by internal Patient ID within their own hospital's dashboard.
- Can edit, update, or delete records for patients registered at their hospital.
- Cannot access another hospital's dashboard or internal patient ID system.

### 5.3 Patient
- Does not have a Mednoris account or login for this layer.
- Receives a physical card with a QR code and internal reference ID at registration.
- Carries the card between visits and hospitals.
- Has no ability to edit, delete, or directly control what's stored (ownership sits with hospital).
- May be photographed (headshot) at registration for identity verification and future Medical Passport use.

### 5.4 Platform Owner (Mednoris / Elite-Tch)
- Manually onboards hospitals (verifies legitimacy before granting dashboard access).
- Approves/declines cross-hospital private-record access requests (MVP stage; rule-based automation planned later).
- Has no default access to patient medical data itself — only to hospital account administration and audit oversight.

---

## 6. Core Flows

### 6.1 Patient Registration (New Patient, First Hospital Visit)
1. Patient visits hospital; receptionist selects "Add Patient" in the hospital dashboard.
2. Receptionist enters patient details (name, DOB, contact info, next of kin, etc.).
3. If patient has existing paper records (lab reports, prescriptions, previous diagnoses), staff photograph/scan and upload them as image files (not OCR-converted text).
4. System generates a unique internal Patient ID and a QR code.
5. Hospital prints a physical card containing the QR code (and internal ID, hospital-visible only).
6. Optionally, a headshot photo is taken for identity verification and future Medical Passport use.
7. Patient keeps the card; no app, login, or account is created for the patient.

### 6.2 Returning Patient (Same Hospital)
1. Patient presents card at reception or to a doctor.
2. Staff searches the patient's internal ID within the hospital's own dashboard.
3. Authorized staff can view, edit, add to, or delete the patient's record as needed.
4. All actions are logged (who, what, when) and visible to the Hospital Owner via the audit dashboard.

### 6.3 Patient Visits a Different Hospital or Healthcare Professional (On or Off Mednoris)
1. Patient presents their QR card.
2. Requester scans the QR code (no internal ID access, since that's scoped to the originating hospital).
3. System evaluates the requester's trust tier (see Section 8):
   - **Tier 1 (Verified Mednoris Hospital):** near-instant, read-only access granted.
   - **Tier 2 (Verified External Healthcare Professional):** temporary, read-only access granted for a defined time window, once identity/credentials are confirmed.
   - **Tier 3 (Unknown Requester):** request held for manual review before any access is granted.
   - **Tier 4 (Failed Verification):** access denied.
4. All requesters, regardless of tier, receive read-only access only — no edit or delete rights outside the originating hospital.
5. If the receiving hospital or professional wants to continue managing the patient going forward, they may export the relevant record data and import it into their own hospital's patient file (creating their own internally-owned copy going forward).

### 6.4 Lost QR Card Recovery
1. Patient returns to their originating hospital without their card.
2. Staff searches by full name plus secondary verification (DOB, phone number, headshot match).
3. Once verified, staff generates a new QR card linked to the same internal patient record.

---

## 7. Access Control & Permissions

| Action | Hospital Owner | Own Hospital Staff | Tier 1 (Verified Mednoris Hospital) | Tier 2 (Verified External Professional) | Tier 3/4 (Unknown/Failed) | Patient |
|---|---|---|---|---|---|---|
| View patient record | Yes | Yes | Yes (read-only) | Yes, temporary (read-only) | No, until verified / Never | No direct access |
| Edit/add to record | Yes | Yes | No | No | No | No |
| Delete record | Yes | Yes | No | No | No | No |
| Generate/reissue QR card | Yes | Yes | No | No | No | No |
| View audit logs | Yes (all staff) | No (own actions only, optional) | No | No | No | No |

**Note:** All staff accounts are individually credentialed, even where permission levels are identical, to preserve accountability in the audit log. All access requests, regardless of tier, are logged with requester identity, claimed affiliation, tier assigned, and outcome.

---

## 8. Access Model: Trust-Tiered Verification (revised)

The original design used a simple Public/Private flag per record, scoped only to hospitals already on Mednoris. This has been revised to solve a more important problem: enabling any legitimate healthcare professional — including those at hospitals that have never used Mednoris — to request access when necessary, without compromising security.

Rather than asking "is this hospital on Mednoris?", the model now asks "how much trust can we place in this specific request?" Every access request, regardless of source, is evaluated and access is granted according to a trust tier:

| Trust Tier | Requester Type | Access Granted |
|---|---|---|
| **Tier 1 — Verified Mednoris Hospital** | Hospital already onboarded and verified on Mednoris | Fastest access — near-instant, read-only view via QR scan |
| **Tier 2 — Verified External Healthcare Professional** | Doctor/hospital not on Mednoris, but identity and credentials independently verified | Temporary, read-only access, scoped to a defined time window |
| **Tier 3 — Unknown Requester** | First-time requester with unverified identity/credentials | Held for manual review and additional verification before any access is granted |
| **Tier 4 — Failed Verification** | Identity or credentials could not be confirmed | No access granted |

Every request, regardless of tier, is logged in the audit trail (requester identity, hospital/affiliation claimed, time, tier assigned, outcome).

**Verification mechanism (open, to be designed):** The core unresolved product question is how Mednoris confirms that a requester's claimed identity (name, hospital, medical license, position) is genuine. Candidate approaches to evaluate — including government medical license registry checks, work-email domain verification, hospital callback verification, and manual review queues for first-time requesters — will be designed and tested during the doctor onboarding/verification workstream (see Layer 1 Doctor Verification Process), since the same core problem (confirming a real, licensed healthcare professional) applies to both layers. This section will be updated once that verification mechanism is finalized.

**Default state for all new records:** access defaults to requiring verification (equivalent to the prior "Private" default) — no record is openly viewable without the requester passing through a trust tier check.

---

## 9. Data Ownership & Consent Model (Explicit Boundary)

This is a deliberate and important distinction from Layer 1:

- **Layer 1 (Patient–Doctor):** Patient owns and controls their data. Access requires patient-approved, time-limited consent.
- **Layer 2 (Hospital Records):** Hospital owns and controls the data it generates. Patient does not have account access, editing rights, or approval authority over hospital-held records. The patient's only mechanism of control is physically carrying (or not carrying/losing) their QR card.

This boundary must be clearly and consistently documented internally, and reflected accurately in any external communication (e.g., grant applications, investor materials), so the two layers are never conflated as offering the same ownership guarantees.

---

## 10. Revenue Model

- Hospitals are charged directly for record digitization and secure storage (per-record fee or flat monthly/facility fee) — independent of whether the patient ever downloads the Mednoris app or books a consultation.
- This decouples Layer 2 revenue from patient adoption of Layer 1, which is critical given target users may be in low-smartphone-access, rural areas.
- Natural bridge to Layer 1 revenue: when a rural hospital refers a patient to a specialist or larger hospital, the receiving doctor (if on Layer 1) can request record access via the patient's consent flow, creating a natural entry point into paid consultations.

---

## 11. Future Considerations (Not MVP)

- USSD or SMS-based patient access for feature-phone users.
- **Verification mechanism design (highest priority open item):** determining how Mednoris confirms a requester's claimed identity, hospital affiliation, medical license, and position. Candidate approaches to evaluate: government medical license registry checks, work-email domain verification, hospital callback verification, and a manual review queue for first-time/unverified requesters. To be designed jointly with the Layer 1 Doctor Verification workstream, since both layers face the same core trust problem.
- Rule-based automation for Tier 2/3 approvals as request volume grows, reducing reliance on manual Platform Owner review.
- Optional EHR integration for hospitals with existing systems.
- Tiered record visibility (e.g., "emergency summary" vs. full history) within a granted access session, rather than all-or-nothing read access.
- Optional secondary verification (PIN) for QR scans, to mitigate risk from lost/photographed physical cards.
- Formal data-processing agreements/contracts with each onboarded hospital.
- Time-bound expiration for Tier 2 (external professional) access sessions, mirroring Layer 1's time-limited consent model.

---

## 12. Open Risks

- **Verification mechanism is unresolved and is now the core product risk.** The entire trust-tier model depends on Mednoris being able to reliably confirm a requester's claimed identity and credentials. Until this is designed and validated, Tier 2 access (external professionals) cannot be safely implemented.
- **Physical card loss or duplication risk:** anyone holding the physical card can have it scanned; no secondary verification exists at MVP stage.
- **Manual review bottleneck:** Platform Owner personally reviewing every Tier 3 (unknown requester) request will not scale past early-stage volume.
- **No patient visibility by design:** patients cannot see what's stored about them in this layer, which should be clearly scoped and communicated as a deliberate, hospital-owned data model — distinct from Layer 1's patient-owned promise.
- **Onboarding is manual/relationship-driven:** hospital sales cycles are slower than self-serve patient/doctor sign-up, requiring direct outreach and relationship-building rather than product-led growth.

---

*Document prepared for Mednoris (Elite-Tch) — Hospital Records Layer, MVP scope.*