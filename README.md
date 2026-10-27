# ATS CV Builder 📄✨

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-black.svg)](https://www.fastify.io/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Aplikasi web modern untuk membuat, mengimpor, menyempurnakan, dan mengekspor Curriculum Vitae (CV) yang ramah terhadap sistem **Applicant Tracking System (ATS)**.

Aplikasi ini mengusung prinsip **local-first** dan **zero-persistence**: tanpa akun, tanpa registrasi, dan tanpa database penyimpanan permanen. Semua data CV hanya disimpan di memori browser pengguna dan diproses secara *transient* di backend.

---

## 🔒 Kebijakan Keamanan & Aturan Upload ke GitHub

Repositori ini bersifat **Publik**. Seluruh kontributor dan pengguna wajib mematuhi aturan keamanan berikut:

### ❌ Dilarang Keras Diunggah:
- **File Environment & Kredensial:** `.env`, `backend/.env`, `.env.local`, `.env.production`, atau file kredensial cloud.
- **Kunci Rahasia & API Key:** OpenAI / Qwen key (`AI_API_KEY`), OCR.Space key (`OCR_SPACE_API_KEY`), DeepL key, auth token ngrok, GitHub Personal Access Token, private SSH keys, dan sertifikat SSL.
- **Data Pribadi (PII):** Dokumen CV asli pengguna (format PDF/Word yang memuat nama asli, NIK, alamat, telepon).
- **Dependensi & Vendor:** Folder `node_modules/`.
- **Hasil Build & Compile:** Folder `dist/`, `build/`, `out/`, dan file `*.tsbuildinfo`.
- **Log & Pengujian:** File `*.log`, `playwright-report/`, `test-results/`, dan folder `coverage/`.

### ✅ Yang Diperbolehkan:
- **Source Code Asli:** Seluruh kode aplikasi di `frontend/src/`, `backend/src/`, dan `shared/`.
- **Template Konfigurasi Dummy:** `backend/.env.example` (hanya placeholder tanpa kredensial nyata).
- **Konfigurasi Proyek:** `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`.
- **Data Pengujian Mock:** Data uji anonim (seperti data fiktif Budi Santoso / Alex Morgan).
- **Dokumentasi & Lisensi:** `README.md` dan `LICENSE`.

---

## 🌟 Fitur Utama

- 🎯 **ATS-Compliant Design**: Format struktur CV kanonik yang terbaca optimal oleh parser ATS (urutan section standar, hirarki heading jelas, tanpa tabel bertingkat yang membingungkan parser).
- ⚡ **Live Multi-Page Preview (A4)**: Sistem kalkulasi paginasi dinamis yang otomatis membagi konten ke halaman A4 berikutnya tanpa memotong baris atau heading secara canggung.
- 🤖 **AI Writing Assistant (Factuality-Guaranteed)**: Membantu memformulasi bullet point berorientasi aksi (strong verbs + metrics) dengan guardrail ketat agar AI tidak mengarang fakta/pengalaman yang tidak ada.
- 📥 **Import Cerdas (DOCX, PDF, OCR)**:
  - Ekstraksi teks dari file Word (.docx) & PDF berbasis teks.
  - **OCR Fallback**: Jika PDF berupa pindaian/scan gambar, backend mengintegrasikan OCR.Space (dengan persetujuan pengguna terlebih dahulu).
  - Review dialog per section sebelum data diterapkan ke editor.
- 🌐 **Dukungan Bilingual (ID / EN)**:
  - Pengubahan bahasa CV (English / Bahasa Indonesia) secara instan.
  - Opsi terjemahan otomatis konten saat proses import via API MyMemory.
- 📤 **Ekspor Siap Lamar**:
  - Ekspor ke **PDF (A4)** berkualitas tinggi menggunakan rendering Chromium (Playwright).
  - Ekspor ke **DOCX (Microsoft Word)** dengan struktur ATS yang rapi.
- 🔒 **Privasi Mutlak**: Tanpa penyimpanan database; sesi bersifat *transient* dan log backend bebas dari data PII.

---

## 📁 Struktur Direktori

```text
ats-cv-builder/
├── shared/                   # Skema kanonik bersama (Zod) & i18n
│   └── cv-schema/            # Validasi tipe CV untuk frontend & backend
├── backend/                  # REST API stateless (Node.js + Fastify + TypeScript)
│   ├── src/
│   │   ├── routes/           # Endpoint import, export, ai, validation
│   │   ├── services/         # Parser docx/pdf, OCR, AI, generator PDF/DOCX
│   │   ├── templates/        # Template HTML CV A4 untuk engine Playwright
│   │   └── utils/            # Validasi magic bytes file, sanitasi, tanggal
│   ├── test/                 # Pengujian unit (vitest)
│   ├── .env.example          # Template environment variabel (aman untuk di-commit)
│   └── package.json
├── frontend/                 # Client SPA (React + TypeScript + Vite + Tailwind)
│   ├── src/
│   │   ├── components/       # Editor form, live preview paginasi A4, panel AI
│   │   ├── stores/           # Zustand store (state management + undo/redo)
│   │   └── lib/              # HTTP client ke backend
│   └── package.json
├── .gitignore                # Aturan penyaringan file sensitif & build artifacts
├── package.json              # Root package (npm workspaces)
└── README.md                 # Dokumentasi proyek
```

---

## 🚀 Memulai (Quick Start)

### 1. Prasyarat
- **Node.js** v18.0.0 atau lebih baru
- **npm** v9.0.0 atau lebih baru

### 2. Instalasi Dependensi
Jalankan instalasi dari root repositori (menggunakan fitur npm workspaces):

```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin template konfigurasi di folder backend:

```bash
cp backend/.env.example backend/.env
```

Buka `backend/.env` lalu lengkapi kunci yang diperlukan:
- `OCR_SPACE_API_KEY`: API key dari [ocr.space](https://ocr.space/ocrapi) (gratis).
- `AI_API_KEY` & `AI_BASE_URL`: API key OpenAI atau endpoint yang kompatibel (OpenRouter, DeepSeek, Qwen, dll).

> ⚠️ **PENTING**: Jangan pernah melakukan commit file `backend/.env` ke Git! Pastikan selalu masuk ke dalam `.gitignore`.

### 4. Menjalankan di Mode Pengembangan (Development)

Buka dua terminal terpisah:

**Terminal 1 — Backend:**
```bash
npm run dev
# Berjalan pada http://127.0.0.1:4000
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
# Berjalan pada http://localhost:5173
```

Buka browser Anda di `http://localhost:5173`.

---

## 🛠️ Konfigurasi Environment (`backend/.env`)

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `4000` | Port listen server backend |
| `HOST` | `127.0.0.1` | Bind host interface backend |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowlist origin frontend yang diizinkan (pisahkan dengan koma) |
| `MAX_FILE_MB_DOC` | `10` | Batas maksimum ukuran file dokumen saat diunggah (MB) |
| `MAX_FILE_MB_IMAGE` | `10` | Batas maksimum ukuran gambar untuk OCR (MB) |
| `OCR_SPACE_API_KEY` | - | Kunci API OCR.Space untuk pengenalan teks PDF pindaian |
| `OCR_SPACE_DEFAULT_ENGINE` | `2` | Mesin OCR utama |
| `OCR_SPACE_FALLBACK_ENGINE` | `3` | Mesin cadangan jika mesin utama gagal |
| `AI_BASE_URL` | `https://api.openai.com/v1` | URL basis endpoint OpenAI-compatible |
| `AI_API_KEY` | - | Kunci API untuk asisten penulisan AI |
| `AI_MODEL` | `gpt-4o-mini` | Nama model AI yang digunakan |
| `AI_MAX_TOKENS` | `1200` | Batas output token AI |
| `TRANSLATE_ENDPOINT` | `https://api.mymemory.translated.net/get` | Endpoint API terjemahan publik (MyMemory) |
| `TRANSLATE_EMAIL` | - | Email opsional untuk menaikkan kuota terjemahan MyMemory |

---

## 📡 Daftar Endpoint API Backend

| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health` | Status server dan ketersediaan layanan OCR & AI |
| `POST` | `/api/import/docx` | Unggah file `.docx` → ekstraksi struktur CV & teks |
| `POST` | `/api/import/pdf` | Unggah file `.pdf` → ekstraksi text-layer (flag `requiresOcr` jika hasil scan) |
| `POST` | `/api/ocr` | Kirim file scan ke OCR.Space dengan fallback engine |
| `POST` | `/api/export/docx` | Konversi struktur CV ke dokumen `.docx` ATS terformat |
| `POST` | `/api/export/pdf` | Konversi struktur CV ke dokumen `.pdf` A4 via Chromium Headless |
| `POST` | `/api/validate` | Analisis heuristik kesesuaian format ATS (`pass`/`warn`/`fail`) |
| `POST` | `/api/ai/improve` | Tingkatkan kualitas penulisan bullet point / section tertentu |
| `POST` | `/api/ai/suggestions` | Analisis holistik CV untuk menemukan area perbaikan |
| `POST` | `/api/ai/summary` | Generate ringkasan profesional berdasarkan data riil pengalaman |

---

## 🧪 Pengujian (Testing)

Proyek ini dilengkapi dengan unit test berbasis **Vitest** untuk menguji parser CV, validator ATS, penanganan tanggal, dan engine template:

```bash
npm test
```

---

## 👤 Pembuat & Kontributor

- **Gastin Alfiansa** — [@gastin11](https://github.com/gastin11)

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah lisensi [MIT](LICENSE).
