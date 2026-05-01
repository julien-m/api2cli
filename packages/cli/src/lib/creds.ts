import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getCliDir } from "./config.js";

/** Read the creds keychain entry for an installed CLI from its package.json. */
export function getCredsEntry(app: string): string {
  const pkgPath = join(getCliDir(app), "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const entry = pkg?.api2cli?.credsEntry;
      if (typeof entry === "string" && entry.length > 0) return entry;
    } catch {
      // fall through to default
    }
  }
  return `global/dev/${app}`;
}

/** Check if a token is stored in the OS keychain for the given entry. */
export function hasCredsToken(entry: string): boolean {
  try {
    execFileSync("creds", ["get", entry, "--no-newline"], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

/** Read the token value from the OS keychain. Returns null if not found or creds unavailable. */
export function getCredsToken(entry: string): string | null {
  try {
    return execFileSync("creds", ["get", entry, "--no-newline"], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

/** Remove a creds entry from the OS keychain. Returns true on success or if the entry didn't exist. */
export function removeCredsEntry(entry: string): boolean {
  try {
    execFileSync("creds", ["rm", entry], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch (err: unknown) {
    const code = (err as { status?: number }).status;
    return code === 2; // not found is acceptable
  }
}

/** Detect whether the `creds` CLI is available on PATH. */
export function isCredsAvailable(): boolean {
  try {
    execFileSync("creds", ["--version"], { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

/** Mask a token for display: "abcd...wxyz" */
export function maskToken(token: string): string {
  if (token.length <= 8) return "****";
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}
