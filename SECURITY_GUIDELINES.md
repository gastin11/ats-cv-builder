# Panduan Keamanan & Aturan Upload GitHub (Security & Upload Guidelines)

Dokumen ini mengatur batasan, aturan, dan kebijakan mengenai apa yang **BOLEH** dan **TIDAK BOLEH** diunggah ke repositori GitHub **ATS CV Builder**, terutama karena repositori ini berstatus **Publik**.

---

## 1. Ringkasan Kebijakan (Quick Matrix)

| Kategori | Status | Keterangan & Contoh |
|---|---|---|
| **Kunci Rahasia & API Key** | ❌ **DILARANG KERAS** | `AI_API_KEY`, `OCR_SPACE_API_KEY`, `DEEPL_API_KEY`, GitHub PAT, Token Ngrok. |
| **File Environment** | ❌ **DILARANG KERAS** | `.env`, `.env.local`, `.env.production`, `.env.backup`. |
| **Template Environment** | ✅ **DIPERBOLEHKAN** | `.env.example` (HANYA berisi placeholder dummy, tanpa nilai rahasia asli). |
| **Data Pribadi / CV Asli** | ❌ **DILARANG** | Dokumen CV asli pengguna (.docx/.pdf) berisi identitas pribadi (NIK, telepon, alamat). |
| **Data Dummy / Mock Test** | ✅ **DIPERBOLEHKAN** | Contoh resume fiktif (misal: "Budi Santoso", "Alex Morgan") untuk testing. |
| **Dependensi Paket** | ❌ **DILARANG** | Direktori `node_modules/`, paket vendor lokal. |
| **File Konfigurasi Paket** | ✅ **DIPERBOLEHKAN** | `package.json`, `package-lock.json`. |
| **Hasil Build & Compile** | ❌ **DILARANG** | Direktori `dist/`, `build/`, `out/`, `*.tsbuildinfo`. |
| **Source Code Aplikasi** | ✅ **DIPERBOLEHKAN** | Seluruh kode di `frontend/src/`, `backend/src/`, `shared/`. |
| **File Log & Debug** | ❌ **DILARANG** | `*.log`, `npm-debug.log*`, `yarn-error.log*`. |
| **File Konfigurasi OS/Editor** | ❌ **DILARANG** | `.DS_Store`, `Thumbs.db`, kredensial editor pribadi di `.vscode/`. |
| **Dokumentasi & Lisensi** | ✅ **DIPERBOLEHKAN** | `README.md`, `LICENSE`, panduan teknis, template skema. |

---

## 2. Rincian Apa yang TIDAK BOLEH Diunggah ke GitHub

### ❌ A. File Lingkungan & Kredensial (.env & Secrets)
1. **File `.env`**: Seluruh varian file `.env` yang berisi nilai nyata (`.env`, `backend/.env`, `.env.local`, `.env.production`).
2. **Kunci API (API Keys)**:
   - Kunci OpenAI / LLM (`sk-...` atau sejenisnya).
   - Kunci OCR.Space (`OCR_SPACE_API_KEY`).
   - Kunci terjemahan (DeepL API key).
3. **Kredensial Infrastruktur & Akses**:
   - Token Tunneling (Ngrok auth token).
   - Private key SSH (`id_rsa`, `id_ed25519`).
   - Sertifikat SSL pribadi (`*.pem`, `*.key`, `*.pfx`).
   - Personal Access Token (PAT) GitHub.

> **Mengapa ini dilarang keras?**
> Begitu repositori bersifat publik, bot dan peretas otomatis memindai GitHub dalam hitungan detik. Jika API key terunggah, kuota Anda bisa terkuras habis, menimbulkan tagihan tak terduga, atau akun Anda disalahgunakan dan diblokir.

### ❌ B. Data Pengguna Nyata (Personally Identifiable Information / PII)
1. Dokumen CV nyata atau hasil ekspor asli milik perorangan (PDF/Word) yang memuat nama asli, nomor telepon, alamat rumah, identitas KTP/NIK, rekening bank, atau foto asli.
2. File hasil upload pengguna atau dump cache sementara (`export-tmp/frames/`).

