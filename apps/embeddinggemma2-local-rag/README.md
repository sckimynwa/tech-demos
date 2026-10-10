# EmbeddingGemma 2 — local multimodal search

Single-user browser demo: ingest text, code, images, and short audio, embed **on-device**, and search with a text or image query. Cross-modal matching (text finds images, and vice versa) is the point.

```bash
cd apps/embeddinggemma2-local-rag
bun install
bun run dev
```

Open the Vite URL. First run downloads model weights from Hugging Face (cached afterwards). No API keys.

## Real vs fallback

| Mode | What actually runs | Modalities in one space | First-run download |
| --- | --- | --- | --- |
| **REAL** | [EmbeddingGemma 2](https://huggingface.co/google/embeddinggemma-2) via [`@huggingface/transformers` 4.3.1+](https://github.com/huggingface/transformers.js/releases/tag/4.3.1) and [`onnx-community/embeddinggemma-2-ONNX`](https://huggingface.co/onnx-community/embeddinggemma-2-ONNX) (q4) | text, code, image, audio (768-d) | ~473 MB (text 175 + vision 109 + audio 189) |
| **FALLBACK** | CLIP `Xenova/clip-vit-base-patch32` (q8) | text, code-as-text, image | smaller CLIP pair |

The banner is explicit: **REAL** or **FALLBACK**. If EmbeddingGemma 2 fails (WebGPU missing, WASM OOM, download error), the app loads CLIP behind the same `Embedder` interface.

- Scores are **real cosine similarity** of the active embedder. Nothing is faked.
- In fallback, **audio is not scored** (it is not in CLIP space). Those items show `skip`.
- Force fallback: `?fallback=1` or the **Use CLIP fallback** button while weights download.
- Retry the real model with **Retry EmbeddingGemma 2**.

Verified 2026-10-10: EmbeddingGemma 2 is a real Google DeepMind release (Apache-2.0, ~740M, Gemma 4 stack). Also on LiteRT-LM and Ollama; this demo uses the official transformers.js ONNX path so `bun run dev` stays browser-local.

Task prefixes (real model only), from the model card:

- query: `task: search result | query: …` (or `task: code retrieval | query:` when the checkbox is on)
- document: `title: {title} | text: {content}`
- images / audio: no prefix

## Sample corpus

Bundled under `public/samples/`:

- notes: aurora, Mars / Red Planet, pour-over coffee
- code: `binary-search.ts`
- images: cats on a couch, Mars, sea turtle, pour-over coffee
- audio: JFK inaugural excerpt (`jfk.wav` from [Xenova/transformers.js-docs](https://huggingface.co/datasets/Xenova/transformers.js-docs) — public-domain speech; same clip as the official EG2 JS snippet)

Try: `cats sleeping on a couch`, `the red planet`, `sea turtle in the ocean`, `pour-over coffee`, `a president's speech about serving your country`, `binary search over a sorted array`.

## Stack

Vite + React + Bun + shadcn/ui. PCA (not UMAP) for the 2D map. All inference in the tab.

## Out of scope

Remote APIs, persisted index, video ingest, generative RAG chat.
