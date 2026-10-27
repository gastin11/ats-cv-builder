import { fileTypeFromBuffer } from 'file-type';

export type SupportedKind = 'docx' | 'pdf' | 'png' | 'jpg';

const EXT_TO_KIND: Record<string, SupportedKind> = {
  docx: 'docx',
  pdf: 'pdf',
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpg',
};

const MIME_TO_KIND: Record<string, SupportedKind> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

export interface FileValidationResult {
  ok: boolean;
  reason?: string;
  kind?: SupportedKind;
  extension?: string;
}

/**
 * Validate an uploaded file by extension, declared MIME type and magic bytes
 * (file signature). Buffers stay in memory; nothing is written to disk.
 */
export async function validateUploadedFile(
  filename: string,
  mimetype: string,
  buffer: Buffer,
  maxBytes: number,
): Promise<FileValidationResult> {
  const extension = (filename.split('.').pop() ?? '').toLowerCase();
  const declared = EXT_TO_KIND[extension];
  if (!declared) {
    return { ok: false, reason: `Unsupported file extension ".${extension}". Supported: .pdf, .docx, .png, .jpg, .jpeg.` };
  }
  if (MIME_TO_KIND[mimetype] && MIME_TO_KIND[mimetype] !== declared) {
    return { ok: false, reason: 'File content does not match its declared type.' };
  }
  if (buffer.byteLength === 0) {
    return { ok: false, reason: 'The uploaded file is empty.' };
  }
  if (buffer.byteLength > maxBytes) {
    return {
      ok: false,
      reason: `File is too large (max ${Math.round(maxBytes / (1024 * 1024))} MB).`,
    };
  }

  const detected = await fileTypeFromBuffer(buffer);
  const detectedExt = detected?.ext as string | undefined;

  let signatureMatches = false;
  if (declared === 'docx') signatureMatches = detectedExt === 'docx' || (buffer[0] === 0x50 && buffer[1] === 0x4b);
  else if (declared === 'pdf') signatureMatches = buffer.subarray(0, 5).toString('latin1') === '%PDF-';
  else if (declared === 'png') signatureMatches = detectedExt === 'png';
  else if (declared === 'jpg') signatureMatches = detectedExt === 'jpg' || detectedExt === 'jpeg';

  if (!signatureMatches) {
    return { ok: false, reason: 'File signature does not match its extension. The file may be corrupted or renamed.' };
  }

  return { ok: true, kind: declared, extension };
}

/** Strip directory components and unsafe characters from a client filename. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'file';
  return base.replace(/[^\w.\- ()\[\]]+/g, '_').slice(0, 180) || 'file';
}
