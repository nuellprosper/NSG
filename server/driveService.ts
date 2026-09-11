import { google } from "googleapis";
import { Firestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { OPENSTAX_STARTER_CATALOG } from "../src/data/openstaxCatalog";

// Storage directory for uploaded files when Google Drive service account is not yet configured
const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".drive_storage");
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  try {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  } catch (err) {
    console.warn("Could not create .drive_storage directory:", err);
  }
}

/**
 * Robust helper to reformat single-line or space-separated PEM private keys
 * that often occur when secrets are pasted into environment forms.
 */
export function formatPrivateKey(rawKey?: string): string {
  if (!rawKey) return "";
  let clean = rawKey.trim();
  if (clean.includes("\\n")) {
    clean = clean.replace(/\\n/g, "\n");
  }
  if (!clean.includes("\n")) {
    const beginMarker = "-----BEGIN PRIVATE KEY-----";
    const endMarker = "-----END PRIVATE KEY-----";
    let body = clean;
    if (body.includes(beginMarker)) body = body.replace(beginMarker, "").trim();
    if (body.includes(endMarker)) body = body.replace(endMarker, "").trim();
    body = body.replace(/\s+/g, "");
    const chunks = body.match(/.{1,64}/g) || [];
    clean = `${beginMarker}\n${chunks.join("\n")}\n${endMarker}\n`;
  }
  return clean;
}

/**
 * Sanitizes Google Drive folder ID in case a full URL like
 * "https://drive.google.com/drive/folders/1aZJFPFzctkCU0qMc3vs9kH8uxNYc2AEW"
 * was provided instead of just the ID.
 */
export function sanitizeFolderId(raw?: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const clean = raw.split("?")[0].trim();
  return clean.length > 0 ? clean : undefined;
}

// Google Drive Client Initializer (Server-Side Only - Never leaks to client)
export function getGoogleDriveClient() {
  const serviceAccountJson = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (serviceAccountJson) {
    try {
      const credentials = JSON.parse(serviceAccountJson);
      const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: formatPrivateKey(credentials.private_key),
        scopes: ["https://www.googleapis.com/auth/drive"]
      });
      return google.drive({ version: "v3", auth });
    } catch (e) {
      console.warn("[DriveProxy] Failed to parse GOOGLE_DRIVE_SERVICE_ACCOUNT JSON:", e);
    }
  }

  if (clientEmail && rawKey) {
    try {
      const formattedKey = formatPrivateKey(rawKey);
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: formattedKey,
        scopes: ["https://www.googleapis.com/auth/drive"]
      });
      return google.drive({ version: "v3", auth });
    } catch (e) {
      console.warn("[DriveProxy] Failed to init JWT auth with email/key:", e);
    }
  }

  return null;
}

export interface UploadMetadata {
  fileBase64?: string;
  fileName?: string;
  mimeType?: string;
  courseCode: string;
  title: string;
  faculty: string;
  department: string;
  level: string;
  semester?: string;
  notes?: string;
  content?: string;
  thumbnailUrl?: string;
  galleryImages?: string[];
  attachedDocs?: any[];
  uploaderUid: string;
  uploaderName: string;
  uploaderEmail: string;
}

// Allowed MIME types: PDF, DOCX, DOC, TXT, MD
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
  "application/octet-stream"
]);

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt", ".md"];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB strict ceiling

