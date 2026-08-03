# Fix Latensi + AI Streaming Progress (SSE) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Mematikan thinking mode AI yang terbukti membuat latensi 39,7s → 3,0s (13×), dan (2) streaming token AI ke browser via SSE agar UI menunjukkan progress live.

**Architecture:** `transformRequestBody` pada provider menyuntik `thinking: {type:'disabled'}` + `reasoning_effort:'low'` ke semua request. `/api/process` diubah menjadi SSE: `streamText` → event `progress`/`retry`/`result`/`error`. Frontend membaca stream dengan `fetch` + `ReadableStream`, menampilkan panel progress live, `setResults` saat event `result`.

**Tech Stack:** Next.js 16, AI SDK v7 (`streamText`), SSE.

## Global Constraints

- Payload event `result` identik dengan respons JSON lama: `{success, mode, data}` / `{success, data}`.
- Logika prompt, `safeParseJson`, `buildPureNameResults`, `buildFinalResults`, `decideStatus` tidak berubah.
- Retry-once (`JSON_ONLY_REPROMPT`) dipertahankan; event `retry` dikirim.
- Tidak ada error lint baru.

## Kontrak SSE

```
event: progress → data: {"text":"<chunk>"}
event: retry    → data: {"message":"..."}
event: result   → data: {"success":true,"mode":"...","data":[...]}
event: error    → data: {"success":false,"error":"..."}
```

---

### Task 1: Fix latensi — `aiRequestBodyTransform` (thinking disabled)

**Files:** Modify `app/api/process/route.ts`, Modify `tests/route-helpers.test.ts`

- [ ] Export `aiRequestBodyTransform` yang menyuntik `thinking: {type:'disabled'}` + `reasoning_effort:'low'`
- [ ] Pasang ke `createOpenAICompatible({ ..., transformRequestBody: aiRequestBodyTransform })`
- [ ] Unit test: field lain dipertahankan, `thinking`/`reasoning_effort` tersuntik
- [ ] Verifikasi cepat via SDK: prompt PURE_NAME 4 item → target ≤ 5s

### Task 2: Streaming generator + SSE response di route.ts

**Files:** Modify `app/api/process/route.ts`

- [ ] Hapus `generateText` dari import, tambah `streamText`
- [ ] `streamJsonProcess(prompt, finalize)` async generator: per attempt `streamText` + yield `progress` per chunk; valid → `result`; invalid → `retry` (attempt 2 dengan `JSON_ONLY_REPROMPT`); 2× gagal → `error`
- [ ] Helper `sseEvent(name, data)` + `processStreamResponse(stream)` (ReadableStream, header `text/event-stream`)
- [ ] Ganti kedua call site (PURE_NAME & MATCH) → `processStreamResponse(streamJsonProcess(prompt, finalize))`; guard rawData kosong → event `result` langsung; validasi domains → event `error`; pindahkan try/catch ke dalam generator

### Task 3: Update unit test ke `streamJsonProcess`

**Files:** Modify `tests/route-helpers.test.ts`

- [ ] Mock `streamText` (bukan `generateText`) dengan textStream chunked
- [ ] Test: chunk valid → progress×N + result; invalid→retry→progress→result (2 call, prompt kedua + REPROMPT); 2× invalid → error; finalize throw → error

### Task 4: Frontend SSE reader + panel progress

**Files:** Modify `app/page.tsx`

- [ ] State `streamProgress`; reader SSE di `processAI` (buffer `\n\n`, parse `event:`/`data:`, handler per tipe)
- [ ] Panel progress saat `loading` (auto-scroll via ref + useEffect kecil)
- [ ] Hasil tetap `setResults(payload.data)`; error → `showAlert`

### Task 5: Verifikasi penuh

- [ ] `npx vitest run` → semua PASS
- [ ] `npm run lint` → 11 masalah pre-existing, 0 baru
- [ ] `npm run build` → sukses
- [ ] Runtime: PURE_NAME 1 item → SSE progress token berjalan + `result` (ukur total waktu, bandingkan baseline ~40s; target ≤ 5s); MATCH 1 item → sama; rawData `[]` → `result` langsung; domains kosong → `error`; Cek browser panel progress + hasil tampil
- [ ] Commit ke dev
