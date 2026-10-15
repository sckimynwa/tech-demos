const encoder = new TextEncoder();

export function writeSse(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: unknown,
): void {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

export function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export function sseStream(
  run: (controller: ReadableStreamDefaultController<Uint8Array>) => Promise<void>,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await run(controller);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown stream error";
        writeSse(controller, { type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
