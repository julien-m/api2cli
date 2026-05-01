import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { CLI_ROOT, getCliDir, getDistDir } from "../lib/config.js";

// @ts-expect-error Bun text import attribute
import TEMPLATE_AUTH_COMMAND from "../../../template/src/commands/auth.ts" with { type: "text" };
// Source-of-truth template files are bundled at build time via Bun text imports.
// Placeholders ({{KEY}}) are substituted before write. tsc cannot resolve text-attribute
// imports of .ts files, so each import is suppressed individually.
// @ts-expect-error Bun text import attribute
import TEMPLATE_AUTH from "../../../template/src/lib/auth.ts" with { type: "text" };
// @ts-expect-error Bun text import attribute
import TEMPLATE_CLIENT from "../../../template/src/lib/client.ts" with { type: "text" };
// @ts-expect-error Bun text import attribute
import TEMPLATE_CONFIG from "../../../template/src/lib/config.ts" with { type: "text" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ParsedConfig {
	APP_NAME: string;
	APP_CLI: string;
	BASE_URL: string;
	AUTH_TYPE: string;
	AUTH_HEADER: string;
}

function parseConfig(content: string): ParsedConfig | null {
	const get = (key: string) => {
		const m = content.match(new RegExp(`${key}\\s*=\\s*["']([^"']*)["']`));
		return m?.[1] ?? null;
	};

	const APP_NAME = get("APP_NAME");
	const APP_CLI = get("APP_CLI");
	const BASE_URL = get("BASE_URL");
	const AUTH_TYPE = get("AUTH_TYPE");
	const AUTH_HEADER = get("AUTH_HEADER");

	if (!APP_NAME || !APP_CLI || !BASE_URL || !AUTH_TYPE || !AUTH_HEADER) return null;
	return { APP_NAME, APP_CLI, BASE_URL, AUTH_TYPE, AUTH_HEADER };
}

function isAlreadyMigrated(content: string): boolean {
	// Already migrated if CREDS_ENTRY is present (new creds-based format)
	const m = content.match(/CREDS_ENTRY\s*=\s*["'](.+?)["']/);
	return !!m;
}

function replacePlaceholders(template: string, values: Record<string, string>): string {
	let result = template;
	for (const [key, val] of Object.entries(values)) {
		result = result.replaceAll(`{{${key}}}`, val);
	}
	return result;
}

// ---------------------------------------------------------------------------
// Core migrate logic (exported for use by install.ts)
// ---------------------------------------------------------------------------

export async function migrate(app: string): Promise<boolean> {
	const cliDir = getCliDir(app);
	const appCli = `${app}-cli`;

	if (!existsSync(cliDir)) {
		console.error(`${pc.red("✗")} CLI not found: ${pc.dim(cliDir)}`);
		return false;
	}

	const configPath = join(cliDir, "src", "lib", "config.ts");
	if (!existsSync(configPath)) {
		console.error(`${pc.red("✗")} Config not found: ${pc.dim(configPath)}`);
		return false;
	}

	const configContent = readFileSync(configPath, "utf-8");

	if (isAlreadyMigrated(configContent)) {
		console.log(`${pc.dim("–")} ${pc.bold(appCli)} already migrated, skipping`);
		return true;
	}

	const parsed = parseConfig(configContent);
	if (!parsed) {
		console.error(`${pc.red("✗")} Could not parse config for ${appCli}`);
		return false;
	}

	const credsEntry = `global/dev/${app}`;
	const values: Record<string, string> = {
		APP_NAME: parsed.APP_NAME,
		APP_CLI: parsed.APP_CLI,
		BASE_URL: parsed.BASE_URL,
		AUTH_TYPE: parsed.AUTH_TYPE,
		AUTH_HEADER: parsed.AUTH_HEADER,
		CREDS_ENTRY: credsEntry,
	};

	// 1. Write migrated files
	console.log(`  ${pc.dim("Writing migrated files...")}`);

	writeFileSync(configPath, replacePlaceholders(TEMPLATE_CONFIG, values));
	writeFileSync(join(cliDir, "src", "lib", "auth.ts"), TEMPLATE_AUTH);
	writeFileSync(join(cliDir, "src", "lib", "client.ts"), TEMPLATE_CLIENT);

	const authCmdDir = join(cliDir, "src", "commands");
	mkdirSync(authCmdDir, { recursive: true });
	writeFileSync(join(authCmdDir, "auth.ts"), replacePlaceholders(TEMPLATE_AUTH_COMMAND, values));

	// 2. Remove keytar if present, no new dependency needed (creds is a system CLI)
	const pkgPath = join(cliDir, "package.json");
	if (existsSync(pkgPath)) {
		const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
		if (pkg.dependencies?.keytar) {
			pkg.dependencies.keytar = undefined;
			writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
			console.log(`  ${pc.dim("Removed keytar dependency")}`);
		}
	}

	// 3. Reinstall dependencies (to clean up keytar)
	console.log(`  ${pc.dim("Installing dependencies...")}`);
	const install = Bun.spawn(["bun", "install"], {
		cwd: cliDir,
		stdout: "ignore",
		stderr: "pipe",
	});
	await install.exited;

	// 4. Rebuild
	console.log(`  ${pc.dim("Rebuilding...")}`);
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
		return false;
	}

	console.log(`${pc.green("✓")} Migrated ${pc.bold(appCli)} to use creds CLI`);
	console.log(`  ${pc.dim(`Creds entry: ${credsEntry}`)}`);
	return true;
}

// ---------------------------------------------------------------------------
// Command definition
// ---------------------------------------------------------------------------

export const migrateCommand = new Command("migrate")
	.description("Migrate a CLI from plaintext/keytar tokens to creds CLI")
	.argument("[app]", "App name to migrate (e.g. context7)")
	.option("--all", "Migrate all installed CLIs")
	.addHelpText(
		"after",
		`
Examples:
  api2cli migrate context7
  api2cli migrate --all`,
	)
	.action(async (app: string | undefined, opts: { all?: boolean }) => {
		if (!opts.all && !app) {
			console.error(`${pc.red("✗")} Specify an app name or use ${pc.cyan("--all")}`);
			process.exit(1);
		}

		if (opts.all) {
			if (!existsSync(CLI_ROOT)) {
				console.error(`${pc.red("✗")} No CLIs installed (${CLI_ROOT} not found)`);
				process.exit(1);
			}

			const entries = readdirSync(CLI_ROOT, { withFileTypes: true })
				.filter((e) => e.isDirectory() && e.name.endsWith("-cli"))
				.map((e) => e.name.replace(/-cli$/, ""));

			if (entries.length === 0) {
				console.log("No CLIs found to migrate.");
				return;
			}

			console.log(`\nMigrating ${pc.bold(String(entries.length))} CLI(s)...\n`);
			for (const name of entries) {
				await migrate(name);
			}
			return;
		}

		console.log(`\n${pc.bold("Migrating")} ${pc.cyan(`${app}-cli`)}...\n`);
		const ok = await migrate(app!);
		if (!ok) process.exit(1);
	});
