import { Command } from "commander";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import pc from "picocolors";
import { getCliDir, getDistDir, CLI_ROOT } from "../lib/config.js";

// ---------------------------------------------------------------------------
// Embedded template content (from packages/template/src/)
// Placeholders use {{KEY}} syntax and are replaced during migration.
// ---------------------------------------------------------------------------

const TEMPLATE_CONFIG = `/** Application name (replaced during api2cli create) */
export const APP_NAME = "{{APP_NAME}}";

/** CLI binary name (replaced during api2cli create) */
export const APP_CLI = "{{APP_CLI}}";

/** API base URL (replaced during api2cli create) */
export const BASE_URL = "{{BASE_URL}}";

/** Auth type: bearer | api-key | basic | custom */
export const AUTH_TYPE = "{{AUTH_TYPE}}";

/** Auth header name (e.g. Authorization, X-Api-Key) */
export const AUTH_HEADER = "{{AUTH_HEADER}}";

/** Creds entry for token storage (e.g. global/dev/myapp) — used by creds CLI */
export const CREDS_ENTRY = "{{CREDS_ENTRY}}";

/** Global state for output flags (set by root command) */
export const globalFlags = {
  json: false,
  format: "text" as "text" | "json" | "csv" | "yaml",
  verbose: false,
  noColor: false,
  noHeader: false,
};
`;

const TEMPLATE_AUTH = `import { execFileSync } from "node:child_process";
import { AUTH_TYPE, AUTH_HEADER, APP_CLI, CREDS_ENTRY } from "./config.js";
import { CliError } from "./errors.js";

/** Read the stored token from the OS keychain via creds CLI. Throws if not configured. */
export function getToken(): string {
  try {
    return execFileSync("creds", ["get", CREDS_ENTRY, "--no-newline"], {
      encoding: "utf-8",
    });
  } catch (err: unknown) {
    const code = (err as { status?: number }).status;
    if (code === 2) {
      throw new CliError(2, "No token configured.", \`Run: \${APP_CLI} auth set <token>\`);
    }
    if (code === 3) {
      throw new CliError(3, "Keychain locked or access denied.");
    }
    throw new CliError(4, "Failed to read token from keychain.");
  }
}

/** Check if a token is configured in the OS keychain */
export function hasToken(): boolean {
  try {
    execFileSync("creds", ["get", CREDS_ENTRY, "--no-newline"], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

/** Save a token to the OS keychain via creds CLI (interactive masked prompt). */
export function setToken(): void {
  execFileSync("creds", ["set", CREDS_ENTRY], {
    encoding: "utf-8",
    stdio: "inherit",
  });
}

/** Delete the stored token from the OS keychain via creds CLI. */
export function removeToken(): void {
  try {
    execFileSync("creds", ["rm", CREDS_ENTRY], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    // Ignore errors (entry may not exist)
  }
}

/** Mask a token for display: "sk-abc...wxyz" */
export function maskToken(token: string): string {
  if (token.length <= 8) return "****";
  return \`\${token.slice(0, 4)}...\${token.slice(-4)}\`;
}

/** Build the auth header based on configured auth type. */
export function buildAuthHeaders(): Record<string, string> {
  const token = getToken();

  switch (AUTH_TYPE) {
    case "bearer":
      return { [AUTH_HEADER]: \`Bearer \${token}\` };
    case "api-key":
      return { [AUTH_HEADER]: token };
    case "basic":
      return { Authorization: \`Basic \${Buffer.from(token).toString("base64")}\` };
    default:
      return { [AUTH_HEADER]: token };
  }
}
`;

