import { describe, expect, it } from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readlinkSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const runLink = (dir: string, ccHub: "missing" | "failed" = "missing") => {
	// Isolate module mocks in a subprocess so the rest of the native suite uses real modules.
	const result = Bun.spawnSync(
		[
			process.execPath,
			"--eval",
			`
import { mock } from "bun:test";
import { join } from "node:path";
const dir = ${JSON.stringify(dir)};
const cliRoot = join(dir, ".cli");
mock.module(${JSON.stringify(join(import.meta.dir, "../lib/config.ts"))}, () => ({
  CLI_ROOT: cliRoot,
  getCliDir: (app) => join(cliRoot, app + "-cli"),
  getDistDir: (app) => join(cliRoot, app + "-cli", "dist"),
}));
mock.module(${JSON.stringify(join(import.meta.dir, "../lib/shell.ts"))}, () => ({ addToPath: () => {} }));
const agentSync = await import(${JSON.stringify(join(import.meta.dir, "../lib/agent-sync.ts"))});
mock.module(${JSON.stringify(join(import.meta.dir, "../lib/agent-sync.ts"))}, () => ({
  ...agentSync,
  GLOBAL_PROVIDER_SKILL_DIRS: [join(dir, "claude"), join(dir, "codex")],
  isCcHubAvailable: () => ${ccHub === "failed"},
  linkAgentSyncSkill: async () => false,
}));
const { linkCommand } = await import(${JSON.stringify(join(import.meta.dir, "link.ts"))});
await linkCommand.parseAsync(["bun", "api2cli", "example"]);
`,
		],
		{ stdout: "pipe", stderr: "pipe" },
	);
	return {
		exitCode: result.exitCode,
		output: new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
	};
};

const withFixture = (fn: (dir: string, source: string) => void, withSkill = true): void => {
	const dir = mkdtempSync(join(tmpdir(), "api2cli-link-test-"));
	try {
		const cli = join(dir, ".cli", "example-cli");
		mkdirSync(cli, { recursive: true });
		const source = join(cli, ".agent-sync", "skills", "example-cli");
		if (withSkill) {
			mkdirSync(source, { recursive: true });
			writeFileSync(join(source, "SKILL.md"), "# Example\n");
		}
		for (const provider of ["claude", "codex"]) mkdirSync(join(dir, provider));
		fn(dir, source);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
};

describe("link without cc-hub", () => {
	it("replaces dangling links in both provider roots", () => {
		withFixture((dir, source) => {
			for (const provider of ["claude", "codex"]) {
				symlinkSync(join(dir, "missing-source"), join(dir, provider, "example-cli"));
			}
			const result = runLink(dir);
			expect(result.output).toContain("cc-hub not found on PATH");
			expect(result.output).not.toContain("EEXIST");
			expect(result.exitCode).toBe(0);
			for (const provider of ["claude", "codex"]) {
				expect(readlinkSync(join(dir, provider, "example-cli"))).toBe(source);
				expect(readFileSync(join(dir, provider, "example-cli", "SKILL.md"), "utf-8")).toBe("# Example\n");
			}
		});
	});

	it("creates missing links and relinks healthy links on repeated calls", () => {
		withFixture((dir, source) => {
			expect(runLink(dir).exitCode).toBe(0);
			expect(runLink(dir).exitCode).toBe(0);
			for (const provider of ["claude", "codex"]) {
				expect(readlinkSync(join(dir, provider, "example-cli"))).toBe(source);
			}
		});
	});

	it("preserves real directories and files at provider targets", () => {
		withFixture((dir) => {
			const directory = join(dir, "claude", "example-cli");
			mkdirSync(directory);
			writeFileSync(join(directory, "SKILL.md"), "keep directory");
			const file = join(dir, "codex", "example-cli");
			writeFileSync(file, "keep file");
			expect(runLink(dir).exitCode).toBe(0);
			expect(readFileSync(join(directory, "SKILL.md"), "utf-8")).toBe("keep directory");
			expect(readFileSync(file, "utf-8")).toBe("keep file");
		});
	});

	it("skips a missing skill without touching provider targets", () => {
		withFixture((dir) => {
			const stale = join(dir, "claude", "example-cli");
			const missing = join(dir, "missing-source");
			symlinkSync(missing, stale);
			const result = runLink(dir);
			expect(result.exitCode).toBe(0);
			expect(result.output).toContain("No SKILL.md found");
			expect(readlinkSync(stale)).toBe(missing);
			expect(existsSync(join(dir, "codex", "example-cli"))).toBe(false);
		}, false);
	});

	it("fails when an installed cc-hub fails without entering the fallback", () => {
		withFixture((dir) => {
			const result = runLink(dir, "failed");
			expect(result.exitCode).toBe(1);
			expect(result.output).toContain("cc-hub failed to link");
			expect(result.output).not.toContain("cc-hub not found");
			for (const provider of ["claude", "codex"]) {
				expect(existsSync(join(dir, provider, "example-cli"))).toBe(false);
			}
		});
	});
});
