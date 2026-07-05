// Verifies api2cli skill fragment compilation into generated AgentSkills.
import { describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileSkillInstructions } from "./skill-compiler.js";

const withTempDir = (fn: (dir: string) => void): void => {
	const dir = mkdtempSync(join(tmpdir(), "api2cli-skill-compiler-test-"));
	try {
		fn(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
};

const writeSkill = (dir: string, content = "# example-cli\n\nAlways pass `--json`.\n"): void => {
	const skillDir = join(dir, ".agent-sync", "skills", "example-cli");
	mkdirSync(skillDir, { recursive: true });
	writeFileSync(join(skillDir, "SKILL.md"), content);
};

const writeFragment = (dir: string, name: string, content: string): void => {
	const sourceDir = join(dir, ".api2cli", "skill");
	mkdirSync(sourceDir, { recursive: true });
	writeFileSync(join(sourceDir, name), content);
};

const readSkill = (dir: string): string => {
	return readFileSync(join(dir, ".agent-sync", "skills", "example-cli", "SKILL.md"), "utf-8");
};

describe("compileSkillInstructions", () => {
	it("should inject instruction.md into a skill without an existing managed block", () => {
		withTempDir((dir) => {
			writeSkill(dir);
			writeFragment(dir, "instruction.md", "## Add Tool\n\nUse `tools auto-fill` first.\n");

			const result = compileSkillInstructions(dir, "example");

			expect(result).toEqual({ compiled: true, fragmentCount: 1 });
			expect(readSkill(dir)).toContain("<!-- api2cli:custom-instructions:start -->");
			expect(readSkill(dir)).toContain("## Custom Instructions");
			expect(readSkill(dir)).toContain("## Add Tool\n\nUse `tools auto-fill` first.");
			expect(readSkill(dir)).toContain("Always pass `--json`.");
		});
	});

	it("should replace an existing managed block without duplicating fragments", () => {
		withTempDir((dir) => {
			writeSkill(
				dir,
				"# example-cli\n\n<!-- api2cli:custom-instructions:start -->\nold\n<!-- api2cli:custom-instructions:end -->\n\nAlways pass `--json`.\n",
			);
			writeFragment(dir, "instruction.md", "new\n");

			compileSkillInstructions(dir, "example");
			compileSkillInstructions(dir, "example");

			const skill = readSkill(dir);
			expect(skill.match(/new/g)?.length).toBe(1);
			expect(skill).not.toContain("old");
		});
	});

	it("should preserve dollar sequences when replacing an existing managed block", () => {
		withTempDir((dir) => {
			writeSkill(
				dir,
				"# example-cli\n\n<!-- api2cli:custom-instructions:start -->\nold\n<!-- api2cli:custom-instructions:end -->\n\nTail content.\n",
			);
			writeFragment(dir, "instruction.md", "Use bash `$'\\n'` and regex `$&` literally.\n");

			compileSkillInstructions(dir, "example");
			compileSkillInstructions(dir, "example");

			const skill = readSkill(dir);
			expect(skill).toContain("Use bash `$'\\n'` and regex `$&` literally.");
			expect(skill).not.toContain("Tail content.'");
			expect(skill.match(/api2cli:custom-instructions:start/g)?.length).toBe(1);
		});
	});

	it("should keep the managed block separated from surrounding skill content when replacing it", () => {
		withTempDir((dir) => {
			writeSkill(
				dir,
				"# example-cli\n\nAlways pass `--json`.\n\n<!-- api2cli:custom-instructions:start -->\nold\n<!-- api2cli:custom-instructions:end -->\n",
			);
			writeFragment(dir, "instruction.md", "new\n");

			compileSkillInstructions(dir, "example");

			expect(readSkill(dir)).toContain("Always pass `--json`.\n\n<!-- api2cli:custom-instructions:start -->");
		});
	});

	it("should ignore empty fragments, non-markdown files, and subdirectories", () => {
		withTempDir((dir) => {
			writeSkill(dir);
			writeFragment(dir, "instruction.md", "   \n");
			writeFragment(dir, "notes.txt", "ignore me");
			mkdirSync(join(dir, ".api2cli", "skill", "nested"));
			writeFileSync(join(dir, ".api2cli", "skill", "nested", "workflow.md"), "ignore nested");

			const result = compileSkillInstructions(dir, "example");

			expect(result).toEqual({ compiled: false, fragmentCount: 0 });
			expect(readSkill(dir)).not.toContain("api2cli:custom-instructions:start");
		});
	});

	it("should compile instruction.md before other markdown files in alphabetical order", () => {
		withTempDir((dir) => {
			writeSkill(dir);
			writeFragment(dir, "zeta.md", "zeta");
			writeFragment(dir, "alpha.md", "alpha");
			writeFragment(dir, "instruction.md", "instruction");

			compileSkillInstructions(dir, "example");

			const skill = readSkill(dir);
			expect(skill.indexOf("instruction")).toBeLessThan(skill.indexOf("alpha"));
			expect(skill.indexOf("alpha")).toBeLessThan(skill.indexOf("zeta"));
		});
	});

	it("should remove an existing managed block when all fragments become empty", () => {
		withTempDir((dir) => {
			writeSkill(
				dir,
				"# example-cli\n\n<!-- api2cli:custom-instructions:start -->\nold\n<!-- api2cli:custom-instructions:end -->\n\nAlways pass `--json`.\n",
			);
			writeFragment(dir, "instruction.md", "\n");

			const result = compileSkillInstructions(dir, "example");

			expect(result).toEqual({ compiled: false, fragmentCount: 0 });
			expect(readSkill(dir)).toBe("# example-cli\n\nAlways pass `--json`.\n");
		});
	});

	it("should leave the skill unchanged when no source directory exists", () => {
		withTempDir((dir) => {
			writeSkill(dir);
			const before = readSkill(dir);

			const result = compileSkillInstructions(dir, "example");

			expect(result).toEqual({ compiled: false, fragmentCount: 0 });
			expect(readSkill(dir)).toBe(before);
		});
	});

	it("should return skipped when no generated skill exists", () => {
		withTempDir((dir) => {
			writeFragment(dir, "instruction.md", "instruction");

			const result = compileSkillInstructions(dir, "example");

			expect(result).toEqual({ compiled: false, fragmentCount: 0 });
			expect(existsSync(join(dir, ".agent-sync", "skills", "example-cli", "SKILL.md"))).toBe(false);
		});
	});
});
