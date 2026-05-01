import { existsSync } from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import { CLI_ROOT, TEMPLATE_REPO } from "../lib/config.js";
import { isCredsAvailable } from "../lib/creds.js";

export const doctorCommand = new Command("doctor")
	.description("Check system requirements and configuration")
	.addHelpText("after", "\nExample:\n  api2cli doctor")
	.action(async () => {
		console.log(`\n${pc.bold("api2cli doctor")}\n`);
		let issues = 0;

		// Bun
		try {
			const proc = Bun.spawn(["bun", "--version"], { stdout: "pipe", stderr: "pipe" });
			const version = (await new Response(proc.stdout).text()).trim();
			console.log(`  ${pc.green("✓")} Bun ${version}`);
		} catch {
			console.log(`  ${pc.red("✗")} Bun not found. Install: ${pc.cyan("https://bun.sh")}`);
			issues++;
		}

		// Git
		try {
			const proc = Bun.spawn(["git", "--version"], { stdout: "pipe", stderr: "pipe" });
			const version = (await new Response(proc.stdout).text()).trim();
			console.log(`  ${pc.green("✓")} ${version}`);
		} catch {
			console.log(`  ${pc.red("✗")} Git not found (required to fetch template)`);
			issues++;
		}

		// CLI root
		if (existsSync(CLI_ROOT)) {
			console.log(`  ${pc.green("✓")} CLI root: ${pc.dim(CLI_ROOT)}`);
		} else {
			console.log(`  ${pc.yellow("~")} CLI root not yet created: ${pc.dim(CLI_ROOT)}`);
		}

		// creds CLI (used for keychain-backed token storage)
		if (isCredsAvailable()) {
			console.log(`  ${pc.green("✓")} creds CLI available (tokens stored in OS Keychain)`);
		} else {
			console.log(`  ${pc.red("✗")} creds CLI not found — generated CLIs cannot store tokens until installed`);
			issues++;
		}

		// Template repo
		console.log(`  ${pc.green("✓")} Template: ${pc.dim(TEMPLATE_REPO)} (fetched on create)`);

		console.log(issues === 0 ? `\n${pc.green("All good!")}\n` : `\n${pc.red(`${issues} issue(s) found.`)}\n`);
	});
