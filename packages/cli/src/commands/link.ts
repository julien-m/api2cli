import { existsSync, lstatSync, mkdirSync, readdirSync, symlinkSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { ensureAgentSyncSkillSource, linkAgentSyncSkill } from "../lib/agent-sync.js";
import { CLI_ROOT, getCliDir, getDistDir } from "../lib/config.js";
import { addToPath } from "../lib/shell.js";

const AGENT_SKILL_DIRS: Record<string, string> = {
	claude: join(homedir(), ".claude", "skills"),
	cursor: join(homedir(), ".cursor", "skills"),
	openclaw: join(homedir(), ".openclaw", "workspace", "skills"),
};

function linkSkillToPath(app: string, skillsPath: string): void {
	const cliDir = getCliDir(app);
	const skillSourceDir = ensureAgentSyncSkillSource(cliDir, app);

	if (!skillSourceDir || !existsSync(join(skillSourceDir, "SKILL.md"))) {
		console.log(`  ${pc.dim("No SKILL.md found for")} ${app}-cli${pc.dim(", skipping skill link")}`);
		return;
	}

	mkdirSync(skillsPath, { recursive: true });
	const target = join(skillsPath, `${app}-cli`);

	if (existsSync(target)) {
		const stats = lstatSync(target);
		if (stats.isSymbolicLink()) {
			unlinkSync(target);
		} else {
			console.log(`  ${pc.yellow("~")} Skill target exists at ${pc.dim(target)}, skipping (not a symlink)`);
			return;
		}
	}
	symlinkSync(skillSourceDir, target);

	console.log(`${pc.green("+")} Skill linked ${pc.bold(`${app}-cli`)} -> ${pc.dim(target)}`);
}

async function linkSkillWithCcHub(app: string): Promise<boolean> {
	const cliDir = getCliDir(app);
	const skillSourceDir = ensureAgentSyncSkillSource(cliDir, app);

	if (!skillSourceDir) {
		console.log(`  ${pc.dim("No SKILL.md found for")} ${app}-cli${pc.dim(", skipping cc-hub skill link")}`);
		return true;
	}

	// cc-hub must exit 0 after creating provider links; any non-zero result fails this CLI command.
	const linked = await linkAgentSyncSkill(skillSourceDir, app);
	if (!linked) {
		console.error(`${pc.red("✗")} cc-hub failed to link ${app}-cli skill`);
		return false;
	}
	console.log(`${pc.green("+")} Skill linked through cc-hub ${pc.bold(`${app}-cli`)}`);
	return true;
}

export const linkCommand = new Command("link")
	.description("Add a CLI to your PATH and link its AgentSkill through cc-hub")
	.argument("[app]", "CLI to link (omit with --all)")
	.option("--all", "Link all installed CLIs")
	.option("--openclaw", "Also symlink skill to ~/.openclaw/workspace/skills/")
	.option("--skills-path <path>", "Custom path to symlink the skill into")
	.addHelpText(
		"after",
		`
Examples:
  api2cli link typefully
  api2cli link typefully --openclaw
  api2cli link typefully --skills-path ~/.openclaw/workspace/skills
  api2cli link --all --openclaw`,
	)
	.action(async (app: string | undefined, opts: { all?: boolean; openclaw?: boolean; skillsPath?: string }) => {
		const skillsPaths: string[] = [];
		if (opts.openclaw) skillsPaths.push(AGENT_SKILL_DIRS.openclaw!);
		if (opts.skillsPath) skillsPaths.push(opts.skillsPath.replace(/^~/, homedir()));

		if (opts.all || !app) {
			if (!existsSync(CLI_ROOT)) {
				console.log("No CLIs installed.");
				return;
			}
			const dirs = readdirSync(CLI_ROOT).filter((d) => d.endsWith("-cli"));
			let failed = false;
			for (const d of dirs) {
				const name = d.replace(/-cli$/, "");
				addToPath(name, getDistDir(name));
				const linked = await linkSkillWithCcHub(name);
				if (!linked) failed = true;
				for (const sp of skillsPaths) linkSkillToPath(name, sp);
			}
			// For --all, attempt every CLI before exiting non-zero if any cc-hub link failed.
			if (failed) process.exit(1);
			return;
		}

		if (!existsSync(getCliDir(app))) {
			console.error(`${pc.red("✗")} ${app}-cli not found. Run: ${pc.cyan(`api2cli create ${app}`)}`);
			process.exit(1);
		}

		addToPath(app, getDistDir(app));
		const linked = await linkSkillWithCcHub(app);
		if (!linked) process.exit(1);
		for (const sp of skillsPaths) linkSkillToPath(app, sp);
	});
