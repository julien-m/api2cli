import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { ensureAgentSyncSkillSource, linkAgentSyncSkill } from "../lib/agent-sync.js";
import { getCliDir, getDistDir } from "../lib/config.js";
import { addToPath } from "../lib/shell.js";

export function parseGithubInput(input: string): { owner: string; repo: string } | null {
	const cleaned = input
		.trim()
		.replace(/\/$/, "")
		.replace(/\.git$/, "");

	const shortMatch = cleaned.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
	if (shortMatch) return { owner: shortMatch[1]!, repo: shortMatch[2]! };

	const urlMatch = cleaned.match(/(?:https?:\/\/)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/);
	if (urlMatch) return { owner: urlMatch[1]!, repo: urlMatch[2]! };

	return null;
}

export function getAppName(repo: string): string {
	return repo.replace(/-cli$/, "");
}

const linkSkillThroughCcHub = async (cliDir: string, app: string): Promise<boolean> => {
	const skillSourceDir = ensureAgentSyncSkillSource(cliDir, app);
	if (!skillSourceDir) return true;

	const linked = await linkAgentSyncSkill(skillSourceDir, app);
	if (!linked) {
		console.error(`${pc.red("✗")} cc-hub failed to link ${app}-cli skill`);
		return false;
	}
	console.log(`  ${pc.green("+")} Skill linked through cc-hub`);
	return true;
};

export const installCommand = new Command("install")
	.description("Install a CLI from a GitHub repo")
	.argument("<source>", "GitHub repo (owner/repo or full URL)")
	.option("--force", "Overwrite existing CLI", false)
	.addHelpText(
		"after",
		`
Examples:
  api2cli install julien-m/typefully-cli
  api2cli install https://github.com/julien-m/typefully-cli`,
	)
	.action(async (source: string, opts: { force?: boolean }) => {
		const parsed = parseGithubInput(source);
		if (!parsed) {
			console.error(`${pc.red("✗")} Invalid source: ${source}`);
			console.error(`  Expected ${pc.cyan("owner/repo")} or a full GitHub URL.`);
			process.exit(1);
		}
		const { owner, repo } = parsed;

		const app = getAppName(repo);
		const appCli = `${app}-cli`;
		const cliDir = getCliDir(app);

		if (existsSync(cliDir) && !opts.force) {
			console.error(`${pc.red("✗")} ${appCli} already installed at ${cliDir}`);
			console.error(`  Use ${pc.cyan("--force")} to reinstall.`);
			process.exit(1);
		}

		console.log(`\n${pc.bold("Installing")} ${pc.cyan(appCli)} from ${pc.dim(`${owner}/${repo}`)}...\n`);

		// 1. Clone repo
		mkdirSync(cliDir, { recursive: true });
		const clone = Bun.spawn(["git", "clone", "--depth", "1", `https://github.com/${owner}/${repo}.git`, cliDir], {
			stdout: "ignore",
			stderr: "pipe",
		});
		const cloneCode = await clone.exited;
		if (cloneCode !== 0) {
			const stderr = await new Response(clone.stderr).text();
			// If dir exists (force), remove and retry
			if (opts.force) {
				Bun.spawn(["rm", "-rf", cliDir], { stdout: "ignore", stderr: "ignore" });
				await Bun.spawn(["rm", "-rf", cliDir]).exited;
				const retry = Bun.spawn(["git", "clone", "--depth", "1", `https://github.com/${owner}/${repo}.git`, cliDir], {
					stdout: "ignore",
					stderr: "pipe",
				});
				const retryCode = await retry.exited;
				if (retryCode !== 0) {
					const retryErr = await new Response(retry.stderr).text();
					console.error(`${pc.red("✗")} Clone failed: ${retryErr}`);
					process.exit(1);
				}
			} else {
				console.error(`${pc.red("✗")} Clone failed: ${stderr}`);
				process.exit(1);
			}
		}
		console.log(`  ${pc.green("+")} Cloned ${pc.dim(`${owner}/${repo}`)}`);

		// 2. Install dependencies
		console.log(`  ${pc.dim("Installing dependencies...")}`);
		const install = Bun.spawn(["bun", "install"], {
			cwd: cliDir,
			stdout: "ignore",
			stderr: "pipe",
		});
		await install.exited;
		console.log(`  ${pc.green("+")} Dependencies installed`);

		// 3. Build
		const entry = join(cliDir, "src", "index.ts");
		const distDir = getDistDir(app);
		mkdirSync(distDir, { recursive: true });
		const outfile = join(distDir, `${appCli}.js`);

		const build = Bun.spawn(["bun", "build", entry, "--outfile", outfile, "--target", "bun"], {
			cwd: cliDir,
			stdout: "ignore",
			stderr: "pipe",
		});
		const buildCode = await build.exited;
		if (buildCode !== 0) {
			const stderr = await new Response(build.stderr).text();
			console.error(`${pc.red("✗")} Build failed: ${stderr}`);
			process.exit(1);
		}
		console.log(`  ${pc.green("+")} Built`);

		// 4. Link to PATH
		addToPath(app, distDir);

		// 5. Link skill to agent providers through cc-hub/agent-sync
		const skillLinked = await linkSkillThroughCcHub(cliDir, app);
		if (!skillLinked) process.exit(1);

		// 6. Auto-migrate CLIs that don't use keychain for secure token storage
		const configPath = join(cliDir, "src", "lib", "config.ts");
		if (existsSync(configPath)) {
			const configContent = readFileSync(configPath, "utf-8");
			const credsMatch = configContent.match(/CREDS_ENTRY\s*=\s*["'](.+?)["']/);
			const usesKeychain = !!credsMatch;
			if (!usesKeychain) {
				console.log(`\n${pc.yellow("⚠")} This CLI uses plaintext token storage. Migrating to OS keychain...`);
				const { migrate } = await import("./migrate.js");
				const ok = await migrate(app);
				if (!ok) {
					console.error(`${pc.red("✗")} Migration failed. The CLI is installed but may use insecure token storage.`);
				}
			}
		}

		console.log(`\n${pc.green("✓")} Installed ${pc.bold(appCli)}`);
		console.log(`\n${pc.bold("Next:")}`);
		console.log(`  ${pc.cyan(`${appCli} auth set "your-token"`)}`);
		console.log(`  ${pc.cyan(`${appCli} --help`)}`);
	});
