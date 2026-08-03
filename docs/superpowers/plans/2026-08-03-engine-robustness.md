# Engine Robustness (Tanpa Ubah Fitur) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperkuat ketahanan parsing & validasi output AI di `app/api/process/route.ts` tanpa mengubah fitur/format API.

**Architecture:** Semua perbaikan di satu file (`route.ts`, mengikuti pola existing) + helper murni yang bisa di-test, dengan retry-once bila AI tidak menghasilkan JSON valid.

**Tech Stack:** Next.js 16, AI SDK v7, vitest (dev-dep baru untuk test helper).

## Global Constraints

- Tidak mengubah: format request/response API, mode PURE_NAME/MATCH, prompt utama, threshold logic, field output.
- Perbaikan hanya: parsing JSON, sanitasi index/confidence, pengisian baris hilang, guard rawData kosong, retry-once.
- Commit hanya jika diminta user (perubahan migrasi sebelumnya juga masih uncommitted).

---

### Task 1: Test runner + helper `extractJsonArray` & `safeParseJson`

**Files:**
- Modify: `package.json` (script test), `app/api/process/route.ts` (tambah 2 helper + export)
- Create: `tests/route-helpers.test.ts`

- [ ] **Step 1:** `npm i -D vitest`, tambah `"test": "vitest run"` di scripts
- [ ] **Step 2:** Tulis failing test
- [ ] **Step 3:** Jalankan → FAIL (`extractJsonArray` belum ada)
- [ ] **Step 4:** Implementasi helper di route.ts
- [ ] **Step 5:** Jalankan test → PASS, `npm run lint` — error lint hanya yang pre-existing

### Task 2: `generateJsonArray` dengan retry-once

**Files:** Modify `app/api/process/route.ts`

**Interfaces:**
- Consumes: `safeParseJson(text): any[] | null`
- Produces: `generateJsonArray(prompt: string): Promise<any[] | null>` — dipakai kedua mode; `null` = gagal setelah retry

- [ ] **Step 1:** Tulis failing test (mock `ai` module)
- [ ] **Step 2:** Jalankan → FAIL (fungsi belum ada)
- [ ] **Step 3:** Implementasi `generateJsonArray` dengan retry-once + `JSON_ONLY_REPROMPT`
- [ ] **Step 4:** Ganti kedua call site (PURE_NAME & MATCH), hapus strip regex lama + `JSON.parse`
- [ ] **Step 5:** Test PASS + lint

### Task 3: `buildPureNameResults` — isi baris hilang + urutkan

**Files:** Modify `app/api/process/route.ts`

**Interfaces:**
- Produces: `buildPureNameResults(aiResultJson: any[], formattedRaw: any[]): any[]`

- [ ] **Step 1:** Failing test: valid; AI omit index → baris terisi `{ raw_index, original, cleansed_pure_name: null, stripped_noise: [] }`; ascending
- [ ] **Step 2:** Implementasi (Map + fill + sort)
- [ ] **Step 3:** Ganti mapping PURE_NAME (`data: buildPureNameResults(...)`)
- [ ] **Step 4:** Test PASS

### Task 4: `buildFinalResults` — sanitize index/confidence + isi baris hilang + urutkan

**Files:** Modify `app/api/process/route.ts`

**Interfaces:**
- Consumes: `decideStatus`, `formattedRaw`, `domains`
- Produces: `buildFinalResults(aiResultJson: any[], formattedRaw: any[], domains: any[], autoApproveMin: number, stewardReviewMin: number): any[]`

- [ ] **Step 1:** Failing test: index valid; index out of range → TIDAK DITEMUKAN + confidence 0; index non-integer → sama; raw_index hilang → diisi NO_MATCH; urut acak → ascending
- [ ] **Step 2:** Implementasi (blok mapping lama dipindah ke fungsi, dengan sanitize)
- [ ] **Step 3:** Route memanggil `buildFinalResults(...)` menggantikan blok lama
- [ ] **Step 4:** Test PASS + lint

### Task 5: Guard rawData kosong (tanpa call AI)

**Files:** Modify `app/api/process/route.ts`

- [ ] **Step 1:** PURE_NAME: rawData kosong → `{ success: true, mode: 'PURE_NAME', data: [] }`
- [ ] **Step 2:** MATCH (setelah validasi domains): rawData kosong → `{ success: true, data: [] }`

### Task 6: Verifikasi penuh

- [ ] `npx vitest run` → semua PASS
- [ ] `npm run lint` → error hanya pre-existing
- [ ] `npm run build` → sukses
- [ ] Runtime: `npm start` + tes API: PURE_NAME normal, MATCH normal, PURE_NAME `[]`, MATCH `[]` — hasil identik baseline
