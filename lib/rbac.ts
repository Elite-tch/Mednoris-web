export type StaffRole = "owner" | "admin" | "receptionist" | "nurse" | "doctor" | "scientist" | "pharmacist" | "lab_technician";

export type RecordSection = "basic_info" | "summary" | "consultation" | "lab" | "pharmacy" | "audit_log";

type AccessLevel = "full" | "view" | "none";

// Define the matrix exactly as specified in the plan
const permissions: Record<RecordSection, Record<StaffRole, AccessLevel>> = {
  basic_info: {
    owner: "full", admin: "full", receptionist: "full", nurse: "view", doctor: "view", scientist: "view", pharmacist: "view", lab_technician: "view"
  },
  summary: {
    owner: "full", admin: "full", receptionist: "view", nurse: "full", doctor: "full", scientist: "view", pharmacist: "view", lab_technician: "view"
  },
  consultation: {
    owner: "full", admin: "full", receptionist: "none", nurse: "view", doctor: "full", scientist: "none", pharmacist: "none", lab_technician: "none"
  },
  lab: {
    owner: "full", admin: "full", receptionist: "none", nurse: "view", doctor: "view", scientist: "full", pharmacist: "none", lab_technician: "full"
  },
  pharmacy: {
    owner: "full", admin: "full", receptionist: "none", nurse: "view", doctor: "view", scientist: "none", pharmacist: "full", lab_technician: "none"
  },
  audit_log: {
    owner: "full", admin: "full", receptionist: "none", nurse: "none", doctor: "none", scientist: "none", pharmacist: "none", lab_technician: "none"
  }
};

export function isStandardRole(role: string): boolean {
  return ["owner", "admin", "receptionist", "nurse", "doctor", "scientist", "pharmacist", "lab_technician"].includes(role);
}

/**
 * Helper to get the access level for a specific role and section.
 * Defaults to "none" if the role/section doesn't match perfectly.
 */
export function getAccessLevel(role: string, section: string, fullAccess?: boolean): AccessLevel {
  // Full Access grants owner-level clinical visibility, but not admin logs
  if (fullAccess && section !== "audit_log") {
    return "full";
  }

  if (isStandardRole(role)) {
    const r = role as StaffRole;
    if (!permissions[section as RecordSection]) return "none";
    return permissions[section as RecordSection][r] || "none";
  } else {
    // Custom dynamic role
    const normalizedRole = role.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (section === "basic_info" || section === "summary") return "view";
    if (section === normalizedRole) return "full";
    return "none";
  }
}

/**
 * Returns an array of section keys that the given role has at least "view" access to.
 * This is used to dynamically render the Tab bar.
 */
export function getVisibleSections(role: string, fullAccess?: boolean): string[] {
  const visible: string[] = [];
  
  if (fullAccess) {
    // Full Access users see all clinical tabs
    const standardSections = ["basic_info", "summary", "consultation", "lab", "pharmacy"];
    visible.push(...standardSections);
    // Include their own custom role tab if they have one
    if (!isStandardRole(role)) {
      const normalizedRole = role.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      if (!visible.includes(normalizedRole)) visible.push(normalizedRole);
    }
    return visible;
  }

  if (isStandardRole(role)) {
    for (const section of Object.keys(permissions) as RecordSection[]) {
      if (section === "audit_log") continue; // Never render audit_log as a patient tab
      const level = getAccessLevel(role, section);
      if (level === "full" || level === "view") {
        visible.push(section);
      }
    }
  } else {
    // Custom dynamic role gets basic info, summary, and their own dedicated tab
    const normalizedRole = role.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    visible.push("basic_info", "summary", normalizedRole);
  }
  
  return visible;
}

/**
 * Specifically checks if a role is permitted to execute actions like printing the QR Card.
 */
export function canPrintCard(role: string): boolean {
  return ["owner", "admin", "receptionist"].includes(role);
}

/**
 * Specifically checks if a role is permitted to register new patients.
 */
export function canRegisterPatient(role: string, fullAccess?: boolean): boolean {
  if (fullAccess) return true;
  return ["owner", "admin", "receptionist"].includes(role);
}
