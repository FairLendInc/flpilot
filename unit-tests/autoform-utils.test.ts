import { describe, expect, it } from "vitest";
import { z } from "zod";
import { getBaseSchema } from "@/components/ui/auto-form/utils";
import { getUrlFromString } from "@/lib/tiptap-utils";

describe("auto-form utils", () => {
	it("unwraps optional and nullable schemas", () => {
		const schema = z.string().optional().nullable();
		const base = getBaseSchema(schema);
		expect(base).toBeInstanceOf(z.ZodString);
	});

	it("unwraps pipe schemas", () => {
		const schema = z.string().pipe(z.string());
		const base = getBaseSchema(schema);
		expect(base).toBeInstanceOf(z.ZodString);
	});
});

describe("getUrlFromString", () => {
	it("returns null when input is not a url", () => {
		expect(getUrlFromString("not a url")).toBeNull();
	});

	it("returns an https url for domain-like input", () => {
		expect(getUrlFromString("example.com")).toBe("https://example.com/");
	});
});
