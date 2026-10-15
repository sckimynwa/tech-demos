export async function consumeSse<T extends { type: string }>(
  response: Response,
  onEvent: (event: T) => void,
): Promise<void> {
  if (!response.body) {
    throw new Error("Response has no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      onEvent(JSON.parse(payload) as T);
    }
  }

  const leftover = buffer.trim();
  if (leftover.startsWith("data:")) {
    const payload = leftover.slice(5).trim();
    if (payload && payload !== "[DONE]") {
      onEvent(JSON.parse(payload) as T);
    }
  }
}
