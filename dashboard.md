# Mednoris Hospital Dashboard: Architecture & Workflow Specification

This document outlines the architecture, routing, and access control logic for the Mednoris Hospital Dashboard (Layer 2). This system ensures strict data separation, exact staff shift tracking, and a premium multi-tenant experience for B2B hospital clients.

## 1. Post-Demo Onboarding (The Handshake)
Since Mednoris Layer 2 handles sensitive medical data, hospitals cannot self-register automatically from the public internet.

1. **The Demo & Agreement:** The hospital requests a demo via the landing page. The Mednoris team (Elite-Tch) conducts the demo and the hospital agrees to sign up.
2. **Manual Provisioning:** The Platform Admin (Elite-Tch) manually provisions a new "Hospital Entity" in the master database (e.g., "St. Mary's Clinic").
3. **Secure Setup Link:** The system generates a highly secure, one-time setup link.
4. **Email Dispatch:** This link is emailed directly to the Hospital Owner.

## 2. Hospital Owner Initial Setup
1. **Activation:** The Hospital Owner clicks the secure link, which directs them to their personalized setup page (e.g., `mednoris.com/onboarding/st-marys-clinic`).
2. **Account Creation:** The Owner sets up their Admin password and confirms their facility's details. 
3. **Workspace Ready:** Once confirmed, their isolated digital workspace is officially activated.

## 3. Workspace Routing (Multi-Tenant Architecture)
Every hospital receives its own dedicated routing workspace. This ensures data partitioning and provides a personalized, premium feel.

- **Route Structure:** We use a dynamic segment `/h/[hospitalSlug]`.
- **Login Page:** `mednoris.com/h/st-marys-clinic/login`
- **Main Dashboard:** `mednoris.com/h/st-marys-clinic/dashboard`
- **Patient Registration:** `mednoris.com/h/st-marys-clinic/register`

*Note: The URL remains clean and tied to the workspace. We do NOT put staff names in the URL (e.g., no `/staff-john`). Staff identity is managed securely via the active login session.*

## 4. Role-Based Access Control (RBAC) & Custom Dashboards
Because hospital staff operate in shifts and have different responsibilities than the owner, individual staff accounts are absolutely critical. The system presents two completely distinct Dashboard UIs based on the logged-in role.

### A. The Admin Dashboard (Hospital Owner View)
The Owner Dashboard provides high-level oversight, staff management, and strict activity monitoring.

1. **Overview & Analytics:** A summary dashboard displaying real-time statistics (total patients registered, daily activity volume, etc.) powered by live charts (no mock data).
2. **Staff Management:** A dedicated page to add new staff accounts, remove ex-staff, and view the list of currently active staff members.
3. **Audit Logs & History:** The ultimate visibility tool. The admin can see exactly *who* logged in, *when* they logged in, and every single action they performed (e.g., "Nurse Sarah added a new patient at 10:05 AM").
4. **Settings & Billing:** Pages to manage hospital-wide configurations and subscription details.

### B. The Staff Dashboard (Operational View)
The Staff Dashboard focuses entirely on the daily work of hospital employees. It does not show owner stats or audit logs. It is built for speed and departmental clarity.

1. **Staff Overview:** A basic summary tailored to the staff member's daily tasks.
2. **Patients Directory:** A searchable list of all registered patients showing their Name and generated Mednoris ID. Each row includes:
   - **View Button:** Opens the detailed Patient Profile.
   - **Print Card Button:** Generates the physical QR ID card.
   - **Search Bar:** Quickly look up a patient by their unique generated ID.
3. **Add / Edit Patient Workflow:** When adding a new patient (or viewing an existing one), the interface is split into logical sections:
   - **Basic Information:** Core details (name, age, etc.) and an *optional* camera integration to capture a headshot.
   - **Departmental Tabs:** Below the basic info, the record is organized into distinct tabs (e.g., *Receptionist, Summary, Lab*). This prevents confusion so that a lab tech only interacts with the Lab tab.
   - **Dynamic Tab Creation:** A button to "Add Manual Tab" allows staff to create custom sections on the fly if a department is missing.
   - **Dynamic Data Entry (Custom Forms):** Inside each tab, inputs are not strictly compulsory. Staff can click "Add Form" which spawns two inputs: one for the Label (e.g., "Blood Pressure") and one for the Value (e.g., "120/80"). 
   - **Append-Only & Corrections (Clinical Immutability):** To maintain true clinical integrity, records cannot be edited or deleted once saved. Instead, a "Correction" button is available beside past entries. Clicking it allows staff to append an official amendment (e.g., "Correction: BP is 120/80, not 210/80") which visually attaches to the original, erroneous entry without destroying the historical timeline.

## 5. Seamless Shift Tracking
1. **Morning Shift:** Nurse Sarah logs in using *her specific* username. Everything she does inside the Staff Dashboard is tagged in the database under her name.
2. **Shift Change:** Her shift ends, she logs out.
3. **Evening Shift:** Scientist John logs in at the exact same computer with *his* credentials. He navigates to the "Lab" tab of a patient's profile and adds a new lab result form. 
4. **The Result:** The Hospital Owner, checking the Admin Dashboard Audit Log, sees a perfect, chronological history of Sarah's and John's independent actions.
