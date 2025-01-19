declare module "*.yml" {
  const value: any;
  export default value;
}

declare module "@/config.yml" {
  const value: {
    app: {
      name: string;
    };
    vaults: Array<{
      owner: string;
      repo: string;
      branch?: string;
      path?: string;
    }>;
  };

  export default value;
}
