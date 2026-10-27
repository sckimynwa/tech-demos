export type TargetId = "file" | "github" | "supabase" | "vercel";

export type Pickup = "file" | "edge-immediate" | "next-workflow" | "vercel-deploy";

export interface PlainLine {
  key: string;
  value: string;
}

export interface TargetSpec {
  id: TargetId;
  /** `targets/<rel>.tpl`, project folder included. Sorted lexicographically, same as rekey `tpl.load`. */
  rel: string;
  kind: "file" | "github" | "supabase" | "vercel";
  title: string;
  variable: string;
  plainLines: PlainLine[];
  /** Vercel production is the only kind here that returns a deploy action. */
  redeploy: boolean;
  pickup: Pickup;
  blurb: string;
}

export const TARGETS: readonly TargetSpec[] = [
  {
    id: "file",
    rel: "shop/file/shop/web/.env.local",
    kind: "file",
    title: ".env.local",
    variable: "OPENAI_API_KEY",
    plainLines: [],
    redeploy: false,
    pickup: "file",
    blurb: "Local file. The file is the value; nothing redeploys.",
  },
  {
    id: "github",
    rel: "shop/github/acme/shop",
    kind: "github",
    title: "GitHub Actions",
    variable: "OPENAI_API_KEY",
    plainLines: [],
    redeploy: false,
    pickup: "next-workflow",
    blurb: "Secret is write-only. The next workflow run picks it up. rekey cannot read it back.",
  },
  {
    id: "supabase",
    rel: "shop/supabase/shopproj",
    kind: "supabase",
    title: "Supabase secrets",
    variable: "OPENAI_API_KEY",
    plainLines: [],
    redeploy: false,
    pickup: "edge-immediate",
    blurb: "Edge Function secrets apply at once. No separate redeploy, and rekey cannot read them back.",
  },
  {
    id: "vercel",
    rel: "shop/vercel/shop/production",
    kind: "vercel",
    title: "Vercel production",
    variable: "OPENAI_API_KEY",
    plainLines: [{ key: "APP_URL", value: "https://shop.example.com" }],
    redeploy: true,
    pickup: "vercel-deploy",
    blurb: "Env write does not restart production. rekey asks before redeploying (default no). Preview would not redeploy.",
  },
];

export function targetsInPropagationOrder(): TargetSpec[] {
  return [...TARGETS].sort((a, b) => a.rel.localeCompare(b.rel));
}

export function targetById(id: TargetId): TargetSpec {
  const found = TARGETS.find((target) => target.id === id);
  if (!found) {
    throw new Error(`unknown target ${id}`);
  }
  return found;
}
