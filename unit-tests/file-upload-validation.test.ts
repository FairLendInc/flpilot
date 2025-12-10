import { describe, expect, test } from "vitest";

// ============================================================================
// File Upload Validation Logic Tests
// ============================================================================

/**
 * File type validation rules
 * These are the actual validation rules from convex/deals.ts:recordFundTransferUpload
 */
const ALLOWED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg"];

function isValidFileType(fileType: string): boolean {
	return ALLOWED_FILE_TYPES.includes(fileType);
}

function validateFileType(fileType: string): {
	valid: boolean;
	error?: string;
} {
	if (!fileType) {
		return { valid: false, error: "File type is required" };
	}

	if (!isValidFileType(fileType)) {
		return {
			valid: false,
			error: "Invalid file type. Only PDF, PNG, and JPEG are allowed.",
		};
	}

	return { valid: true };
}

function getFileExtension(fileName: string): string {
	const parts = fileName.split(".");
	// biome-ignore lint/style/noNonNullAssertion: Verified by length check
	return parts.length > 1 ? parts.at(-1)!.toLowerCase() : "";
}

function isValidFileName(fileName: string): boolean {
	// Must have a file extension
	if (!fileName.includes(".")) return false;

	// Must not be empty
	if (fileName.trim() === "") return false;

	// Must have content before the extension
	const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf("."));
	const extension = fileName.substring(fileName.lastIndexOf(".") + 1);

	return nameWithoutExtension.length > 0 && extension.length > 0;
}

// ============================================================================
// File Type Validation Tests
// ============================================================================

describe("File Type Validation", () => {
	test("should accept PDF files", () => {
		expect(isValidFileType("application/pdf")).toBe(true);
	});

	test("should accept PNG images", () => {
		expect(isValidFileType("image/png")).toBe(true);
	});

	test("should accept JPEG images", () => {
		expect(isValidFileType("image/jpeg")).toBe(true);
	});

	test("should reject non-standard JPG mime type", () => {
		expect(isValidFileType("image/jpg")).toBe(false);
	});

	test("should reject Word documents", () => {
		expect(
			isValidFileType(
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
			)
		).toBe(false);
	});

	test("should reject text files", () => {
		expect(isValidFileType("text/plain")).toBe(false);
	});

	test("should reject Excel files", () => {
		expect(
			isValidFileType(
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			)
		).toBe(false);
	});

	test("should reject HTML files", () => {
		expect(isValidFileType("text/html")).toBe(false);
	});

	test("should reject executable files", () => {
		expect(isValidFileType("application/x-msdownload")).toBe(false);
	});

	test("should reject ZIP archives", () => {
		expect(isValidFileType("application/zip")).toBe(false);
	});

	test("should reject video files", () => {
		expect(isValidFileType("video/mp4")).toBe(false);
	});

	test("should reject audio files", () => {
		expect(isValidFileType("audio/mpeg")).toBe(false);
	});

	test("should be case-sensitive for MIME types", () => {
		expect(isValidFileType("APPLICATION/PDF")).toBe(false);
		expect(isValidFileType("Image/PNG")).toBe(false);
	});
});

// ============================================================================
// File Type Validation with Error Messages
// ============================================================================

