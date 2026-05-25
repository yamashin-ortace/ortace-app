import {
  SUPPORT_CLAIM_ALLOWED_EXTENSIONS,
  SUPPORT_CLAIM_ALLOWED_MIME_TYPES,
  SUPPORT_CLAIM_MAX_FILE_SIZE_BYTES,
} from "./constants";

export function isAllowedSupportClaimMimeType(type: string): boolean {
  return SUPPORT_CLAIM_ALLOWED_MIME_TYPES.includes(
    type as (typeof SUPPORT_CLAIM_ALLOWED_MIME_TYPES)[number],
  );
}

export function isAllowedSupportClaimExtension(name: string): boolean {
  const extension = getFileExtension(name);
  return SUPPORT_CLAIM_ALLOWED_EXTENSIONS.includes(
    extension as (typeof SUPPORT_CLAIM_ALLOWED_EXTENSIONS)[number],
  );
}

export function getFileExtension(name: string): string {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return extension === "jpg" || extension === "jpeg" ? "jpg" : extension;
}

export function getSupportClaimContentType(file: File): string {
  if (file.type) return file.type;
  const extension = getFileExtension(file.name);
  if (extension === "png") return "image/png";
  if (extension === "heic") return "image/heic";
  if (extension === "heif") return "image/heif";
  return "image/jpeg";
}

export function validateSupportClaimFile(file: File): string | null {
  if (file.size > SUPPORT_CLAIM_MAX_FILE_SIZE_BYTES) {
    return "ファイルサイズは5MB以内にしてください。";
  }
  if (
    file.type &&
    !isAllowedSupportClaimMimeType(file.type) &&
    !isAllowedSupportClaimExtension(file.name)
  ) {
    return "JPG、PNG、HEIC形式の画像を選んでください。";
  }
  if (!file.type && !isAllowedSupportClaimExtension(file.name)) {
    return "JPG、PNG、HEIC形式の画像を選んでください。";
  }
  return null;
}

export function isValidEvidencePath(path: string, userId: string): boolean {
  if (!path.startsWith(`${userId}/`)) return false;
  if (path.includes("..") || path.includes("\\")) return false;
  return path.length <= 512;
}

export function createEvidenceObjectPath(
  userId: string,
  fileName: string,
  randomId: string,
): string {
  const extension = getFileExtension(fileName) || "jpg";
  return `${userId}/${randomId}.${extension}`;
}
