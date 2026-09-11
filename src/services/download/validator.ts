import { ValidationResult } from './types';
import { ResourceAssetType } from '../resources/types';

/**
 * Validates binary data buffer / Uint8Array against magic bytes and expected file characteristics
 */
export function validateBinaryContent(
  buffer: ArrayBuffer | Uint8Array,
  expectedType: ResourceAssetType
): ValidationResult {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const size = bytes.byteLength;

  if (size === 0) {
    return { valid: false, error: 'Downloaded file is completely empty (0 bytes).' };
  }

  // Reject suspiciously small files (less than 64 bytes)
  if (size < 64) {
    // Check if it's a raw URL string
    const sampleText = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, size));
    if (sampleText.startsWith('http://') || sampleText.startsWith('https://')) {
      return { valid: false, error: 'Corrupted payload: Downloaded content is a plain URL string instead of the binary file.' };
    }
    return { valid: false, error: `Downloaded file is suspiciously small (${size} bytes) and cannot be a valid document.` };
  }

  // Inspect first 256 bytes for signatures
  const headerSlice = bytes.slice(0, Math.min(256, size));
  const headerAscii = String.fromCharCode(...Array.from(headerSlice));

  // Check for raw URL string
  if (headerAscii.startsWith('http://') || headerAscii.startsWith('https://')) {
    return { valid: false, error: 'Corrupted payload: File begins with a URL string instead of binary content.' };
  }

  // Check for HTML error pages (e.g. 404, 403, Cloudflare, login redirect)
  const lowerHeader = headerAscii.toLowerCase();
  if (
    lowerHeader.includes('<!doctype html') ||
    lowerHeader.includes('<html') ||
    lowerHeader.includes('<head') ||
    lowerHeader.includes('<body>') ||
    lowerHeader.includes('<title>404') ||
    lowerHeader.includes('<title>error')
  ) {
    if (expectedType !== 'html') {
      return { valid: false, error: 'Provider returned an HTML error/webpage instead of the requested document.' };
    }
  }

  // Check for JSON error messages
  if (headerAscii.trim().startsWith('{') && (headerAscii.includes('"error"') || headerAscii.includes('"message"'))) {
    try {
      const fullText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      const parsed = JSON.parse(fullText);
      const msg = parsed.error || parsed.message || 'JSON error returned by server';
      return { valid: false, error: `Provider error response: ${msg}` };
    } catch {
      // Not valid JSON, continue checks
    }
  }

  // 1. PDF Validation
  if (expectedType === 'pdf') {
    // %PDF- magic bytes: 0x25, 0x50, 0x44, 0x46, 0x2D
    const isPdfSignature = 
      bytes[0] === 0x25 && 
      bytes[1] === 0x50 && 
      bytes[2] === 0x44 && 
      bytes[3] === 0x46 && 
      bytes[4] === 0x2D;

    // In some edge cases, leading BOM or whitespace might precede %PDF- in the first 32 bytes
    const pdfIndex = headerAscii.indexOf('%PDF-');

    if (!isPdfSignature && (pdfIndex < 0 || pdfIndex > 32)) {
      return { valid: false, error: 'Invalid PDF format: File header does not start with standard "%PDF-" magic bytes.' };
    }

    // PDFs must be at least 1KB
    if (size < 1024) {
      return { valid: false, error: `PDF file is too small to be valid (${size} bytes).` };
    }

    return { valid: true, detectedType: 'pdf' };
  }

  // 2. EPUB Validation
  if (expectedType === 'epub') {
    // EPUB is a ZIP archive: magic bytes PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B;
    if (!isZip) {
      return { valid: false, error: 'Invalid EPUB format: File does not have valid ZIP/EPUB magic bytes (PK).' };
    }
    // Must be at least 2KB
    if (size < 2048) {
      return { valid: false, error: `EPUB file is too small to be valid (${size} bytes).` };
    }
    return { valid: true, detectedType: 'epub' };
  }

  // 3. Plain Text Validation
  if (expectedType === 'txt') {
    // Check that it's readable text without binary null bytes in the first 100 characters
    let nullCount = 0;
    for (let i = 0; i < Math.min(100, size); i++) {
      if (bytes[i] === 0) nullCount++;
    }
    if (nullCount > 2) {
      return { valid: false, error: 'Invalid text file: File contains binary null characters.' };
    }
    return { valid: true, detectedType: 'txt' };
  }

  // 4. Other types (docx, audio, video)
  if (expectedType === 'docx') {
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B;
    if (!isZip) {
      return { valid: false, error: 'Invalid DOCX format: File does not have valid Office Open XML ZIP magic bytes.' };
    }
    return { valid: true, detectedType: 'docx' };
  }

  return { valid: true, detectedType: expectedType };
}

/**
 * Validates a Blob by reading its first chunk
 */
export async function validateBlobContent(
  blob: Blob,
  expectedType: ResourceAssetType
): Promise<ValidationResult> {
  try {
    const slice = blob.slice(0, Math.min(4096, blob.size));
    const arrayBuffer = await slice.arrayBuffer();
    const result = validateBinaryContent(new Uint8Array(arrayBuffer), expectedType);
    if (!result.valid) return result;

    if (blob.size < 256 && expectedType !== 'txt') {
      return { valid: false, error: `Downloaded blob size (${blob.size} bytes) is suspiciously small.` };
    }

    return { valid: true, detectedType: result.detectedType };
  } catch (err: any) {
    return { valid: false, error: `Failed to inspect binary blob: ${err?.message || err}` };
  }
}
