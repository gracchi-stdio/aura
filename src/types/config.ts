export type VaultConfig = {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  label: string;
};

export type Config = {
  app: {
    name: string;
  };
  vaults: VaultConfig[];
};
