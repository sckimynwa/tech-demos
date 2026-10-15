import type { OfficeEvent } from "./domain/types";

declare global {
  interface Window {
    Hermes3DOffice?: {
      ingest: (event: OfficeEvent) => void;
    };
  }
}

export {};
