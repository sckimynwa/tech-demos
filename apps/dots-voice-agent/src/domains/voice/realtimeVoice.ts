import { REALTIME_CALLS_URL } from "@/lib/constants";
import type { TaskKind } from "@/domains/queue/types";
import type { VoiceSession, VoiceSessionHandlers } from "./types";

type RealtimeEvent = {
  type: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  transcript?: string;
  delta?: string;
};

const TOOL_TO_KIND: Record<string, TaskKind> = {
  queue_research: "research",
  queue_summary: "summary",
  queue_file_write: "file_write",
};

async function mintClientSecret() {
  const response = await fetch("/api/realtime/client-secret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const payload = (await response.json()) as {
    value?: string;
    error?: string;
  };
  if (!response.ok || !payload.value) {
    throw new Error(payload.error || "Could not mint Realtime client secret");
  }
  return payload.value;
}

export function createRealtimeVoiceSession(
  handlers: VoiceSessionHandlers,
): VoiceSession {
  let peer: RTCPeerConnection | null = null;
  let channel: RTCDataChannel | null = null;
  let mic: MediaStream | null = null;
  let remoteAudio: HTMLAudioElement | null = null;
  let live = false;
  let transcriptBuffer = "";

  const send = (event: Record<string, unknown>) => {
    if (channel?.readyState === "open") {
      channel.send(JSON.stringify(event));
    }
  };

  const handleEvent = (event: RealtimeEvent) => {
    if (event.type === "input_audio_buffer.speech_started") {
      handlers.onMic("listening");
      return;
    }
    if (event.type === "input_audio_buffer.speech_stopped") {
      return;
    }
    if (event.type === "response.output_audio.delta") {
      handlers.onMic("speaking");
      return;
    }
    if (event.type === "response.output_audio_transcript.delta" && event.delta) {
      transcriptBuffer += event.delta;
      return;
    }
    if (event.type === "response.output_audio_transcript.done") {
      const spoken = (event.transcript || transcriptBuffer).trim();
      transcriptBuffer = "";
      if (spoken) {
        handlers.onSpoke(spoken);
      }
      handlers.onMic("listening");
      return;
    }
    if (
      event.type === "conversation.item.input_audio_transcription.completed" &&
      event.transcript
    ) {
      handlers.onHeard(event.transcript);
      return;
    }
    if (event.type === "response.function_call_arguments.done") {
      const kind = event.name ? TOOL_TO_KIND[event.name] : undefined;
      if (!kind || !event.call_id) {
        return;
      }
      let query = "";
      try {
        const parsed = JSON.parse(event.arguments || "{}") as { query?: string };
        query = parsed.query?.trim() || "";
      } catch {
        query = "";
      }
      const taskId = handlers.onTool(kind, query || event.name || kind);
      send({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: event.call_id,
          output: JSON.stringify({ queued: true, taskId }),
        },
      });
      send({ type: "response.create" });
    }
  };

  return {
    async connect() {
      const ephemeral = await mintClientSecret();
      const audio = document.createElement("audio");
      audio.autoplay = true;
      remoteAudio = audio;

      const pc = new RTCPeerConnection();
      peer = pc;
      pc.ontrack = (trackEvent) => {
        audio.srcObject = trackEvent.streams[0] ?? null;
      };

      mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      for (const track of mic.getTracks()) {
        pc.addTrack(track, mic);
      }

      const dc = pc.createDataChannel("oai-events");
      channel = dc;
      dc.addEventListener("message", (message) => {
        try {
          handleEvent(JSON.parse(String(message.data)) as RealtimeEvent);
        } catch {
          // ignore malformed events
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(REALTIME_CALLS_URL, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeral}`,
          "Content-Type": "application/sdp",
        },
      });
      if (!sdpResponse.ok) {
        throw new Error(`Realtime SDP exchange failed (${sdpResponse.status})`);
      }
      const answer = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answer });
      live = true;
      handlers.onMic("listening");
    },
    disconnect() {
      live = false;
      channel?.close();
      peer?.close();
      mic?.getTracks().forEach((track) => track.stop());
      if (remoteAudio) {
        remoteAudio.srcObject = null;
      }
      channel = null;
      peer = null;
      mic = null;
      remoteAudio = null;
      handlers.onMic("idle");
    },
    async speak(text) {
      if (!live) {
        return;
      }
      handlers.onSpoke(text);
      send({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: `[TASK COMPLETE — speak this result first]\n${text}`,
            },
          ],
        },
      });
      send({
        type: "response.create",
        response: {
          instructions:
            "Speak the task result first, immediately. Lead with the completion phrase. Do not wait for the user.",
        },
      });
    },
    submitUtterance(text) {
      if (!live) {
        return;
      }
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      handlers.onHeard(trimmed);
      send({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: trimmed }],
        },
      });
      send({ type: "response.create" });
    },
  };
}
