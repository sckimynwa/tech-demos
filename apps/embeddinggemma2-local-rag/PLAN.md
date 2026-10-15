# PLAN — apps/embeddinggemma2-local-rag

## Goal
Single-user browser app that embeds a local multimodal corpus (text, code, images, short audio) with **EmbeddingGemma 2** and searches it by natural language or image, showing real cosine scores and a 2D PCA map.

## Single-user MVP
- **In:** drag-drop / file ingest; bundled sample corpus that works out of the box; text or image query; ranked results with cosine similarity; 2D embedding map (PCA); first-run local weight download; banner that states **real EmbeddingGemma 2 vs fallback**; `bun install && bun run dev` from this folder
- **Out:** remote API / API keys, multi-user, persisted vector DB, generative RAG chat, video ingest as a first-class drop target, auth, Cloudflare deploy

## Verified availability (2026-10-10)
EmbeddingGemma 2 is real and shipped:
- Weights: `google/embeddinggemma-2` (HF), LiteRT-LM, Ollama `embeddinggemma-2`
- Browser: `@huggingface/transformers` **4.3.1+** + `onnx-community/embeddinggemma-2-ONNX` (q4 ≈ 473 MB: text 175 + vision 109 + audio 189). Official prefixes: `task: search result | query:` / `title: {title} | text:` / `task: code retrieval | query:`
- If WebGPU/WASM OOM or the ONNX bundle fails: **fallback** is CLIP (`Xenova/clip-vit-base-patch32`) for text+image+code-as-text in one space. Audio is excluded from ranking in fallback (never scored in a different space). Scores are always real cosine of the active embedder.

## Tasks (vertical slices)
1. Scaffold Bun + Vite + React + TS under `apps/embeddinggemma2-local-rag/` with `bunfig.toml` (`minimumReleaseAge = 259200`) before any install; shadcn/ui minimalist.
2. Unified `Embedder` interface: try EmbeddingGemma 2 (q4, WebGPU then WASM); on failure load CLIP fallback; progress + real-vs-fallback banner.
3. Ingest drop zone + bundled sample corpus (notes, code, images, one short audio); embed locally; query by text or image; list cosine scores.
4. 2D PCA map of corpus (+ query) colored by modality.
5. README states real vs fallback, first-run download size, and `bun install && bun run dev`. PR gets screenshot + video.

## Stack
- **Bun** — repo runtime / install / scripts
- **Vite + React + TS** — one-screen local-first UI, no server
- **shadcn/ui (zinc, dark)** — minimalist drop zone, inputs, cards
- **`@huggingface/transformers` ≥4.3.1** — official EmbeddingGemma 2 ONNX path in-browser (WebGPU/WASM)
- **PCA in-app** — 2D map without a UMAP/Python dependency
- **Bundled samples in `public/samples/`** — demo works without picking files

## Deferred
- Video file ingest (vision encoder can do frames; skip for MVP drop UX)
- IndexedDB persistence of embeddings across reloads
- UMAP (PCA is enough and deterministic)
- LiteRT-LM / Ollama / Node sidecar
- Cloudflare Pages path deploy
- Generative answer step on top of retrieval

## Success
- `cd apps/embeddinggemma2-local-rag && bun install && bun run dev` works
- PR only touches this app folder
- README/PR state plainly whether the session used EmbeddingGemma 2 or CLIP fallback
- PR includes ≥1 screenshot and ≥1 video of search with real scores
