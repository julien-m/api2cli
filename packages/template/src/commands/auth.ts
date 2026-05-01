import { Command } from "commander";
import { getToken, hasToken, maskToken, removeToken, setToken } from "../lib/auth.js";
import { client } from "../lib/client.js";
import { CliError, handleError } from "../lib/errors.js";
import { log } from "../lib/logger.js";

export const authCommand = new Command("auth").description("Manage API authentication");

authCommand
	.command("set")
	.description("Save your API token (interactive hidden prompt) and validate it against the API")
	.addHelpText(
		"after",
		"\nExamples:\n  {{APP_CLI}} auth set                # masked prompt, then validates\n  echo -n 'sk-xxx' | {{APP_CLI}} auth set",
	)
	.action(async () => {
		try {
			setToken();
		} catch (err) {
			if (err instanceof CliError && err.code === 2) {
				log.info("Cancelled.");
				process.exit(2);
			}
			handleError(err);
		}

		try {
			await client.get("/");
			log.success("Token saved and validated");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "unknown error";
			const authFailed = err instanceof CliError && (err.code === 401 || err.code === 403);
			if (authFailed) {
				log.error(`Token saved BUT rejected by API: ${msg}`);
				log.info("Run `{{APP_CLI}} auth set` again with a valid token.");
				process.exit(1);
			}
			log.warn(`Token saved (could not verify against API: ${msg}).`);
			log.info("Run `{{APP_CLI}} auth test` later to retry validation.");
		}
	});

authCommand
	.command("show")
	.description("Display current token (masked by default)")
	.option("--raw", "Show the full unmasked token")
	.addHelpText("after", "\nExample:\n  {{APP_CLI}} auth show\n  {{APP_CLI}} auth show --raw")
	.action(async (opts: { raw?: boolean }) => {
		if (!hasToken()) {
			log.warn("No token configured. Run: {{APP_CLI}} auth set");
			return;
		}
		const token = getToken();
		console.log(opts.raw ? token : `Token: ${maskToken(token)}`);
	});

authCommand
	.command("remove")
	.description("Delete the saved token")
	.addHelpText("after", "\nExample:\n  {{APP_CLI}} auth remove")
	.action(async () => {
		removeToken();
		log.success("Token removed");
	});

authCommand
	.command("test")
	.description("Verify your token works by making a test API call")
	.addHelpText("after", "\nExample:\n  {{APP_CLI}} auth test")
	.action(async () => {
		try {
			await client.get("/");
			log.success("Token is valid");
		} catch (err) {
			handleError(err);
		}
	});
