import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { CLI_ROOT } from "../lib/config.js";
import { getCredsEntry, hasCredsToken } from "../lib/creds.js";

export const listCommand = new Command("list")
	.description("List all installed CLIs")
	.option("--json", "Output as JSON")
	.addHelpText("after", "\nExamples:\n  api2cli list\n  api2cli list --json")
	.action((opts) => {
		if (!existsSync(CLI_ROOT)) {
			console.log("No CLIs installed. Run: api2cli create <app>");
			return;
		}

		const dirs = readdirSync(CLI_ROOT).filter((d) => {
			return statSync(join(CLI_ROOT, d)).isDirectory() && d.endsWith("-cli");
		});

		if (dirs.length === 0) {
			console.log("No CLIs installed.");
			return;
		}

		if (opts.json) {
			const data = dirs.map((d) => {
				const name = d.replace(/-cli$/, "");
				return {
					name,
					built: existsSync(join(CLI_ROOT, d, "dist")),
					hasToken: hasCredsToken(getCredsEntry(name)),
					path: join(CLI_ROOT, d),
				};
			});
			console.log(JSON.stringify({ ok: true, data }, null, 2));
			return;
		}

		console.log(`\n${pc.bold("Installed CLIs:")}\n`);
		for (const d of dirs) {
			const name = d.replace(/-cli$/, "");
			const built = existsSync(join(CLI_ROOT, d, "dist"));
			const hasToken = hasCredsToken(getCredsEntry(name));
			const status = [
				built ? pc.green("built") : pc.yellow("not built"),
				hasToken ? pc.green("auth") : pc.dim("no auth"),
			].join(pc.dim(" | "));
			console.log(`  ${pc.bold(name.padEnd(20))} ${status}`);
		}
		console.log();
	});
