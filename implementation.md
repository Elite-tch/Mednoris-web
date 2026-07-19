# Comprehensive Frontend Implementation Plan

This document outlines the detailed architecture, page structure, onboarding flows, and technical stack (Next.js, Framer Motion, and Privy) for the Privacy-First Digital Healthcare Ecosystem MVP 1.

## 1. Tech Stack & Integrations
- **Framework**: Next.js (App Router) for SEO, routing, and API endpoints.
- **Animations**: Framer Motion for smooth page transitions, modal reveals, and hover effects (glassmorphism UI).
- **Authentication & Wallet**: **Privy** will be used to handle seamless user onboarding. It supports traditional logins (email/socials) and Web3 wallet connections, abstracting the complexity for non-technical patients while providing a secure identity layer for the blockchain ecosystem.
- **Styling**: Standard CSS Modules or plain CSS (unless Tailwind is preferred) focusing on rich aesthetics, modern typography (*Inter*/*Outfit*), and dynamic color palettes.

---

## 2. Page Architecture (Total: ~7 Main Pages)

The application will be divided into distinct routing areas. Here is the breakdown of pages and their respective sections:

### Page 1: Landing Page (`/`)
*The public-facing entry point of the platform.*
- **Hero Section**: High-impact value proposition ("Own Your Medical Future"). Call-to-action buttons to "Get Started" or "Join as a Doctor" (Triggers Privy Auth).
- **Features Overview**: Animated cards showcasing the Encrypted Vault, Global Telemedicine Marketplace, and AI Assistant.
- **How it Works**: A step-by-step timeline of the patient and doctor journey.
- **Footer**: Legal, support, and social links.

### Page 2: Patient Dashboard (`/patient/dashboard`)
*The secure hub for a patient's medical life.*
- **Overview Section**: Quick stats (Total records, upcoming appointments, active shared permissions).
- **Profile Management**: Update personal details, emergency contacts, and medical basics.
- **Appointments Management**: Categorized views for Scheduled, Successful, and Cancelled appointments.
- **Notifications**: Alerts for appointment reminders, new prescriptions, and doctor messages.
- **Chat System**: Secure messaging interface for pre-consultation inquiries and active consultation communication.
- **Medical Timeline / Vault**: Chronological history of uploaded records, test results, and consultation summaries.
- **Upload Section**: Drag-and-drop interface for securely uploading new medical files.
- **Permissions Manager**: A list of doctors who currently have access, the time remaining, and a one-click "Revoke Access" button.
- **AI Assistant, Family, Settings.**

### Page 3: Doctor Marketplace (`/patient/marketplace`)
*Where patients discover and book healthcare professionals.*
- **Search & Filter Bar**: Filter by specialty, language, price, and availability.
- **Doctor Grid**: Animated cards showing verified doctors, their ratings, and consultation fees.
- **Doctor Profile Modal/Page**: Detailed view of the doctor's bio, credentials, available time slots, and the booking/payment checkout flow.

### Page 4: Doctor Portal (`/doctor/dashboard`)
*The control center for verified healthcare professionals.*
- **Consultations Overview**: Dashboard summary of today's schedule and recent earnings. profile
- **All Appointments**: Comprehensive list of all patient appointments (upcoming, completed, cancelled).
- **Availability Manager**: Calendar UI to set working hours and block off time slots.
- **Chat System**: Secure messaging interface to communicate with patients.
- **Notifications**: Alerts for new appointment requests, patient record access approvals, and incoming messages.
ai-assistant , setting 

### Page 5: Patient Public Profile (Doctor's View) (`/doctor/patient/[id]`)
*The dedicated consultation room and record viewer for doctors.*
- **Patient Record Viewer**: The highly secure, watermarked UI where doctors view approved patient records (read-only).
- **Post-Consultation UI**: Forms to upload prescriptions, diagnoses, and treatment plans directly into the patient's vault.

### Page 6: AI Assistant & Medical Passport (`/patient/ai-tools`)
*Dedicated AI and utility tools for patients.*
- **AI Chat Interface**: AI assistant to explain medical terminology or summarize lab results.
- **Medical Passport Generator**: Select which information (blood type, allergies, emergency contacts) to include in a generated emergency summary.

### Page 7: Admin Dashboard (`/admin`)
*Internal tools for platform integrity.*
- **Verification Queue**: Review and approve/reject doctor applications and licenses.
- **Platform Analytics**: Total users, total consultations, platform commission revenue.

---

## 3. Onboarding Flows (Powered by Privy)

### Patient Onboarding
Patients need a frictionless experience. Privy will handle the wallet creation under the hood if they sign in via email.
1. **Authentication**: Sign up via Email, Google, or Web3 Wallet (via Privy modal).
2. **Role Selection**: User selects "I am a Patient".
3. **Basic Profile Creation**:
   - Full Name
   - Date of Birth
   - Blood Group
   - Allergies (Optional)
   - Emergency Contacts
4. **Welcome Screen**: Brief Framer Motion animated tutorial on how to upload their first medical record.

### Doctor Onboarding
Doctors have a strict verification requirement before they can access the marketplace.
1. **Authentication**: Sign up via Privy.
2. **Role Selection**: User selects "I am a Healthcare Professional".
3. **Professional Profile**:
   - Full Name & Professional Title
   - Specializations & Languages Spoken
   - Biography
4. **Verification Document Upload**:
   - Government-issued ID
   - Valid Medical License
   - Professional Practice Certificate
5. **Pending State**: The doctor is placed in a "Pending Verification" state and cannot accept consultations until an Admin approves their documents.

---

## 4. Next Steps for Implementation
1. **Initialize Next.js**: Set up the App Router and directory structure in the project folder.
2. **Install Dependencies**: `framer-motion` for animations and `@privy-io/react-auth` for the authentication layer.
3. **Build the Layouts**: Create the shared navigation, authentication wrappers, and routing logic protecting the Patient, Doctor, and Admin routes.
