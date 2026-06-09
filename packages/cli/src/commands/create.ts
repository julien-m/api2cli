import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { getAgentSyncSkillDir } from "../lib/agent-sync.js";
import { getCliDir } from "../lib/config.js";
import { compileSkillInstructions } from "../lib/skill-compiler.js";
import { copyTemplate, replacePlaceholders } from "../lib/template.js";

export const createCommand = new Command("create")
	.description("Generate a new CLI from API documentation")
	.argument("<app>", "API/app name (e.g. typefully, dub, mercury)")
	.option("--docs <url>", "URL to API documentation")
	.option("--openapi <url>", "URL to OpenAPI/Swagger spec")
	.option("--base-url <url>", "API base URL", "https://api.example.com")
	.option("--auth-type <type>", "Auth type: bearer, api-key, basic, custom", "bearer")
	.option("--auth-header <name>", "Auth header name", "Authorization")
	.option(
		"--creds-entry <entry>",
		"Creds keychain entry (defaults to global/dev/<app>). Uses macOS Keychain via creds CLI",
	)
	.option("--force", "Overwrite existing CLI", false)
	.addHelpText(
		"after",
		`
Examples:
  api2cli create typefully --base-url https://api.typefully.com --auth-type bearer
  api2cli create dub --openapi https://api.dub.co/openapi.json
  api2cli create my-api --docs https://docs.example.com/api`,
	)
	.action(
		async (
			app: string,
			opts: {
				docs?: string;
				openapi?: string;
				baseUrl: string;
				authType: string;
				authHeader: string;
				credsEntry?: string;
				force?: boolean;
			},
		) => {
			const cliDir = getCliDir(app);

			if (existsSync(cliDir) && !opts.force) {
				console.error(`${pc.red("✗")} ${app}-cli already exists at ${cliDir}`);
				console.error(`  Use ${pc.cyan("--force")} to overwrite.`);
				process.exit(1);
			}

			console.log(`\n${pc.bold("Creating")} ${pc.cyan(`${app}-cli`)}...\n`);

			// 1. Create target directory
			mkdirSync(cliDir, { recursive: true });
			console.log(`  ${pc.green("+")} Created ${pc.dim(cliDir)}`);

			// 2. Copy template
			copyTemplate(cliDir);
			console.log(`  ${pc.green("+")} Copied template scaffold`);

			// 3. Replace placeholders
			const credsEntry: string = opts.credsEntry ?? `global/dev/${app}`;
			replacePlaceholders(cliDir, {
				appName: app,
				appCli: `${app}-cli`,
				baseUrl: opts.baseUrl,
				authType: opts.authType,
				authHeader: opts.authHeader,
				credsEntry,
			});

			// 3b. Stamp api2cli metadata into generated package.json so manager
			//     commands (tokens/list/remove) can resolve the keychain entry.
			const pkgPath = join(cliDir, "package.json");
			if (existsSync(pkgPath)) {
				const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
				pkg.api2cli = { app, credsEntry, authType: opts.authType };
				writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
			}

			console.log(`  ${pc.green("+")} Configured for ${pc.bold(app)}`);

			// 4. Install dependencies
			console.log(`  ${pc.dim("Installing dependencies...")}`);
			const bunPath = process.execPath;
			const install = Bun.spawn([bunPath, "install"], {
				cwd: cliDir,
				stdout: "ignore",
				stderr: "pipe",
			});
			await install.exited;
			console.log(`  ${pc.green("+")} Dependencies installed`);

			// 5. Move skill templates into .agent-sync/skills/<app>-cli/
			//    - SKILL.md (slim header + commands list)
			//    - references/commands.md (detailed reference loaded on demand)
			const skillsRoot = join(cliDir, "skills");
			const skillDir = getAgentSyncSkillDir(cliDir, app);
			const skillTemplate = join(skillsRoot, "SKILL.md.template");
			if (existsSync(skillTemplate)) {
				mkdirSync(skillDir, { recursive: true });
				renameSync(skillTemplate, join(skillDir, "SKILL.md"));
			}
			const refsTemplateDir = join(skillsRoot, "references");
			const refsCommandsTemplate = join(refsTemplateDir, "commands.md.template");
			if (existsSync(refsCommandsTemplate)) {
				const skillRefsDir = join(skillDir, "references");
				mkdirSync(skillRefsDir, { recursive: true });
				renameSync(refsCommandsTemplate, join(skillRefsDir, "commands.md"));
			}
			removeIfEmptyOrMetadataOnly(refsTemplateDir);
			removeIfEmptyOrMetadataOnly(skillsRoot);
			compileSkillInstructions(cliDir, app);

			// 6. Rename README.md.template
			const readmeTemplate = join(cliDir, "README.md.template");
			if (existsSync(readmeTemplate)) {
				renameSync(readmeTemplate, join(cliDir, "README.md"));
			}

			console.log(`\n${pc.green("✓")} Created ${pc.bold(`${app}-cli`)} at ${pc.dim(cliDir)}`);
			console.log(`\n${pc.bold("Next steps:")}`);
			console.log(`  1. Edit resources in ${pc.dim(`${cliDir}/src/resources/`)}`);
			console.log(`  2. Build: ${pc.cyan(`npx api2cli bundle ${app}`)}`);
			console.log(`  3. Link: ${pc.cyan(`npx api2cli link ${app}`)}`);
			console.log(`  4. Auth: ${pc.cyan(`${app}-cli auth set "your-token"`)}`);
		},
	);

function removeIfEmptyOrMetadataOnly(dir: string): void {
	if (!existsSync(dir)) return;
	const meaningfulEntries = readdirSync(dir).filter((entry) => entry !== ".DS_Store");
	if (meaningfulEntries.length === 0) {
		rmSync(dir, { recursive: true, force: true });
	}
}
