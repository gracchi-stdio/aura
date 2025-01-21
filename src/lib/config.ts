import config from "@/config.yml";
import type { VaultConfig, Config } from "@/types";

const DEFAULT_CONFIG: Config = {
  app: { name: "Aura Note" },
  vaults: [],
};

export function getConfig(): Config {
  if (!config) return DEFAULT_CONFIG;
  return {
    app: {
      name: config.app?.name?.trim() || DEFAULT_CONFIG.app.name,
    },
    vaults: Array.isArray(config.vaults)
      ? config.vaults.filter(isValidVaultConfig).map(normalizeVaultConfig)
      : DEFAULT_CONFIG.vaults,
  };
}

function normalizeVaultConfig(vault: VaultConfig): VaultConfig {
  const { owner, repo, branch = "main", path = "" } = vault;
  return {
    owner,
    repo,
    branch,
    path,
  };
}

function isValidVaultConfig(vault: any): vault is VaultConfig {
  return (
    vault &&
    typeof vault === "object" &&
    typeof vault.owner === "string" &&
    typeof vault.repo === "string"
  );
}