describe("validateFileType", () => {
	test("should return valid for PDF", () => {
		const result = validateFileType("application/pdf");
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	test("should return valid for PNG", () => {
		const result = validateFileType("image/png");
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	test("should return error for invalid type", () => {
		const result = validateFileType("text/plain");
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
		expect(result.error).toContain("Invalid file type");
	});

	test("should return error for empty file type", () => {
		const result = validateFileType("");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("File type is required");
	});

	test("should return specific error message for disallowed types", () => {
		const result = validateFileType("application/msword");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("Only PDF, PNG, and JPEG are allowed");
	});
});

// ============================================================================
// File Name Validation Tests
// ============================================================================

describe("File Name Validation", () => {
	test("should accept valid PDF file names", () => {
		expect(isValidFileName("transfer_proof.pdf")).toBe(true);
		expect(isValidFileName("document.pdf")).toBe(true);
		expect(isValidFileName("payment-receipt.pdf")).toBe(true);
	});

	test("should accept valid image file names", () => {
		expect(isValidFileName("screenshot.png")).toBe(true);
		expect(isValidFileName("receipt.jpg")).toBe(true);
		expect(isValidFileName("proof.jpeg")).toBe(true);
	});

	test("should accept file names with spaces", () => {
		expect(isValidFileName("transfer proof.pdf")).toBe(true);
		expect(isValidFileName("bank receipt 2024.png")).toBe(true);
	});

	test("should accept file names with numbers", () => {
		expect(isValidFileName("receipt_001.pdf")).toBe(true);
		expect(isValidFileName("2024-01-15-transfer.png")).toBe(true);
	});

	test("should accept file names with special characters", () => {
		expect(isValidFileName("receipt-final_v2.pdf")).toBe(true);
		expect(isValidFileName("transfer(1).png")).toBe(true);
	});

	test("should reject file names without extension", () => {
		expect(isValidFileName("document")).toBe(false);
		expect(isValidFileName("receipt")).toBe(false);
	});

	test("should reject empty file names", () => {
		expect(isValidFileName("")).toBe(false);
		expect(isValidFileName(" ")).toBe(false);
	});

	test("should reject file names that are just an extension", () => {
		expect(isValidFileName(".pdf")).toBe(false);
		expect(isValidFileName(".png")).toBe(false);
	});

	test("should handle file names with multiple dots", () => {
		expect(isValidFileName("document.final.pdf")).toBe(true);
		expect(isValidFileName("receipt.2024.01.15.png")).toBe(true);
	});
});

// ============================================================================
// File Extension Tests
// ============================================================================

describe("File Extension Extraction", () => {
	test("should extract PDF extension", () => {
		expect(getFileExtension("document.pdf")).toBe("pdf");
	});

	test("should extract PNG extension", () => {
		expect(getFileExtension("image.png")).toBe("png");
	});

	test("should extract JPEG extension", () => {
		expect(getFileExtension("photo.jpeg")).toBe("jpeg");
	});

	test("should extract JPG extension", () => {
		expect(getFileExtension("picture.jpg")).toBe("jpg");
	});

	test("should be case-insensitive", () => {
		expect(getFileExtension("document.PDF")).toBe("pdf");
		expect(getFileExtension("image.PNG")).toBe("png");
	});

	test("should handle file names with multiple dots", () => {
		expect(getFileExtension("document.final.pdf")).toBe("pdf");
		expect(getFileExtension("archive.tar.gz")).toBe("gz");
	});

	test("should return empty string for files without extension", () => {
		expect(getFileExtension("document")).toBe("");
		expect(getFileExtension("README")).toBe("");
	});

	test("should handle hidden files", () => {
		expect(getFileExtension(".gitignore")).toBe("gitignore");
		expect(getFileExtension(".env.local")).toBe("local");
	});
});

// ============================================================================
// File Size Validation Tests (Constants and Logic)
// ============================================================================

describe("File Size Validation Constants", () => {
	const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

	function isValidFileSize(sizeInBytes: number): boolean {
		return sizeInBytes > 0 && sizeInBytes <= MAX_FILE_SIZE_BYTES;
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return "0 Bytes";

		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
	}

	test("should accept files under 10MB", () => {
		expect(isValidFileSize(1024)).toBe(true); // 1KB
		expect(isValidFileSize(1024 * 1024)).toBe(true); // 1MB
		expect(isValidFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
		expect(isValidFileSize(9 * 1024 * 1024)).toBe(true); // 9MB
	});

	test("should accept files exactly 10MB", () => {
		expect(isValidFileSize(10 * 1024 * 1024)).toBe(true);
	});

	test("should reject files over 10MB", () => {
		expect(isValidFileSize(11 * 1024 * 1024)).toBe(false);
		expect(isValidFileSize(100 * 1024 * 1024)).toBe(false);
	});

	test("should reject zero-byte files", () => {
		expect(isValidFileSize(0)).toBe(false);
	});

	test("should reject negative file sizes", () => {
		expect(isValidFileSize(-1)).toBe(false);
		expect(isValidFileSize(-1024)).toBe(false);
	});

	test("should format file sizes correctly", () => {
		expect(formatFileSize(0)).toBe("0 Bytes");
		expect(formatFileSize(1024)).toBe("1 KB");
		expect(formatFileSize(1024 * 1024)).toBe("1 MB");
		expect(formatFileSize(1536 * 1024)).toBe("1.5 MB");
		expect(formatFileSize(10 * 1024 * 1024)).toBe("10 MB");
	});
});

// ============================================================================
// Upload Validation Edge Cases
// ============================================================================

describe("Upload Validation Edge Cases", () => {
	test("should handle missing file type", () => {
		const result = validateFileType("");
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
	});

	test("should handle null-like file types", () => {
		const result1 = validateFileType("undefined");
		const result2 = validateFileType("null");

		expect(result1.valid).toBe(false);
		expect(result2.valid).toBe(false);
	});

	test("should handle malformed MIME types", () => {
		expect(isValidFileType("pdf")).toBe(false);
		expect(isValidFileType("image")).toBe(false);
		expect(isValidFileType("application/")).toBe(false);
		expect(isValidFileType("/pdf")).toBe(false);
	});

	test("should handle uncommon but valid MIME types", () => {
		// These should still be rejected as they're not in our allowed list
		expect(isValidFileType("image/webp")).toBe(false);
		expect(isValidFileType("application/pdf;charset=utf-8")).toBe(false);
	});

	test("should validate file names with Unicode characters", () => {
		expect(isValidFileName("receipt_日本語.pdf")).toBe(true);
		expect(isValidFileName("überweisung.pdf")).toBe(true);
		expect(isValidFileName("reçu.pdf")).toBe(true);
	});

	test("should handle very long file names", () => {
		const longName = `${"a".repeat(250)}.pdf`;
		expect(isValidFileName(longName)).toBe(true);
	});

	test("should handle file names with only dots", () => {
		expect(isValidFileName("...")).toBe(false);
		expect(isValidFileName("..")).toBe(false);
	});
});

// ============================================================================
// Combined Validation Workflow
// ============================================================================

describe("Complete Upload Validation Workflow", () => {
	type UploadValidation = {
		fileName: string;
		fileType: string;
		fileSize: number;
	};

	function validateUpload(upload: UploadValidation): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		// Validate file name
		if (!isValidFileName(upload.fileName)) {
			errors.push("Invalid file name");
		}

		// Validate file type
		const typeValidation = validateFileType(upload.fileType);
		if (!typeValidation.valid && typeValidation.error) {
			errors.push(typeValidation.error);
		}

		// Validate file size (using 10MB limit)
		const MAX_SIZE = 10 * 1024 * 1024;
		if (upload.fileSize <= 0) {
			errors.push("File cannot be empty");
		} else if (upload.fileSize > MAX_SIZE) {
			errors.push("File size exceeds 10MB limit");
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	test("should validate a complete valid upload", () => {
		const result = validateUpload({
			fileName: "transfer_proof.pdf",
			fileType: "application/pdf",
			fileSize: 2 * 1024 * 1024, // 2MB
		});

		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	test("should collect multiple validation errors", () => {
		const result = validateUpload({
			fileName: ".pdf", // Invalid name
			fileType: "text/plain", // Invalid type
			fileSize: 15 * 1024 * 1024, // Over size limit
		});

		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(1);
	});

	test("should validate PNG uploads", () => {
		const result = validateUpload({
			fileName: "screenshot.png",
			fileType: "image/png",
			fileSize: 1024 * 1024, // 1MB
		});

		expect(result.valid).toBe(true);
	});

	test("should validate JPEG uploads", () => {
		const result = validateUpload({
			fileName: "receipt.jpg",
			fileType: "image/jpeg",
			fileSize: 500 * 1024, // 500KB
		});

		expect(result.valid).toBe(true);
	});

	test("should reject uploads with invalid file type", () => {
		const result = validateUpload({
			fileName: "document.docx",
			fileType:
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			fileSize: 1024 * 1024,
		});

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("Invalid file type"))).toBe(
			true
		);
	});

	test("should reject uploads that are too large", () => {
		const result = validateUpload({
			fileName: "large_file.pdf",
			fileType: "application/pdf",
			fileSize: 50 * 1024 * 1024, // 50MB
		});

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("exceeds 10MB"))).toBe(true);
	});

	test("should reject empty files", () => {
		const result = validateUpload({
			fileName: "empty.pdf",
			fileType: "application/pdf",
			fileSize: 0,
		});

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("empty"))).toBe(true);
	});
});
