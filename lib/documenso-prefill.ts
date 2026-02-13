import { z } from "zod";
import type { DocumensoTemplateField, PrefillField } from "./types/documenso";

const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g;

/**
 * Registry of known placeholder keys with human-readable labels.
 * Unknown placeholders are still supported — they get auto-generated labels.
 */
const PLACEHOLDER_REGISTRY: Record<string, { label: string }> = {
	property_address: { label: "Property Address" },
	mortgage_principle: { label: "Mortgage Principal" },
	mortgage_term: { label: "Mortgage Term" },
	borrower_name: { label: "Borrower Name" },
	lender_name: { label: "Lender Name" },
	broker_name: { label: "Broker Name" },
};

/**
 * A unique placeholder found across template fields.
 * Multiple field IDs may share the same placeholder key, potentially with different field types.
 */
export type ExtractedPlaceholder = {
	key: string;
	label: string;
	fieldIds: { id: number; type: string }[];
};

/**
 * Extract unique {{placeholder}} variables from template fields of any type.
 * De-duplicates by placeholder key and collects all matching field IDs with their types.
 */
export function extractPlaceholders(
	fields: DocumensoTemplateField[],
): ExtractedPlaceholder[] {
	const placeholderMap = new Map<string, ExtractedPlaceholder>();

	for (const field of fields) {
		if (!field.fieldMeta?.placeholder) continue;

		const matches = field.fieldMeta.placeholder.matchAll(PLACEHOLDER_REGEX);
		for (const match of matches) {
			const key = match[1].trim();
			const existing = placeholderMap.get(key);

			if (existing) {
				if (!existing.fieldIds.some((f) => f.id === field.id)) {
					existing.fieldIds.push({ id: field.id, type: field.type });
				}
			} else {
				const registry = PLACEHOLDER_REGISTRY[key];
				placeholderMap.set(key, {
					key,
					label: registry?.label ?? formatPlaceholderLabel(key),
					fieldIds: [{ id: field.id, type: field.type }],
				});
			}
		}
	}

	return Array.from(placeholderMap.values());
}

/**
 * Convert snake_case key to Title Case label.
 */
function formatPlaceholderLabel(key: string): string {
	return key
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * Build a Zod schema from extracted placeholders for use with AutoForm.
 */
export function buildPrefillSchema(
	placeholders: ExtractedPlaceholder[],
): z.ZodObject<Record<string, z.ZodString>> {
	const shape: Record<string, z.ZodString> = {};
	for (const p of placeholders) {
		shape[p.key] = z.string().describe(p.label);
	}
	return z.object(shape);
}

/**
 * Deal data shape expected by the auto-fill function.
 */
export type DealDataForPrefill = {
	deal: { brokerName?: string };
	mortgage?: {
		address: {
			street: string;
			city: string;
			state: string;
			zip: string;
			country: string;
		};
		loanAmount: number;
		originationDate: string;
		maturityDate: string;
	} | null;
	borrower?: { name: string } | null;
	investor?: { first_name?: string; last_name?: string } | null;
};

/**
 * Auto-fill values for known placeholders from deal data.
 * Returns a partial record — only keys with available data are included.
 */
export function getAutoFillValues(
	dealData: DealDataForPrefill,
): Record<string, string> {
	const values: Record<string, string> = {};

	if (dealData.mortgage) {
		const { address, loanAmount, originationDate, maturityDate } =
			dealData.mortgage;
		values.property_address = [
			address.street,
			address.city,
			`${address.state} ${address.zip}`,
		]
			.filter(Boolean)
			.join(", ");
		values.mortgage_principle = new Intl.NumberFormat("en-CA", {
			style: "currency",
			currency: "CAD",
		}).format(loanAmount);
		values.mortgage_term = calculateTerm(originationDate, maturityDate);
	}

	if (dealData.borrower?.name) {
		values.borrower_name = dealData.borrower.name;
	}

	if (dealData.investor) {
		const name = [dealData.investor.first_name, dealData.investor.last_name]
			.filter(Boolean)
			.join(" ");
		if (name) {
			values.lender_name = name;
		}
	}

	if (dealData.deal.brokerName) {
		values.broker_name = dealData.deal.brokerName;
	}

	return values;
}

/**
 * Calculate a human-readable term string from origination and maturity dates.
 */
export function calculateTerm(
	originationDate: string,
	maturityDate: string,
): string {
	const start = new Date(originationDate);
	const end = new Date(maturityDate);
	const months =
		(end.getFullYear() - start.getFullYear()) * 12 +
		(end.getMonth() - start.getMonth());

	if (months <= 0) return "N/A";

	if (months >= 12) {
		const years = Math.floor(months / 12);
		const remaining = months % 12;
		if (remaining > 0) {
			return `${years} year${years > 1 ? "s" : ""}, ${remaining} month${remaining > 1 ? "s" : ""}`;
		}
		return `${years} year${years > 1 ? "s" : ""}`;
	}
	return `${months} month${months > 1 ? "s" : ""}`;
}

/**
 * Map Documenso field type (e.g. "TEXT", "NUMBER") to the prefill API type.
 */
function toPrefillType(fieldType: string): "text" | "number" {
	return fieldType.toUpperCase() === "NUMBER" ? "number" : "text";
}

/**
 * Expand user-entered placeholder values into a per-field-ID prefillFields array.
 * Handles one placeholder mapping to multiple field IDs (same placeholder on different pages).
 * Preserves each field's original type so the Documenso API receives the correct prefill type.
 */
export function buildPrefillFieldsPayload(
	placeholders: ExtractedPlaceholder[],
	values: Record<string, string>,
): PrefillField[] {
	const prefillFields: PrefillField[] = [];

	for (const placeholder of placeholders) {
		const value = values[placeholder.key];
		if (!value) continue;

		for (const field of placeholder.fieldIds) {
			prefillFields.push({
				id: field.id,
				type: toPrefillType(field.type),
				label: placeholder.label,
				placeholder: `{{${placeholder.key}}}`,
				value,
			});
		}
	}

	return prefillFields;
}
