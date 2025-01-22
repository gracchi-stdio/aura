export type NavItem = {
  label: string;
  slug?: string;
  children?: NavItem[];
};

export type NavTree = Record<
  string,
  {
    label: string;
    slug?: string;
    children?: NavTree;
  }
>;
