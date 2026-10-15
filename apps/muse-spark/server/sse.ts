import type { SseSender } from "./types";

export function createSseResponse(
  run: (sender: SseSender) => Promise<void>,
): Response {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const sender: SseSender = {
    async send(event, data) {
      await writer.write(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
      );
    },
  };

  void (async () => {
    try {
      await run(sender);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Agent loop failed";
      try {
        await sender.send("error", { message });
      } catch {
        // stream already closed
      }
    } finally {
      try {
        await writer.close();
      } catch {
        // already closed
      }
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function streamText(
  sender: SseSender,
  text: string,
  delayMs: number,
) {
  const chunks = text.split(/(\s+)/).filter((chunk) => chunk.length > 0);
  for (const chunk of chunks) {
    await sender.send("delta", { text: chunk });
    if (delayMs > 0 && !/^\s+$/.test(chunk)) {
      await Bun.sleep(delayMs);
    }
  }
}
