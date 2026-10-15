import type { BinaryRef } from "./types.ts";

export function normalizePath(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;
  const parts: string[] = [];
  for (const seg of trimmed.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") {
      if (parts.length === 0) return null;
      parts.pop();
      continue;
    }
    parts.push(seg);
  }
  return `/${parts.join("/")}`;
}

export function pathCovered(target: string, prefix: string): boolean {
  const base = prefix.endsWith("/") && prefix !== "/" ? prefix.slice(0, -1) : prefix;
  if (base === "/") return target === "/";
  return target === base || target.startsWith(`${base}/`);
}

export function globToRegExp(glob: string): RegExp {
  let out = "^";
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i] ?? "";
    const next = glob[i + 1];
    if (char === "*" && next === "*") {
      out += ".*";
      i += 1;
    } else if (char === "*") {
      out += ".*";
    } else if (char === "?") {
      out += ".";
    } else if ("+()[]{}|^$\\.".includes(char)) {
      out += `\\${char}`;
    } else {
      out += char;
    }
  }
  return new RegExp(`${out}$`, "i");
}

export function globMatch(pattern: string, value: string): boolean {
  return globToRegExp(pattern).test(value);
}

export function hostMatches(pattern: string, host: string): boolean {
  return globMatch(pattern.toLowerCase(), host.toLowerCase());
}

export function binaryPath(ref: BinaryRef): string {
  return typeof ref === "string" ? ref : ref.path;
}

export function toolMatches(
  matcher: string | { any: string[] } | undefined,
  tool: string | undefined,
): boolean {
  if (!matcher) return true;
  if (!tool) return false;
  if (typeof matcher === "string") return globMatch(matcher, tool);
  return matcher.any.some((item) => globMatch(item, tool));
}

const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const READ_WRITE_METHODS = new Set([
  "GET",
  "HEAD",
  "OPTIONS",
  "POST",
  "PUT",
  "PATCH",
]);

export function methodAllowedByAccess(
  access: "read-only" | "read-write" | "full",
  method: string,
): boolean {
  const upper = method.toUpperCase();
  if (access === "full") return true;
  if (access === "read-only") return READ_ONLY_METHODS.has(upper);
  return READ_WRITE_METHODS.has(upper);
}
