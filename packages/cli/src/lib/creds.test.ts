import { describe, expect, it } from "bun:test";
import { maskToken } from "./creds.js";

describe("maskToken", () => {
	it("should mask short tokens with stars only", () => {
		expect(maskToken("")).toBe("****");
		expect(maskToken("abc")).toBe("****");
		expect(maskToken("12345678")).toBe("****");
	});

	it("should keep first 4 and last 4 characters of long tokens", () => {
		expect(maskToken("abcdefghi")).toBe("abcd...fghi");
		expect(maskToken("sk-live-1234567890abcdef")).toBe("sk-l...cdef");
	});
});
