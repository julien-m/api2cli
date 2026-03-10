import {Command} from "commander";
import {getToken, hasToken, maskToken, removeToken, setToken} from "../lib/auth.js";
import {client} from "../lib/client.js";
import {log} from "../lib/logger.js";
import {handleError} from "../lib/errors.js";

export const authCommand = new Command("auth").description("Manage API authentication");

authCommand
  .command("set")
    .description("Save your API token (interactive hidden prompt)")
    .addHelpText("after", "\nExample:\n  {{APP_CLI}} auth set\n  echo -n 'sk-xxx' | {{APP_CLI}} auth set")
    .action(async () => {
        setToken();
        log.success("Token saved securely");
    });

authCommand
    .command("show")
    .description("Display current token (masked by default)")
    .option("--raw", "Show the full unmasked token")
    .addHelpText("after", "\nExample:\n  {{APP_CLI}} auth show\n  {{APP_CLI}} auth show --raw")
    .action(async (opts: { raw?: boolean }) => {
    if (!hasToken()) {
      log.warn("No token configured. Run: {{APP_CLI}} auth set <token>");
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
