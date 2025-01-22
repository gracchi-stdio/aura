export type NavItem = {
  label: string;
  slug?: string;
  children?: NavItem[];
};

export type NavTree = Record<string, NavItem[] | Record<string, NavItem[]>>;
