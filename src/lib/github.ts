import { Octokit } from "@octokit/rest";
import type { VaultFile, VaultConfig } from "@/types";
import { logger } from "./logger";
import { env } from "./env";

const octokit = new Octokit({
  auth: env.GITHUB_TOKEN,
});

export async function getVaultStructure(
  config: VaultConfig,
): Promise<VaultFile[]> {
  const { repo, branch = "main", owner, path = "" } = config;

  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: refData.object.sha,
      recursive: "true",
    });

    return treeData.tree
      .filter((item) => {
        const itemPath = item.path;
        return (
          itemPath?.startsWith(path) &&
          (item.type === "tree" || itemPath.endsWith(".md"))
        );
      })
      .map((item) => ({
        name: item.path?.split("/").pop() || "",
        path: item.path,
        type: item.type === "tree" ? "dir" : "file",
        sha: item.sha,
      }))
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "dir" ? -1 : 1;
      }) as VaultFile[];
  } catch (error) {
    logger.error(
      `Error fetching vault structure for repo: ${repo}, branch: ${branch}, path: ${path}: `,
      error,
    );
    return [];
  }
}

export async function getFileContent(
  config: VaultConfig,
  filePath: string,
): Promise<string | null> {
  const { owner, repo, branch = "main", path = "" } = config;

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      ref: branch,
      path: filePath,
    });

    if ("content" in data) {
      return Buffer.from(data.content, "base64").toString();
    }

    return null;
  } catch (error) {
    logger.error(
      `Error fetching vault structure for repo: ${repo}, branch: ${branch}, path: ${path}: `,
      error,
    );
    return null;
  }
}

export function isMarkdownFile(path: string): boolean {
  return path.endsWith(".md") || path.endsWith(".markdown");
}
