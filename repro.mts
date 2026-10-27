import { parseTextToCv } from './backend/src/services/cv-parser.service.js';

const TEXT = `BUDI SANTOSO
Jakarta | +62 812 3456 7890 | budi@example.com | linkedin.com/in/budisantoso

PROFIL SINGKAT
Analis data dengan pengalaman magang di bidang analisis data dan pelaporan.

PENDIDIKAN
Universitas Contoh - S1 Sistem Informasi   Agustus 2019 - Juli 2023
IPK: 3.80/4.00
Skripsi: Sistem analisis data penjualan

PENGALAMAN KERJA
PT Contoh Jaya   Januari 2023 - Desember 2023
Membuat dashboard untuk data perusahaan
Membantu evaluasi kandidat produk
Melakukan analisis kebutuhan pengguna

PROYEK
Aplikasi Contoh   Oktober 2022 - Desember 2022
Mengembangkan aplikasi web sederhana untuk pencatatan

KEMAMPUAN
Hard Skills: Python, SQL, Excel
Soft Skills: Komunikasi, Kerja Tim

SERTIFIKASI
Sertifikat Analisis Data - 2023
`;

const r = parseTextToCv(TEXT);
console.log(JSON.stringify(r, null, 2));
