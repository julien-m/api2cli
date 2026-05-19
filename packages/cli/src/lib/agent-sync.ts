// Manages generated api2cli AgentSkill migration and cc-hub provider linking.
import { spawn } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

interface SpawnResult {
	exitCode: number;
	stderr: string;
}

interface LinkAgentSyncSkillOptions {
	spawn?: (args: string[]) => Promise<SpawnResult>;
}

const CC_HUB_TIMEOUT_MS = 30_000;

/** Provider skill roots managed by cc-hub for global skills. */
export const GLOBAL_PROVIDER_SKILL_DIR_BY_PROVIDER = {
	claude: join(homedir(), ".claude", "skills"),
	codex: join(homedir(), ".agents", "skills"),
} as const;

/** Provider skill root paths used when removing stale provider symlinks. */
export const GLOBAL_PROVIDER_SKILL_DIRS = Object.values(GLOBAL_PROVIDER_SKILL_DIR_BY_PROVIDER);

/** Resolve the canonical generated skill source for an api2cli CLI. */
export function getAgentSyncSkillDir(cliDir: string, app: string): string {
	assertValidAppName(app);
	return join(cliDir, ".agent-sync", "skills", `${app}-cli`);
}

/** Resolve the pre-migration generated skill source path. */
export function getLegacySkillDir(cliDir: string, app: string): string {
	assertValidAppName(app);
	return join(cliDir, "skills", `${app}-cli`);
}

/** Return true when a directory contains a usable generated skill. */
export function hasSkillSource(skillDir: string): boolean {
	return existsSync(join(skillDir, "SKILL.md"));
}

/** Move an existing generated skill source under .agent-sync when needed. */
export function ensureAgentSyncSkillSource(cliDir: string, app: string): string | null {
	assertValidAppName(app);
	const canonical = getAgentSyncSkillDir(cliDir, app);
	if (hasSkillSource(canonical)) {
		removeEmptyLegacySkillsRoot(cliDir);
		return canonical;
	}

	const legacy = getLegacySkillDir(cliDir, app);
	if (!hasSkillSource(legacy)) return null;

	mkdirSync(dirname(canonical), { recursive: true });
	renameOrCopy(legacy, canonical);
	removeEmptyLegacySkillsRoot(cliDir);
	return canonical;
}

/** Remove stale provider symlinks before asking cc-hub to recreate them. */
export function removeLegacyProviderTargets(
	app: string,
	providerRoots: ReadonlyArray<string> = GLOBAL_PROVIDER_SKILL_DIRS,
): string[] {
	assertValidAppName(app);
	const removed: string[] = [];
	for (const providerRoot of providerRoots) {
		const target = join(providerRoot, `${app}-cli`);
		let stats: ReturnType<typeof lstatSync>;
		try {
			stats = lstatSync(target);
		} catch {
			continue;
		}
		if (!stats.isSymbolicLink()) continue;
		rmSync(target, { force: true });
		removed.push(target);
	}
	return removed;
}

/** Link a canonical skill source through cc-hub into all supported global providers. */
export async function linkAgentSyncSkill(
	skillDir: string,
	app: string,
	options: LinkAgentSyncSkillOptions = {},
): Promise<boolean> {
	assertValidAppName(app);
	const args = [
		"cc-hub",
		"skill",
		"link",
		skillDir,
		"--scope",
		"global",
		"--targets",
		"all",
		"--name",
		`${app}-cli`,
		"--force",
	];
	// cc-hub owns provider replacement: exit code 0 means Claude/Codex links were created; stderr is kept for callers.
	const result = await (options.spawn ?? spawnCommand)(args);
	return result.exitCode === 0;
}

async function spawnCommand(args: string[]): Promise<SpawnResult> {
	const [command, ...commandArgs] = args;
	if (!command) return { exitCode: 1, stderr: "missing command" };

	// Runs cc-hub without stdin/stdout, captures stderr, maps spawn failures/timeouts to exit code 1.
	return new Promise((resolve) => {
		const proc = spawn(command, commandArgs, {
			stdio: ["ignore", "ignore", "pipe"],
		});
		let stderr = "";
		let settled = false;
		const timeout = setTimeout(() => {
			if (settled) return;
			settled = true;
			proc.kill("SIGTERM");
			resolve({ exitCode: 1, stderr: "cc-hub timed out" });
		}, CC_HUB_TIMEOUT_MS);
		proc.stderr.setEncoding("utf-8");
		proc.stderr.on("data", (chunk: string) => {
			stderr += chunk;
		});
		proc.on("error", (error) => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			resolve({ exitCode: 1, stderr: error.message });
		});
		proc.on("close", (code) => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			resolve({ exitCode: code ?? 1, stderr });
		});
	});
}

function renameOrCopy(source: string, target: string): void {
	try {
		renameSync(source, target);
	} catch (error) {
		if (!isErrnoException(error) || error.code !== "EXDEV") throw error;
		cpSync(source, target, { recursive: true });
		rmSync(source, { recursive: true, force: true });
	}
}

function removeEmptyLegacySkillsRoot(cliDir: string): void {
	const legacyRoot = join(cliDir, "skills");
	try {
		const meaningfulEntries = readdirSync(legacyRoot).filter((entry) => entry !== ".DS_Store");
		if (meaningfulEntries.length === 0) {
			rmSync(legacyRoot, { recursive: true, force: true });
		}
	} catch {
		// Missing or unreadable legacy roots have no safe cleanup action.
		return;
	}
}

function assertValidAppName(app: string): void {
	// App names are lowercase slugs because they are embedded in generated filesystem paths.
	if (!/^[a-z0-9][a-z0-9-]*$/.test(app)) {
		throw new Error(`Invalid app name: ${app}`);
	}
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}
