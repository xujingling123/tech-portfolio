/** 从 DeerFlow SSE 帧中提取可展示的 assistant 文本增量 */
export function extractAssistantTextFromSseEvent(
  eventName: string,
  dataLine: string
): string {
  if (!dataLine || dataLine === "[DONE]") return "";

  let payload: unknown;
  try {
    payload = JSON.parse(dataLine) as unknown;
  } catch {
    return "";
  }

  if (eventName === "messages" && payload && typeof payload === "object") {
    const p = payload as { role?: string; content?: unknown };
    if (p.role === "assistant" && typeof p.content === "string") {
      return p.content;
    }
  }

  if (eventName === "messages-tuple" && Array.isArray(payload)) {
    const [, chunk] = payload as [unknown, { type?: string; content?: unknown }];
    if (
      chunk &&
      typeof chunk === "object" &&
      (chunk as { type?: string }).type === "ai" &&
      typeof (chunk as { content?: unknown }).content === "string"
    ) {
      return (chunk as { content: string }).content;
    }
  }

  if (payload && typeof payload === "object") {
    const p = payload as { type?: string; content?: unknown };
    if (p.type === "ai" && typeof p.content === "string") return p.content;
  }

  return "";
}

export async function* iterateSseText(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<{ event: string; data: string; text: string }> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const raw = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");

        let dataLine = "";
        for (const line of raw.split("\n")) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLine += line.slice(5).trim();
          }
        }

        if (dataLine) {
          yield {
            event: eventName,
            data: dataLine,
            text: extractAssistantTextFromSseEvent(eventName, dataLine),
          };
        }
        eventName = "message";
      }
    }
  } finally {
    reader.releaseLock();
  }
}
