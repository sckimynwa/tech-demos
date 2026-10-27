import { maskSecret } from "@/domain/secrets.ts";

export function Secret({ value }: { value: string }) {
  return <span className="font-mono tracking-tight">{maskSecret(value)}</span>;
}
