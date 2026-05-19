// Verifies .agent-sync skill migration and cc-hub provider linking helpers.
import { describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	ensureAgentSyncSkillSource,
	getAgentSyncSkillDir,
	linkAgentSyncSkill,
	removeLegacyProviderTargets,
} from "./agent-sync.js";

/** Creates one temporary directory for a test and always removes it in finally. */
const withTempDir = (fn: (dir: string) => void): void => {
	const dir = mkdtempSync(join(tmpdir(), "api2cli-agent-sync-test-"));
	try {
		fn(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
};

describe("getAgentSyncSkillDir", () => {
	it("should resolve the canonical generated skill source under .agent-sync", () => {
		expect(getAgentSyncSkillDir("/tmp/example-cli", "example")).toBe("/tmp/example-cli/.agent-sync/skills/example-cli");
	});

	it("should reject app names that could escape generated paths", () => {
		expect(() => getAgentSyncSkillDir("/tmp/example-cli", "../example")).toThrow("Invalid app name");
	});
});

describe("ensureAgentSyncSkillSource", () => {
	it("should keep an existing .agent-sync skill source as canonical", () => {
		withTempDir((dir) => {
			const canonical = join(dir, ".agent-sync", "skills", "example-cli");
			mkdirSync(canonical, { recursive: true });
			writeFileSync(join(canonical, "SKILL.md"), "canonical");

			const result = ensureAgentSyncSkillSource(dir, "example");
			if (!result) throw new Error("Expected canonical skill source");

			expect(result).toBe(canonical);
			expect(readFileSync(join(result, "SKILL.md"), "utf-8")).toBe("canonical");
		});
	});

	it("should migrate a legacy skills directory into .agent-sync", () => {
		withTempDir((dir) => {
			const legacy = join(dir, "skills", "example-cli");
			mkdirSync(join(legacy, "references"), { recursive: true });
			writeFileSync(join(legacy, "SKILL.md"), "legacy");
			writeFileSync(join(legacy, "references", "commands.md"), "commands");

			const result = ensureAgentSyncSkillSource(dir, "example");
			if (!result) throw new Error("Expected migrated skill source");

			expect(result).toBe(join(dir, ".agent-sync", "skills", "example-cli"));
			expect(readFileSync(join(result, "SKILL.md"), "utf-8")).toBe("legacy");
			expect(readFileSync(join(result, "references", "commands.md"), "utf-8")).toBe("commands");
			expect(existsSync(legacy)).toBe(false);
		});
	});

	it("should remove a legacy skills root that only contains macOS metadata", () => {
		withTempDir((dir) => {
			const legacyRoot = join(dir, "skills");
			const legacy = join(legacyRoot, "example-cli");
			mkdirSync(legacy, { recursive: true });
			writeFileSync(join(legacy, "SKILL.md"), "legacy");
			writeFileSync(join(legacyRoot, ".DS_Store"), "metadata");

			const result = ensureAgentSyncSkillSource(dir, "example");

			expect(result).toBe(join(dir, ".agent-sync", "skills", "example-cli"));
			expect(existsSync(legacyRoot)).toBe(false);
		});
	});

	it("should return null when no generated skill exists", () => {
		withTempDir((dir) => {
			expect(ensureAgentSyncSkillSource(dir, "missing")).toBeNull();
		});
	});
});

describe("linkAgentSyncSkill", () => {
	it("should invoke cc-hub for global Claude and Codex provider links", async () => {
		const calls: string[][] = [];

		const linked = await linkAgentSyncSkill("/tmp/example-cli/.agent-sync/skills/example-cli", "example", {
			spawn: async (args) => {
				calls.push(args);
				return { exitCode: 0, stderr: "" };
			},
		});

		expect(linked).toBe(true);
		expect(calls).toEqual([
			[
				"cc-hub",
				"skill",
				"link",
				"/tmp/example-cli/.agent-sync/skills/example-cli",
				"--scope",
				"global",
				"--targets",
				"all",
				"--name",
				"example-cli",
				"--force",
			],
		]);
	});

	it("should return false when cc-hub cannot link the skill", async () => {
		const linked = await linkAgentSyncSkill("/tmp/example-cli/.agent-sync/skills/example-cli", "example", {
			spawn: async () => ({ exitCode: 1, stderr: "failed" }),
		});

		expect(linked).toBe(false);
	});
});

describe("removeLegacyProviderTargets", () => {
	it("should preserve existing provider directories before cc-hub relinking", () => {
		withTempDir((dir) => {
			const providerRoot = join(dir, "provider");
			const target = join(providerRoot, "example-cli");
			mkdirSync(target, { recursive: true });
			writeFileSync(join(target, "SKILL.md"), "legacy");

			const removed = removeLegacyProviderTargets("example", [providerRoot]);

			expect(removed).toEqual([]);
			expect(existsSync(target)).toBe(true);
		});
	});

	it("should remove existing provider symlinks before cc-hub relinking", () => {
		withTempDir((dir) => {
			const providerRoot = join(dir, "provider");
			const source = join(dir, "source");
			mkdirSync(providerRoot, { recursive: true });
			mkdirSync(source, { recursive: true });
			symlinkSync(source, join(providerRoot, "example-cli"));

			const removed = removeLegacyProviderTargets("example", [providerRoot]);

			expect(removed).toEqual([join(providerRoot, "example-cli")]);
			expect(existsSync(join(providerRoot, "example-cli"))).toBe(false);
		});
	});
});