### ❌ C. Hasil Build, Cache & Dependensi
1. Direktori dependensi: `node_modules/`.
2. Direktori hasil kompilasi: `dist/`, `build/`, `out/`.
3. File cache compiler: `*.tsbuildinfo`, `.eslintcache`, cache bundler.
4. Laporan pengujian lokal: `playwright-report/`, `test-results/`, `coverage/`.
5. File log: file dengan ekstensi `*.log`.

### ❌ D. File Sistem Operasi & Konfigurasi Lokal
1. Windows: `Thumbs.db`, `desktop.ini`, `ehthumbs.db`.
2. macOS: `.DS_Store`, file `._*`.
3. Profil pribadi editor lokal jika memuat path spesifik mesin pengembang.

---

## 3. Rincian Apa yang DIPERBOLEHKAN & DIANJURKAN Diunggah

### ✅ A. Source Code Asli
- Seluruh kode TypeScript, React, Fastify, HTML, CSS, dan Tailwind di folder:
  - `shared/` (skema Zod kanonik & i18n)
  - `backend/src/` (controller, routes, services, templates, utils)
  - `frontend/src/` (components, stores, styles, lib)
- File entry point: `index.html`, `vite.config.ts`, `tsconfig.json`.

### ✅ B. Contoh Konfigurasi Aman (`.env.example`)
- File template konfigurasi **HANYA** boleh memuat nama variabel dan nilai placeholder (dummy), misalnya:
  ```env
  OCR_SPACE_API_KEY=your_ocr_space_api_key_here
  AI_API_KEY=your_ai_api_key_here
  AI_BASE_URL=https://api.openai.com/v1
  ```
- **Wajib dipastikan**: tidak ada string token asli yang tersisa di dalam file template.

### ✅ C. Data Pengujian Dummy / Mock
- Data dummy kanonik yang tidak mengandung data orang nyata (seperti nama contoh fiktif "Alex Morgan" atau "Budi Santoso" dengan nomor acak `+62 812 3456 7890` dan email `alex@example.com`).

### ✅ D. Skrip Utilitas & Dokumentasi
- Skrip bantuan seperti `buka.cmd`, runner testing, atau tooling lokal tanpa secret hardcoded.
- Dokumentasi Markdown (`README.md`, `SECURITY_GUIDELINES.md`).

---

## 4. Checklist Pra-Commit (Sebelum Menjalankan `git commit`)

Sebelum melakukan `git add` dan `git commit`, selalu lakukan verifikasi berikut:

1. **Cek status file git**:
   ```bash
   git status
   ```
   Pastikan tidak ada file `.env`, file kredensial, atau folder `node_modules/` yang masuk ke dalam daftar *Changes to be committed*.

2. **Periksa isi `.env.example`**:
   Pastikan tidak ada API key sungguhan di `backend/.env.example`.

3. **Cek diff perubahan**:
   ```bash
   git diff --staged
   ```
   Teliti setiap baris untuk memastikan tidak ada password, secret token, atau informasi privat yang terselip secara tidak sengaja.

4. **Pastikan `.gitignore` aktif dan komprehensif**:
   File `.gitignore` pada root harus menyaring `.env`, `node_modules/`, `dist/`, dan file sementara lainnya.

---

## 5. Prosedur Tanggap Darurat (Jika Secret Tidak Sengaja Terunggah)

Jika ada API key atau data sensitif yang terlanjur ter-push ke GitHub:

1. **Cabut / Revoke Kunci Segera (Langkah Paling Penting)**:
   - Segera buka dashboard penyedia layanan (OpenAI / OCR.Space / Provider terkait).
   - Hapus atau revoke API key yang bocor dan buat kunci baru.
   - *Catatan:* Menghapus commit saja tidak menjamin keamanan karena GitHub cache dan scraper mungkin sudah membaca kuncinya.
2. **Hapus Riwayat Git**:
   - Jangan hanya melakukan commit baru untuk menghapus file. Gunakan alat seperti `git filter-repo` atau `BFG Repo-Cleaner` untuk membersihkan riwayat commit.
   - Atau lakukan rebase/reset commit bila belum di-push ke publik.
3. **Perbarui `.gitignore`**:
   - Pastikan path file tersebut sudah didaftarkan di `.gitignore` agar tidak terulang.
