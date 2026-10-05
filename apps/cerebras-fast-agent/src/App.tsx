import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingPlayground } from "@/features/booking/BookingPlayground";
import { SpeedChat } from "@/features/chat/SpeedChat";
import { SOURCE_POST_URL } from "@/shared/constants";
import type { RuntimeMode } from "@/shared/protocol";

type Health = {
  mode: RuntimeMode;
  model: string;
};

export function App() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    void fetch("/api/health")
      .then((response) => response.json())
      .then((json) => setHealth(json as Health))
      .catch(() => setHealth(null));
  }, []);

  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_42%),linear-gradient(to_bottom,_transparent,_rgba(0,0,0,0.35))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[28px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="relative mx-auto flex min-h-svh max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-[11px] tracking-[0.28em] text-amber-300/80 uppercase">
              tech-demos / cerebras-fast-agent
            </p>
            <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
              Cerebras speed + parallel tools
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Streaming OpenAI-compatible chat with a live tok/s needle, then a
              restaurant-booking agent that races sequential vs parallel tool-call
              timelines.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={health?.mode === "live" ? "default" : "secondary"}>
              {health?.mode === "live" ? "LIVE" : "MOCK LATENCY"}
            </Badge>
            <Badge variant="outline" className="font-mono">
              {health?.model ?? "connecting…"}
            </Badge>
          </div>
        </header>

        <Tabs defaultValue="chat">
          <TabsList>
            <TabsTrigger value="chat">Speed chat</TabsTrigger>
            <TabsTrigger value="booking">Booking race</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="mt-4">
            <SpeedChat />
          </TabsContent>
          <TabsContent value="booking" className="mt-4">
            <BookingPlayground />
          </TabsContent>
        </Tabs>

        <footer className="mt-auto pt-4 text-xs text-muted-foreground">
          Source:{" "}
          <a
            href={SOURCE_POST_URL}
            className="text-amber-200 underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            @cerebras · 20x faster Grok bot
          </a>
          . Key stays on the Bun server. Unset <code>CEREBRAS_API_KEY</code> for
          simulated streams.
        </footer>
      </div>
    </div>
  );
}

export default App;
