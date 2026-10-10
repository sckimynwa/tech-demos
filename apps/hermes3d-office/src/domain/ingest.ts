import { useEffect } from "react";
import { isOfficeEvent } from "./events";
import type { OfficeEvent } from "./types";

export const useOfficeIngest = (onEvent: (event: OfficeEvent) => void) => {
  useEffect(() => {
    window.Hermes3DOffice = {
      ingest(event: OfficeEvent) {
        if (isOfficeEvent(event)) onEvent(event);
      },
    };

    const spec = new URLSearchParams(window.location.search).get("events");
    let socket: WebSocket | undefined;
    if (spec?.startsWith("ws://") || spec?.startsWith("wss://")) {
      socket = new WebSocket(spec);
      socket.onmessage = (message) => {
        try {
          const parsed: unknown = JSON.parse(String(message.data));
          if (isOfficeEvent(parsed)) onEvent(parsed);
        } catch {
          // ignore malformed frames
        }
      };
    }

    return () => {
      socket?.close();
      delete window.Hermes3DOffice;
    };
  }, [onEvent]);
};
