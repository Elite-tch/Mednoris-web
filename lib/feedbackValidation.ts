export const FEEDBACK_IMAGE_LIMITS = {
  maxCount: 4,
  maxBytes: 10 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/jpg", "image/png"],
  accept: ".jpg,.jpeg,.png,image/jpeg,image/png",
} as const;

export function validateFeedbackImage(file: File): string | null {
  const normalizedType = file.type.toLowerCase();
  const allowed = FEEDBACK_IMAGE_LIMITS.allowedTypes as readonly string[];

  if (!allowed.includes(normalizedType)) {
    return `"${file.name}" must be a JPG or PNG image.`;
  }

  if (file.size > FEEDBACK_IMAGE_LIMITS.maxBytes) {
    return `"${file.name}" exceeds the 10MB size limit.`;
  }

  return null;
}

export function validateFeedbackImages(
  existingCount: number,
  newFiles: File[]
): string | null {
  if (existingCount + newFiles.length > FEEDBACK_IMAGE_LIMITS.maxCount) {
    return `You can attach up to ${FEEDBACK_IMAGE_LIMITS.maxCount} images.`;
  }

  for (const file of newFiles) {
    const error = validateFeedbackImage(file);
    if (error) return error;
  }

  return null;
}
