import { string } from "astro:schema";

export type VaultConfig = {
  owner: string;
  repo: string;
  branch?: string; // default: 'main'
  path?: string; // optional
};

export type VaultFile = {
  name: string;
  path: string;
  type: "file" | "dir";
  sha?: string;
};

export type NoteFrontmatter = Record<string, any> & {
  slug: string;
  path: string;
  title: string;
  publishedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  tags?: string[];
  isIndex: boolean;
};

type AppConfig = {
  name: string;
};

export type Config = {
  app: AppConfig;
  vaults: VaultConfig[];
};

export type Note = {
  frontmatter: NoteFrontmatter;
  content: string;
  references: Array<{
    type: "wikilink" | "embed";
    target: string;
    lable: string;
  }>;
};

export interface VaultReader {
  listNotes(): Promise<VaultFile[]>;
  getFrontmatter(entry: VaultFile): Promise<NoteFrontmatter>;
  getContent(entry: VaultFile): Promise<Note>;
}

export interface NoteProcessor {
  process(content: string, context: ProcessContext): Promise<string>;
}

export type ProcessContext = {
  frontmatters: NoteFrontmatter[];
  currentPath: string;
};
