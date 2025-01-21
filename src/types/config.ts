export type VaultConfig = {
  owner: string;
  repo: string;
  branch: string;
  path: string;
};

export type Config = {
  app: {
    name: string;
  };
  vaults: VaultConfig[];
};
