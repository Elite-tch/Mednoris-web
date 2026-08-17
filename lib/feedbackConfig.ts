export const FEEDBACK_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_FEEDBACK !== "false";

export const FEEDBACK_EMAIL =
  process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ?? "hello.mednoristeam@gmail.com";

export const FEEDBACK_WHATSAPP =
  process.env.NEXT_PUBLIC_FEEDBACK_WHATSAPP ?? "";

export const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug Report" },
  { value: "suggestion", label: "Suggestion" },
  { value: "general", label: "General Feedback" },
  { value: "other", label: "Other" },
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number]["value"];
