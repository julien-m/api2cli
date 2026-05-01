import { Command } from "commander";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import pc from "picocolors";
import { CLI_ROOT } from "../lib/config.js";
import {
  getCredsEntry,
  getCredsToken,
  isCredsAvailable,
  maskToken,
} from "../lib/creds.js";

export const tokensCommand = new Command("tokens")
  .description("List API tokens stored in the OS keychain (via creds)")
  .option("--show", "Show full unmasked tokens")
  .addHelpText("after", "\nExamples:\n  api2cli tokens\n  api2cli tokens --show")
  .action((opts) => {
    if (!isCredsAvailable()) {
      console.error(`${pc.red("✗")} \`creds\` CLI not found.`);
      console.error(`  Install it (macOS Keychain manager) and retry.`);
      process.exit(1);
    }

    if (!existsSync(CLI_ROOT)) {
      console.log("No CLIs installed yet.");
      return;
    }

    const dirs = readdirSync(CLI_ROOT).filter((d) => {
      return statSync(join(CLI_ROOT, d)).isDirectory() && d.endsWith("-cli");
    });

    if (dirs.length === 0) {
      console.log("No CLIs installed yet.");
      return;
    }

    const rows: { name: string; entry: string; token: string | null }[] = [];
    for (const d of dirs) {
      const app = d.replace(/-cli$/, "");
      const entry = getCredsEntry(app);
      rows.push({ name: d, entry, token: getCredsToken(entry) });
    }

    console.log(`\n${pc.bold("Tokens (stored in OS Keychain via creds):")}\n`);
    for (const row of rows) {
      const display = row.token
        ? opts.show
          ? row.token
          : maskToken(row.token)
        : pc.dim("not set");
      console.log(
        `  ${pc.bold(row.name.padEnd(25))} ${pc.dim(row.entry.padEnd(28))} ${display}`,
      );
    }
    console.log();
  });
