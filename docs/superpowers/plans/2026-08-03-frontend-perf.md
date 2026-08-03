# Frontend Perf — Memoization & Pemisahan Komponen Hasil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghentikan re-render tabel hasil saat mengetik input, dengan memindahkan seluruh blok hasil (KPI + audit trail) ke satu komponen `memo` — tanpa mengubah fitur/tampilan apa pun.

**Architecture:** Ekstrak `results` region (page.tsx:441-478 helper + :952-1298 blok hasil) ke `app/components/ResultsPanel.tsx` yang dibungkus `React.memo`; props stabil via `useMemo`/`useCallback` di Home. Setelah ini, keystroke di input hanya me-render Home, bukan panel hasil.

**Tech Stack:** React 19, Next.js 16, Tailwind.

## Global Constraints

- Tampilan 100% identik (copy-paste JSX apa adanya, hanya pindah lokasi + ganti `(row: any)` → tipe).
- Tidak boleh menambah error lint baru (helper yang dipindah ditype dengan benar → error lint malah turun).
- Tidak menyentuh: API route, logika AI, state management, format data.

---

### Task 1: Buat `app/components/ResultsPanel.tsx`

**Files:**
- Create: `app/components/ResultsPanel.tsx`

- [ ] **Step 1:** Buat file dengan `'use client'`, `memo`, tipe data (`Domain`, `PureNameResultRow`, `MatchResultRow`, `ResultsPanelProps`)
- [ ] **Step 2:** Pindahkan helper (`getRowAverageScore`, `isRecordClean`, `isRecordReview`, `getStatusBadge`) — parameter `(row: any)` → tipe; konstanta statistik dalam `useMemo`
- [ ] **Step 3:** Pindahkan seluruh blok `{results.length > 0 && (...)}` (KPI cards + header + PURE_NAME view + MATCH view) tanpa mengubah JSX
- [ ] **Step 4:** Export `memo(function ResultsPanel(props) { ... })`
- [ ] **Step 5:** `npx vitest run` tetap 19 PASS

### Task 2: Rampingkan `page.tsx`

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1:** Hapus helper 441-478
- [ ] **Step 2:** Ganti blok 951-1298 dengan `<ResultsPanel ... />`
- [ ] **Step 3:** `useMemo` untuk `activeDomains` + `useCallback` untuk `handleClearResults`
- [ ] **Step 4:** Import ResultsPanel + hooks
- [ ] **Step 5:** Pastikan tidak ada sisa referensi helper di Home

### Task 3: Verifikasi penuh

- [ ] `npx vitest run` → 19 PASS
- [ ] `npm run lint` → error berkurang (helper `any` ikut hilang)
- [ ] `npm run build` → sukses
- [ ] Runtime smoke: PURE_NAME single & batch, MATCH single & batch, ketik input saat hasil tampil, Clear Hasil jalan
