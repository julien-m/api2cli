import { describe, expect, it } from "bun:test";
import { getAppName, parseGithubInput } from "./install.js";

describe("parseGithubInput", () => {
	it("should parse owner/repo shorthand", () => {
		expect(parseGithubInput("julien-m/typefully-cli")).toEqual({
			owner: "julien-m",
			repo: "typefully-cli",
		});
	});

	it("should parse https github URL", () => {
		expect(parseGithubInput("https://github.com/julien-m/typefully-cli")).toEqual({
			owner: "julien-m",
			repo: "typefully-cli",
		});
	});

	it("should strip .git suffix and trailing slash", () => {
		expect(parseGithubInput("https://github.com/julien-m/typefully-cli.git/")).toEqual({
			owner: "julien-m",
			repo: "typefully-cli",
		});
	});

	it("should return null for inputs that are not a github reference", () => {
		expect(parseGithubInput("typefully")).toBeNull();
		expect(parseGithubInput("not a repo")).toBeNull();
	});
});

describe("getAppName", () => {
	it("should strip the -cli suffix when present", () => {
		expect(getAppName("typefully-cli")).toBe("typefully");
	});

	it("should leave a name without -cli suffix unchanged", () => {
		expect(getAppName("typefully")).toBe("typefully");
	});
});
