import keytar from "keytar";
import { userInfo } from "os";
import { KEYCHAIN_SERVICE, AUTH_TYPE, AUTH_HEADER, APP_CLI } from "./config.js";
import { CliError } from "./errors.js";

const ACCOUNT = userInfo().username;

/** Check if a token is configured in the OS keychain */
export async function hasToken(): Promise<boolean> {
  const token = await keytar.getPassword(KEYCHAIN_SERVICE, ACCOUNT);
  return token !== null;
}

/** Read the stored token from the OS keychain. Throws if not configured. */
export async function getToken(): Promise<string> {
  const token = await keytar.getPassword(KEYCHAIN_SERVICE, ACCOUNT);
  if (!token) {
    throw new CliError(2, "No token configured.", `Run: ${APP_CLI} auth set <token>`);
  }
  return token;
}

/** Save a token to the OS keychain. */
export async function setToken(token: string): Promise<void> {
  await keytar.setPassword(KEYCHAIN_SERVICE, ACCOUNT, token.trim());
}

/** Delete the stored token from the OS keychain. */
export async function removeToken(): Promise<void> {
  await keytar.deletePassword(KEYCHAIN_SERVICE, ACCOUNT);
}

/** Mask a token for display: "sk-abc...wxyz" */
export function maskToken(token: string): string {
  if (token.length <= 8) return "****";
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

/** Build the auth header based on configured auth type. */
export async function buildAuthHeaders(): Promise<Record<string, string>> {
  const token = await getToken();

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