const TEMPLATE_AUTH_COMMAND = `import { Command } from "commander";
import { getToken, setToken, removeToken, hasToken, maskToken } from "../lib/auth.js";
import { client } from "../lib/client.js";
import { log } from "../lib/logger.js";
import { handleError } from "../lib/errors.js";

export const authCommand = new Command("auth").description("Manage API authentication");

authCommand
  .command("set")
  .description("Save your API token (interactive hidden prompt)")
  .addHelpText("after", "\\nExample:\\n  {{APP_CLI}} auth set")
  .action(async () => {
    setToken();
    log.success("Token saved securely");
  });

authCommand
  .command("show")
  .description("Display current token (masked by default)")
  .option("--raw", "Show the full unmasked token")
  .addHelpText("after", "\\nExample:\\n  {{APP_CLI}} auth show\\n  {{APP_CLI}} auth show --raw")
  .action(async (opts: { raw?: boolean }) => {
    if (!hasToken()) {
      log.warn("No token configured. Run: {{APP_CLI}} auth set <token>");
      return;
    }
    const token = getToken();
    console.log(opts.raw ? token : \`Token: \${maskToken(token)}\`);
  });

authCommand
  .command("remove")
  .description("Delete the saved token")
  .addHelpText("after", "\\nExample:\\n  {{APP_CLI}} auth remove")
  .action(async () => {
    removeToken();
    log.success("Token removed");
  });

authCommand
  .command("test")
  .description("Verify your token works by making a test API call")
  .addHelpText("after", "\\nExample:\\n  {{APP_CLI}} auth test")
  .action(async () => {
    try {
      await client.get("/");
      log.success("Token is valid");
    } catch (err) {
      handleError(err);
    }
  });
`;

const TEMPLATE_CLIENT = `import { buildAuthHeaders } from "./auth.js";
import { BASE_URL } from "./config.js";
import { CliError } from "./errors.js";
import { log } from "./logger.js";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];
const TIMEOUT_MS = 30_000;

/** HTTP methods supported by the client */
type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/** Options for an API request */
interface RequestOptions {
  params?: Record<string, string>;
  body?: Record<string, unknown>;
  timeout?: number;
}

/**
 * Make an authenticated API request with retry logic.
 * Retries on 429 (rate limit) and 5xx (server errors).
 */
async function request(method: Method, path: string, opts: RequestOptions = {}): Promise<unknown> {
  let url = \`\${BASE_URL}\${path}\`;

  if (opts.params) {
    const filtered = Object.fromEntries(
      Object.entries(opts.params).filter(([, v]) => v !== undefined && v !== ""),
    );
    if (Object.keys(filtered).length > 0) {
      url += \`?\${new URLSearchParams(filtered).toString()}\`;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...buildAuthHeaders(),
  };

  const fetchOpts: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(opts.timeout ?? TIMEOUT_MS),
  };

  if (opts.body && method !== "GET") {
    fetchOpts.body = JSON.stringify(opts.body);
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    log.debug(\`\${method} \${url}\${attempt > 0 ? \` (retry \${attempt})\` : ""}\`);

    const res = await fetch(url, fetchOpts);

    // Retry on rate limit or server error
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS[attempt] ?? 4000;
      log.warn(\`\${res.status} - retrying in \${delay / 1000}s...\`);
      await Bun.sleep(delay);
      continue;
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        (data as Record<string, unknown>)?.message ??
        ((data as Record<string, Record<string, unknown>>)?.error?.message as string) ??
        res.statusText;
      throw new CliError(res.status, \`\${res.status}: \${String(msg)}\`);
    }

    return data;
  }

  throw new CliError(500, "Max retries exceeded");
}

/** Typed HTTP client with convenience methods */
export const client = {
  /** GET request with optional query params */
  get(path: string, params?: Record<string, string>) {
    return request("GET", path, { params });
  },

  /** POST request with JSON body */
  post(path: string, body?: Record<string, unknown>) {
    return request("POST", path, { body });
  },

  /** PATCH request with JSON body */
  patch(path: string, body?: Record<string, unknown>) {
    return request("PATCH", path, { body });
  },

  /** PUT request with JSON body */
  put(path: string, body?: Record<string, unknown>) {
    return request("PUT", path, { body });
  },

  /** DELETE request */
  delete(path: string) {
    return request("DELETE", path);
  },
};
`;

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
      delete pkg.dependencies.keytar;
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
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

  const build = Bun.spawn(
    ["bun", "build", entry, "--outfile", outfile, "--target", "bun"],
    { cwd: cliDir, stdout: "ignore", stderr: "pipe" },
  );
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
