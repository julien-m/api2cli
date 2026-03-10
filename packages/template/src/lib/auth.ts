import { execFileSync } from "node:child_process";
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
      throw new CliError(2, "No token configured.", `Run: ${APP_CLI} auth set <token>`);
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
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

/** Build the auth header based on configured auth type. */
export function buildAuthHeaders(): Record<string, string> {
  const token = getToken();

  switch (AUTH_TYPE) {
    case "bearer":
      return { [AUTH_HEADER]: `Bearer ${token}` };
    case "api-key":
      return { [AUTH_HEADER]: token };
    case "basic":
      return { Authorization: `Basic ${Buffer.from(token).toString("base64")}` };
    default:
      return { [AUTH_HEADER]: token };
  }
}
