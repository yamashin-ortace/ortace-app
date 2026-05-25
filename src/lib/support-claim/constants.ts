export const SUPPORT_CLAIM_EVIDENCE_BUCKET = "support-claim-evidence";
export const SUPPORT_CLAIM_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const SUPPORT_CLAIM_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
] as const;

export const SUPPORT_CLAIM_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "heic",
  "heif",
] as const;
