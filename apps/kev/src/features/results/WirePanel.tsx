import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SystemOneRequest, SystemOneResponse } from "@/shared/systemone";

type WirePanelProps = {
  request: SystemOneRequest | null;
  response: SystemOneResponse | null;
};

export function WirePanel({ request, response }: WirePanelProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="px-0">
          Wire format
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <Tabs defaultValue="request">
          <TabsList>
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>
          <TabsContent value="request">
            <JsonBlock value={request} empty="Run once to capture the exact POST body." />
          </TabsContent>
          <TabsContent value="response">
            <JsonBlock value={response} empty="No response yet." />
          </TabsContent>
        </Tabs>
      </CollapsibleContent>
    </Collapsible>
  );
}

function JsonBlock({ value, empty }: { value: unknown; empty: string }) {
  const [copied, setCopied] = useState(false);
  const text = value == null ? "" : JSON.stringify(value, null, 2);
  return (
    <div className="relative">
      {text ? (
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="absolute top-2 right-2"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      ) : null}
      <pre className="max-h-80 overflow-auto rounded-lg bg-muted/60 p-3 font-mono text-[11px] leading-relaxed">
        {text || empty}
      </pre>
    </div>
  );
}
