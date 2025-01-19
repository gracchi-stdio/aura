import config from "@/config.yml";
import { string } from "astro:schema";
import type { VaultConfig } from "./types";

export function getConfig() {
  return {
    app: {
      name: validateString(config?.app?.name, "Aura Note"),
    },
    vaults: validateVaults(config?.vaults),
  };
}

function validateString(value: unknown, defaultValue: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return defaultValue;
}

function validateVaultConfig(vault: unknown): VaultConfig | null {
  if (!vault || typeof vault !== "object") return null;

  const v = vault as any;

  if (!v.owner || !v.repo) return null;

  return {
    owner: validateString(v.owner, ""),
    repo: validateString(v.repo, ""),
    branch: validateString(v.branch, ""),
    path: validateString(v.path, ""),
  };
}

function validateVaults(vaults: unknown): VaultConfig[] {
  if (!Array.isArray(vaults)) {
    return [getDefaultVaultConfig()];
  }

  const validVaults = vaults
    .map((vault) => validateVaultConfig(vault))
    .filter((vault): vault is VaultConfig => vault !== null);

  return validVaults.length > 0 ? validVaults : [getDefaultVaultConfig()];
}

export function getDefaultVaultConfig(): VaultConfig {
  return {
    owner: "Kavehrafie",
    repo: "unboundedTerritories",
    branch: "main",
  };
}
