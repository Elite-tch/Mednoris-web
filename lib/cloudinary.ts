export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url; // Returns the uploaded file URL
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
}

/**
 * Upload an E2EE-encrypted file blob to Cloudinary as a raw resource.
 * The payload is { ciphertext: base64, iv: base64 } serialized to JSON then uploaded as
 * an application/octet-stream blob. Cloudinary only ever stores the ciphertext.
 *
 * Returns the Cloudinary secure_url where the encrypted blob is stored.
 */
export async function uploadEncryptedFileToCloudinary(
  encrypted: { ciphertext: string; iv: string }
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing.");
  }

  // Serialize the encrypted payload and wrap as a binary blob
  const jsonBytes = new TextEncoder().encode(JSON.stringify(encrypted));
  const blob = new Blob([jsonBytes], { type: "application/octet-stream" });

  const formData = new FormData();
  formData.append("file", blob, "encrypted.bin");
  formData.append("upload_preset", uploadPreset);
  formData.append("resource_type", "raw"); // tell Cloudinary this is a raw file

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error(`Cloudinary encrypted upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Download an E2EE-encrypted blob from Cloudinary and return its { ciphertext, iv }.
 * Used before calling decryptFile() to get back the original file bytes.
 */
export async function downloadEncryptedFile(
  url: string
): Promise<{ ciphertext: string; iv: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to download encrypted attachment.");
  const text = await res.text();
  return JSON.parse(text);
}