export async function processCommunityUpload(db: Firestore, metadata: UploadMetadata) {
  let {
    fileBase64,
    fileName,
    mimeType,
    courseCode,
    title,
    faculty,
    department,
    level,
    semester,
    notes,
    content,
    thumbnailUrl,
    galleryImages,
    attachedDocs,
    uploaderUid,
    uploaderName,
    uploaderEmail
  } = metadata;

  // Synthesize text document if no file attached but notes or syllabus provided
  if (!fileBase64 && (notes || content)) {
    const textContent = `# ${courseCode.toUpperCase()}: ${title}\n` +
      `Faculty: ${faculty || "General"}\n` +
      `Department: ${department || "General"}\n` +
      `Level: ${level || "100L"}\n\n` +
      `## Course Materials & Notes\n\n${notes || content}\n`;
    fileBase64 = Buffer.from(textContent, "utf-8").toString("base64");
    fileName = `${courseCode}_Course_Notes.txt`;
    mimeType = "text/plain";
  }

  if (!fileBase64) {
    throw new Error("Missing file content or course notes.");
  }

  // Validate file extension
  const ext = path.extname(fileName || "").toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME_TYPES.has(mimeType || "")) {
    throw new Error("Invalid file type. Please provide a verified PDF, DOCX, or text course document.");
  }

  // Convert base64 to buffer
  const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowable ceiling of 25MB.`);
  }

  const driveFileId = `gdrive_${crypto.randomBytes(12).toString("hex")}`;
  let isStoredInGoogleDrive = false;
  let realDriveFileId = "";
  let driveWebViewLink = "";
  let driveErrorNotice = "";

  const drive = getGoogleDriveClient();
  const rawFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const folderId = sanitizeFolderId(rawFolderId);

  if (drive) {
    try {
      const { Readable } = await import("stream");
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const fileMetadata: any = {
        name: `${courseCode}_${fileName || 'material.pdf'}`,
      };
      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const response = await drive.files.create({
        supportsAllDrives: true,
        requestBody: fileMetadata,
        media: {
          mimeType: mimeType || "application/pdf",
          body: stream
        },
        fields: "id, name, webViewLink, webContentLink"
      });

      if (response.data.id) {
        isStoredInGoogleDrive = true;
        realDriveFileId = response.data.id;
        driveWebViewLink = response.data.webViewLink || "";
        console.log(`[DriveProxy] Uploaded file directly to Google Drive: ${response.data.id}`);
      }
    } catch (driveErr: any) {
      const errMsg = driveErr?.response?.data?.error?.message || driveErr?.message || String(driveErr);
      console.warn("[DriveProxy] Google Drive API upload notice:", errMsg);
      driveErrorNotice = errMsg;
    }
  }

  // Fallback / local vault storage ensures no file is lost
  const localFilePath = path.join(LOCAL_STORAGE_DIR, `${driveFileId}_${fileName || 'file.pdf'}`);
  try {
    fs.writeFileSync(localFilePath, buffer);
  } catch (fsErr) {
    console.warn("[DriveProxy] Error writing to local vault:", fsErr);
  }

  const uploadRecord = {
    fileId: driveFileId,
    driveFileId,
    realDriveFileId,
    driveWebViewLink,
    driveError: driveErrorNotice,
    title: title || fileName || `${courseCode} Study Material`,
    code: (courseCode || "").toUpperCase().trim(),
    faculty: faculty || "Faculty of Physical Sciences",
    department: department || "General",
    level: level || "100L",
    semester: semester || "First Semester",
    notes: notes || content || "",
    content: content || notes || "",
    thumbnailUrl: thumbnailUrl || "",
    galleryImages: galleryImages || [],
    attachedDocs: attachedDocs || [
      {
        id: driveFileId,
        name: fileName || `${courseCode}_Material.pdf`,
        type: mimeType?.includes("word") ? "docx" : (mimeType?.includes("text") ? "txt" : "pdf"),
        size: buffer.length
      }
    ],
    uploaderUid: uploaderUid || "anonymous",
    uploaderEmail: uploaderEmail || "",
    uploaderName: uploaderName || "Student Contributor",
    fileName: fileName || `${courseCode}.pdf`,
    mimeType: mimeType || "application/pdf",
    size: buffer.length,
    status: "pending" as const, // Strict requirement: Pending moderation by default
    rejectionReason: "",
    isStoredInGoogleDrive,
    driveDownloadUrl: `/api/drive/download/${driveFileId}`,
    createdAt: new Date().toISOString()
  };

  const docRef = await db.collection("community_uploads").add(uploadRecord);

  return {
    success: true,
    uploadId: docRef.id,
    driveFileId,
    status: "pending",
    message: "sent to admin for verification, would be uploaded soon."
  };
}

export async function deleteCommunityUpload(db: Firestore, uploadId: string) {
  let uploadData: any = null;
  const docRef = db.collection("community_uploads").doc(uploadId);
  const snap = await docRef.get();
  if (snap.exists) {
    uploadData = snap.data();
    await docRef.delete();
  }

  // Delete matching course in courses collection
  try {
    const courseSnap = await db.collection("courses")
      .where("driveFileId", "==", uploadData?.driveFileId || uploadId)
      .get();
    for (const d of courseSnap.docs) {
      await d.ref.delete();
    }
  } catch (cErr) {}

  // Delete local file
  if (uploadData?.driveFileId && fs.existsSync(LOCAL_STORAGE_DIR)) {
    try {
      const files = fs.readdirSync(LOCAL_STORAGE_DIR);
      for (const f of files) {
        if (f.startsWith(uploadData.driveFileId)) {
          fs.unlinkSync(path.join(LOCAL_STORAGE_DIR, f));
        }
      }
    } catch (fErr) {}
  }

  // Delete from Google Drive if real file ID exists
  if (uploadData?.realDriveFileId) {
    const drive = getGoogleDriveClient();
    if (drive) {
      try {
        await drive.files.delete({ fileId: uploadData.realDriveFileId, supportsAllDrives: true });
      } catch (gErr) {}
    }
  }

  return { success: true };
}

export async function getFileStreamOrBuffer(db: Firestore, fileId: string) {
  // Look up in community uploads or local vault
  const snapshot = await db.collection("community_uploads").where("driveFileId", "==", fileId).limit(1).get();
  let uploadData: any = null;
  if (!snapshot.empty) {
    uploadData = snapshot.docs[0].data();
  } else {
    const doc = await db.collection("community_uploads").doc(fileId).get();
    if (doc.exists) {
      uploadData = doc.data();
    }
  }

  // Check local files first
  if (fs.existsSync(LOCAL_STORAGE_DIR)) {
    const files = fs.readdirSync(LOCAL_STORAGE_DIR);
    const match = files.find(f => f.startsWith(fileId));
    if (match) {
      const fullPath = path.join(LOCAL_STORAGE_DIR, match);
      const buffer = fs.readFileSync(fullPath);
      return {
        buffer,
        fileName: uploadData?.fileName || match.replace(`${fileId}_`, ""),
        mimeType: uploadData?.mimeType || "application/pdf",
        status: uploadData?.status || "approved",
        uploaderUid: uploadData?.uploaderUid || ""
      };
    }
  }

  // If stored in Google Drive, stream from Google Drive
  const drive = getGoogleDriveClient();
  if (drive && uploadData?.driveFileId) {
    try {
      const response = await drive.files.get(
        { fileId: uploadData.driveFileId, alt: "media" },
        { responseType: "arraybuffer" }
      );
      return {
        buffer: Buffer.from(response.data as ArrayBuffer),
        fileName: uploadData.fileName || "material.pdf",
        mimeType: uploadData.mimeType || "application/pdf",
        status: uploadData.status || "approved",
        uploaderUid: uploadData.uploaderUid || ""
      };
    } catch (e) {
      console.warn("[DriveProxy] Failed to retrieve from Google Drive:", e);
    }
  }

  return null;
}
