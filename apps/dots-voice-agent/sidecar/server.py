#!/usr/bin/env python3
"""Moonshine Tiny Korean STT sidecar.

Official runtime: pip package ``moonshine-voice`` (ONNX Runtime / .ort).
Korean has no streaming checkpoint — this process only does
``transcribe_without_streaming`` on a VAD-cut utterance from the browser.

CPU-only. Expect ~0.5–1 GB RSS once the Tiny Korean weights are loaded.
"""

from __future__ import annotations

import base64
import json
import os
import struct
import sys
import threading
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = os.environ.get("MOONSHINE_SIDECAR_HOST", "127.0.0.1")
PORT = int(os.environ.get("MOONSHINE_SIDECAR_PORT", "8765"))

state: dict = {
    "ready": False,
    "error": "loading Moonshine Tiny Korean",
    "language": "ko",
    "architecture": "tiny",
    "streaming": False,
    "engine": "moonshine-voice",
    "modelPath": None,
}
transcriber = None
lock = threading.Lock()


def _resolve_model():
    from moonshine_voice import ModelArch, get_model_for_language

    return get_model_for_language(
        wanted_language="ko",
        wanted_model_arch=ModelArch.TINY,
    )


def load_model() -> None:
    global transcriber
    try:
        from moonshine_voice import Transcriber

        path, arch = _resolve_model()
        transcriber = Transcriber(
            model_path=path,
            model_arch=arch,
            options={"max_tokens_per_second": "13.0"},
        )
        state["ready"] = True
        state["error"] = None
        state["modelPath"] = str(path)
        print(f"[moonshine] ready path={path} arch={arch}", file=sys.stderr)
    except Exception as exc:
        state["ready"] = False
        state["error"] = f"{type(exc).__name__}: {exc}"
        print(f"[moonshine] load failed: {state['error']}", file=sys.stderr)
        traceback.print_exc()


def pcm16_b64_to_float(pcm16_b64: str) -> list[float]:
    raw = base64.b64decode(pcm16_b64)
    if len(raw) < 2 or len(raw) % 2:
        raise ValueError("pcm16 must be even-length little-endian int16")
    count = len(raw) // 2
    ints = struct.unpack("<" + "h" * count, raw)
    return [sample / 32768.0 for sample in ints]


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _json(self, code: int, body: object) -> None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path == "/health":
            self._json(200, {k: v for k, v in state.items() if k != "modelPath"} | {
                "modelPath": state.get("modelPath"),
            })
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path != "/transcribe":
            self._json(404, {"error": "not found"})
            return
        if not state["ready"] or transcriber is None:
            self._json(
                503,
                {
                    "error": state["error"]
                    or "Moonshine Tiny Korean is not loaded",
                },
            )
            return
        length = int(self.headers.get("Content-Length", "0"))
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid json"})
            return
        sample_rate = int(payload.get("sampleRate") or 16000)
        try:
            if payload.get("pcm16"):
                audio = pcm16_b64_to_float(str(payload["pcm16"]))
            elif isinstance(payload.get("samples"), list):
                audio = [float(x) for x in payload["samples"]]
            else:
                self._json(400, {"error": "missing pcm16 or samples"})
                return
        except (TypeError, ValueError) as exc:
            self._json(400, {"error": str(exc)})
            return
        if len(audio) < int(sample_rate * 0.12):
            self._json(400, {"error": "utterance too short for Moonshine"})
            return
        try:
            with lock:
                transcript = transcriber.transcribe_without_streaming(
                    audio, sample_rate
                )
            lines = [line.text.strip() for line in transcript.lines if line.text]
            text = " ".join(part for part in lines if part).strip()
            self._json(
                200,
                {
                    "text": text,
                    "engine": "moonshine-tiny-ko",
                    "streaming": False,
                },
            )
        except Exception as exc:
            self._json(500, {"error": f"{type(exc).__name__}: {exc}"})


def main() -> None:
    load_model()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"[moonshine] listening on http://{HOST}:{PORT}", file=sys.stderr)
    server.serve_forever()


if __name__ == "__main__":
    main()
