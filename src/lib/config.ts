import config from "@/config.yml";
import type { VaultConfig, Config } from "@/types";
import { logger } from "@/lib/logger";
import { env } from "./env";
const DEFAULT_CONFIG: Config = {
  app: { name: "Aura Note", unavailable: false },
  vaults: [],
};

export function getConfig(): Config {
  if (!config) {
    logger.warn("No config.yml found or invalid, using default configuration.");
    return {
      ...DEFAULT_CONFIG,
      app: { ...DEFAULT_CONFIG.app, unavailable: env.APP_UNAVAILABLE },
    };
  }

  logger.info("App env unavailable", env.APP_UNAVAILABLE);
  return {
    app: {
      name: config.app?.name?.trim() || DEFAULT_CONFIG.app.name,
      unavailable: env.APP_UNAVAILABLE || DEFAULT_CONFIG.app.unavailable,
    },
    vaults: Array.isArray(config.vaults)
      ? config.vaults.filter(isValidVaultConfig).map(normalizeVaultConfig)
      : DEFAULT_CONFIG.vaults,
  };
}

function normalizeVaultConfig(vault: VaultConfig): VaultConfig {
  const { owner, repo, branch = "main", path = "", label } = vault;
  return {
    owner,
    repo,
    branch,
    path,
    label,
  };
}

function isValidVaultConfig(vault: any): vault is VaultConfig {
  return (
    vault &&
    typeof vault === "object" &&
    typeof vault.owner === "string" &&
    typeof vault.repo === "string" &&
    typeof vault.label === "string"
  );
}
