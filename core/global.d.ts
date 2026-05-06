// Ambient declarations for Node.js globals used in the core agent layer.
// These are server-side only modules — never imported by Astro pages.

declare const process: {
  env: Record<string, string | undefined>;
};

declare function btoa(data: string): string;

declare module "node:fs/promises" {
  export function writeFile(path: string, data: string, encoding: string): Promise<void>;
  export function mkdir(
    path: string,
    opts?: { recursive?: boolean }
  ): Promise<string | undefined>;
}

declare module "node:path" {
  export function dirname(path: string): string;
  export function join(...segments: string[]): string;
}
