import type { AttachedProviders } from "./types.ts";

export const ATTACHED_PROVIDERS: AttachedProviders = {
  github: { keys: ["GITHUB_TOKEN"] },
  "work-gcp": { keys: ["GCP_TOKEN"] },
};

export const CREDENTIAL_PLACEHOLDER_PREFIX = "openshell:resolve:env:";

export function normalizeCredentialKey(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith(CREDENTIAL_PLACEHOLDER_PREFIX)) {
    return trimmed.slice(CREDENTIAL_PLACEHOLDER_PREFIX.length);
  }
  return trimmed;
}
