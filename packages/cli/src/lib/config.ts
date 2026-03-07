import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join, resolve } from "path";

/** Root directory for all generated CLIs */
export const CLI_ROOT = join(homedir(), ".cli");

/** Centralized token storage directory */
export const TOKENS_DIR = join(homedir(), ".config", "tokens");

/** api2cli.dev API base URL */
export const API_URL = "https://api2cli.dev";

/** Global config file */
export const CONFIG_FILE = join(CLI_ROOT, "config.json");

export type PublishPreference = "always" | "never" | "ask";

interface CliConfig {
  publishPreference?: PublishPreference;
}

export function getConfig(): CliConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

export function setConfig(update: Partial<CliConfig>): void {
  const config = { ...getConfig(), ...update };
  mkdirSync(dirname(CONFIG_FILE), { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getPublishPreference(): PublishPreference {
  return getConfig().publishPreference || "ask";
}

export function setPublishPreference(pref: PublishPreference): void {
  setConfig({ publishPreference: pref });
}

/** GitHub repo for fetching the template */
export const TEMPLATE_REPO = "https://github.com/Melvynx/api2cli.git";

/** Path to template within the repo */
export const TEMPLATE_REPO_PATH = "packages/template";

/** Placeholders used in the template that get replaced during create */
export const PLACEHOLDERS = [
  "{{APP_NAME}}",
  "{{APP_CLI}}",
  "{{BASE_URL}}",
  "{{AUTH_TYPE}}",
  "{{AUTH_HEADER}}",
] as const;

/** Get the installation directory for a CLI */
export function getCliDir(app: string): string {
  return join(CLI_ROOT, `${app}-cli`);
}

/** Get the token file path for a CLI */
export function getTokenFile(app: string): string {
  return join(TOKENS_DIR, `${app}-cli.txt`);
}

/** Get the dist directory for a CLI */
export function getDistDir(app: string): string {
  return join(getCliDir(app), "dist");
}
