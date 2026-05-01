import { existsSync, rmSync } from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { getCliDir, getDistDir } from "../lib/config.js";
import { getCredsEntry, removeCredsEntry } from "../lib/creds.js";
import { removeFromPath } from "../lib/shell.js";

export const removeCommand = new Command("remove")
	.description("Remove a CLI entirely")
	.argument("<app>", "CLI to remove")
	.option("--keep-token", "Keep the auth token")
	.addHelpText("after", "\nExamples:\n  api2cli remove typefully\n  api2cli remove typefully --keep-token")
	.action((app: string, opts: { keepToken?: boolean }) => {
		const cliDir = getCliDir(app);

		if (!existsSync(cliDir)) {
			console.error(`${pc.red("✗")} ${app}-cli not found.`);
			process.exit(1);
		}

		// Resolve creds entry BEFORE removing the cliDir (we read its package.json)
		const entry = getCredsEntry(app);

		// Remove from PATH
		removeFromPath(app, getDistDir(app));

		// Remove directory
		rmSync(cliDir, { recursive: true, force: true });
		console.log(`${pc.green("✓")} Removed ${pc.bold(`${app}-cli`)}`);

		// Remove token from keychain unless --keep-token
		if (!opts.keepToken) {
			if (removeCredsEntry(entry)) {
				console.log(`${pc.green("✓")} Removed token from keychain (${pc.dim(entry)})`);
			} else {
				console.log(
					`${pc.yellow("~")} Could not remove token from keychain (${pc.dim(entry)}). Run: ${pc.cyan(`creds rm ${entry}`)}`,
				);
			}
		}
	});
