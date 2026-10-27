/**
 * CV content i18n: section headings and fixed labels rendered on the CV
 * itself, shared by the server PDF/DOCX templates and the frontend preview.
 * The editor UI language is separate and stays as-is.
 */

export type CVLanguage = 'en' | 'id';

export type HeadingSectionKey =
  | 'experience'
  | 'education'
  | 'organizations'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'awards'
  | 'additional';

const HEADINGS: Record<CVLanguage, Record<HeadingSectionKey, string>> = {
  en: {
    experience: 'Professional Experience',
    education: 'Education',
    organizations: 'Organisational Experience',
    projects: 'Projects',
    skills: 'Skills, Achievement & Other',
    certifications: 'Certifications',
    awards: 'Awards & Achievements',
    additional: 'Additional Information',
  },
  id: {
    experience: 'Pengalaman Profesional',
    education: 'Pendidikan',
    organizations: 'Pengalaman Organisasi',
    projects: 'Proyek',
    skills: 'Keahlian, Prestasi & Lainnya',
    certifications: 'Sertifikasi',
    awards: 'Penghargaan',
    additional: 'Informasi Tambahan',
  },
};

export function sectionHeading(language: CVLanguage, key: HeadingSectionKey): string {
  return HEADINGS[language]?.[key] ?? HEADINGS.en[key];
}

/** Label for the "current" end date on entries. */
export function presentLabel(language: CVLanguage): string {
  return language === 'id' ? 'Saat ini' : 'Present';
}

/** Fallback label for an unnamed skill group. */
export function defaultSkillLabel(language: CVLanguage): string {
  return language === 'id' ? 'Keahlian' : 'Skills';
}

/**
 * Editor UI strings. The CV language setting drives both the document output
 * and the editor chrome, so users see one consistent language.
 */
const UI_STRINGS = {
  en: {
    new: 'New CV', import: 'Import', download: 'Download', downloadName: 'File name', downloadNameHint: 'Used for both PDF and DOCX downloads.', language: 'Language',
    pdfDesc: 'Print-ready, A4, selectable text', docxDesc: 'Editable in Word, Google Docs',
    exporting: 'Exporting...', undo: 'Undo', redo: 'Redo', layout: 'Layout',
    sessionWarning: 'Session only - download your CV before leaving.',
    dismiss: 'Dismiss',
    tabSections: 'Sections', tabAi: 'AI', tabCheck: 'Check',
    personal: 'Personal Information', summary: 'Summary', experience: 'Experience',
    education: 'Education', projects: 'Projects', organizations: 'Organizations',
    skills: 'Skills, Achievement & Other', certifications: 'Certifications', awards: 'Awards',
    complete: 'Complete', inProgress: 'In progress', emptyStatus: 'Empty', hiddenStatus: 'Hidden',
    changesHint: 'Changes appear in the preview on the right immediately.',
    personalHint: 'This appears in the CV header. Use full links (for example https://linkedin.com/in/yourname).',
    fullName: 'Full name', profTitle: 'Professional title', location: 'Location', phone: 'Phone',
    email: 'Email', linkedin: 'LinkedIn', portfolio: 'Portfolio / website', github: 'GitHub',
    summaryHint: 'One or two sentences shown right under your contact line, like a tagline. Keep it factual.',
    summaryField: 'Summary text', generateWithAi: 'Generate with AI from my CV data',
    skillsHint: 'Group skills by label, for example "Hard Skills" and "Soft Skills". Separate skills with commas. Avoid rating bars; ATS cannot read them.',
    addGroup: 'Add group', groupLabel: 'Group label (Hard Skills)',
    addEducation: 'Add education', addExperience: 'Add experience', addProject: 'Add project',
    addOrganization: 'Add organization', addCertification: 'Add certification', addAward: 'Add award',
    addBullet: 'Add bullet', addDetail: 'Add detail',
    institution: 'Institution', degree: 'Degree / major', company: 'Company', jobTitle: 'Job title',
    employmentType: 'Employment type', projectRole: 'Your role', url: 'Link (optional)',
    orgName: 'Organization', role: 'Your role', certName: 'Certification name', issuer: 'Issuer',
    issueDate: 'Issue date', expiry: 'Expiry (optional)', credentialId: 'Credential ID (optional)',
    credentialUrl: 'Credential URL (optional)', awardTitle: 'Award title', dateLabel: 'Date',
    description: 'Description (optional)', details: 'Details (GPA, coursework, thesis)',
    bulletsLabel: 'Description', startDate: 'Start date', endDate: 'End date', present: 'Present',
    moveUp: 'Move up', moveDown: 'Move down', deleteEntry: 'Delete entry', deleteBullet: 'Delete bullet',
    deleteDetail: 'Delete detail', deleteGroup: 'Delete group', deleteAward: 'Delete award',
    hideSection: 'Hide from preview', showSection: 'Show in preview',
    pageBreakBefore: 'Page break before', removePageBreak: 'Remove page break',
    improveAi: 'Improve this bullet with AI',
    page: 'Page', zoomIn: 'Zoom in', zoomOut: 'Zoom out', fitWidth: 'Fit width',
    cvCheck: 'CV check', runCheck: 'Run check', checking: 'Checking...',
    aiImproveTitle: 'Improve text with AI', target: 'Target', style: 'Style',
    getSuggestion: 'Get suggestion', thinking: 'Thinking...',
    aiWholeTitle: 'Suggestions for the whole CV', analyzeCv: 'Analyze CV',
    useSuggestion: 'Use suggestion', edit: 'Edit', cancelEdit: 'Cancel edit', dismissB: 'Dismiss',
    currentText: 'Current', suggested: 'Suggested', why: 'Why',
    infoToAdd: 'Information you could add',
    aiEmptyHint: 'Open a section, then press the "AI" button next to any bullet point, or use the summary generator. The AI can only work with facts you provided and will ask you for missing information instead of inventing it.',
    importTitle: 'Import existing CV',
    importHint: 'Upload a CV you already have. Supported: .docx, text-based .pdf, and scanned .pdf or images (.png, .jpg) via OCR.',
    chooseFile: 'Choose a file', dragDrop: 'or drag & drop it here', formatsHint: 'DOCX, PDF, PNG or JPG, up to 10 MB',
    unsupported: 'Unsupported file format. Use .docx, .pdf, .png, or .jpg.',
    tooLarge: 'File is too large (max 10 MB).',
    extracting: 'Extracting text and detecting sections...',
    close: 'Close', cancel: 'Cancel',
    back: 'Back', loading: 'Loading...', newCvTitle: 'Start a new CV?',
    checkHint: 'Local formatting and content heuristics before you export. This is not an ATS score and no tool can guarantee results in every applicant tracking system.',
    aiWholeHint: 'Get writing suggestions for your bullets: stronger verbs, passive voice, repetition, measurable impact, and consistency.',
    modeProfessional: 'Professional', modeConcise: 'Concise', modeAchievement: 'Achievement-focused',
    modeTechnical: 'Technical', modeBusiness: 'Business-focused', modeAts: 'ATS-friendly',
    ocrNoText: 'This PDF does not contain a readable text layer. Continue to run OCR on it?',
    ocrWarnBody: 'The file will be sent to a third-party OCR service (OCR.Space) to read the scanned text. The application does not store your file, and your current CV stays available and unchanged either way.',
    beforeOcr: 'Before we continue', runOcr: 'Run OCR',
    aiRefinedNote: 'AI cleanup applied to fix misplaced fields and improve extraction accuracy.',
    newCvBody: 'Your current CV content will be cleared from this session. Export first if you want to keep it.',
    found: 'Found', review: 'Review', notFound: 'Not found',
    contentLanguage: 'Content language after import',
    keepOriginal: 'Keep original language (auto-detected)', translateToId: 'Translate to Bahasa Indonesia',
    translateToEn: 'Translate to English',
    translateHint: 'Source language is detected automatically. Company names, locations, links and technical terms are kept as-is.',
    apply: 'Apply to editor', translating: 'Translating...',
    replacesWarning: 'Applying replaces your current CV in this session.',
  },
  id: {
    new: 'CV Baru', import: 'Impor', download: 'Unduh', downloadName: 'Nama file', downloadNameHint: 'Dipakai untuk unduhan PDF dan DOCX.', language: 'Bahasa',
    pdfDesc: 'Siap cetak, A4, teks dapat dipilih', docxDesc: 'Dapat diedit di Word, Google Docs',
    exporting: 'Mengekspor...', undo: 'Urungkan', redo: 'Ulangi', layout: 'Tata Letak',
    sessionWarning: 'Hanya tersimpan di sesi ini - unduh CV sebelum keluar.',
    dismiss: 'Tutup',
    tabSections: 'Bagian', tabAi: 'AI', tabCheck: 'Periksa',
    personal: 'Informasi Pribadi', summary: 'Ringkasan', experience: 'Pengalaman',
    education: 'Pendidikan', projects: 'Proyek', organizations: 'Organisasi',
    skills: 'Keahlian, Prestasi & Lainnya', certifications: 'Sertifikasi', awards: 'Penghargaan',
    complete: 'Lengkap', inProgress: 'Dalam proses', emptyStatus: 'Kosong', hiddenStatus: 'Tersembunyi',
    changesHint: 'Perubahan langsung tampil di pratinjau di sebelah kanan.',
    personalHint: 'Ini tampil di kepala CV. Gunakan tautan lengkap (contoh https://linkedin.com/in/namaanda).',
    fullName: 'Nama lengkap', profTitle: 'Judul profesional', location: 'Lokasi', phone: 'Telepon',
    email: 'Email', linkedin: 'LinkedIn', portfolio: 'Portofolio / situs web', github: 'GitHub',
    summaryHint: 'Satu-dua kalimat yang tampil tepat di bawah baris kontak, seperti tagline. Tetap faktual.',
    summaryField: 'Teks ringkasan', generateWithAi: 'Buat dengan AI dari data CV saya',
    skillsHint: 'Kelompokkan keahlian dengan label, misalnya "Hard Skills" dan "Soft Skills". Pisahkan dengan koma. Hindari rating bar; ATS tidak bisa membacanya.',
    addGroup: 'Tambah kelompok', groupLabel: 'Label kelompok (Hard Skills)',
    addEducation: 'Tambah pendidikan', addExperience: 'Tambah pengalaman', addProject: 'Tambah proyek',
    addOrganization: 'Tambah organisasi', addCertification: 'Tambah sertifikasi', addAward: 'Tambah penghargaan',
    addBullet: 'Tambah poin', addDetail: 'Tambah detail',
    institution: 'Institusi', degree: 'Gelar / jurusan', company: 'Perusahaan', jobTitle: 'Posisi',
    employmentType: 'Tipe pekerjaan', projectRole: 'Peran Anda', url: 'Tautan (opsional)',
    orgName: 'Organisasi', role: 'Peran Anda', certName: 'Nama sertifikasi', issuer: 'Penerbit',
    issueDate: 'Tanggal terbit', expiry: 'Kedaluwarsa (opsional)', credentialId: 'ID kredensial (opsional)',
    credentialUrl: 'URL kredensial (opsional)', awardTitle: 'Nama penghargaan', dateLabel: 'Tanggal',
    description: 'Deskripsi (opsional)', details: 'Detail (IPK, mata kuliah, skripsi)',
    bulletsLabel: 'Deskripsi', startDate: 'Tanggal mulai', endDate: 'Tanggal selesai', present: 'Saat ini',
    moveUp: 'Naikkan', moveDown: 'Turunkan', deleteEntry: 'Hapus entri', deleteBullet: 'Hapus poin',
    deleteDetail: 'Hapus detail', deleteGroup: 'Hapus kelompok', deleteAward: 'Hapus penghargaan',
    hideSection: 'Sembunyikan dari pratinjau', showSection: 'Tampilkan di pratinjau',
    pageBreakBefore: 'Pindah halaman sebelum ini', removePageBreak: 'Hapus pindah halaman',
    improveAi: 'Perbaiki poin ini dengan AI',
    page: 'Halaman', zoomIn: 'Perbesar', zoomOut: 'Perkecil', fitWidth: 'Sesuai lebar',
    cvCheck: 'Periksa CV', runCheck: 'Jalankan pemeriksaan', checking: 'Memeriksa...',
    aiImproveTitle: 'Perbaiki teks dengan AI', target: 'Sasaran', style: 'Gaya',
    getSuggestion: 'Minta saran', thinking: 'Memproses...',
    aiWholeTitle: 'Saran untuk seluruh CV', analyzeCv: 'Analisis CV',
    useSuggestion: 'Pakai saran', edit: 'Edit', cancelEdit: 'Batal', dismissB: 'Abaikan',
    currentText: 'Teks asli', suggested: 'Saran', why: 'Alasan',
    infoToAdd: 'Informasi yang bisa Anda tambahkan',
    aiEmptyHint: 'Buka sebuah bagian, lalu tekan tombol "AI" di samping poin mana pun, atau gunakan pembuat ringkasan. AI hanya bekerja dengan fakta yang Anda berikan dan akan meminta informasi yang kurang, bukan mengarangnya.',
    importTitle: 'Impor CV yang sudah ada',
    importHint: 'Unggah CV yang sudah Anda miliki. Didukung: .docx, .pdf berbasis teks, dan .pdf/gambar hasil scan (.png, .jpg) via OCR.',
    chooseFile: 'Pilih file', dragDrop: 'atau seret & lepas filenya di sini', formatsHint: 'DOCX, PDF, PNG atau JPG, hingga 10 MB',
    unsupported: 'Format file tidak didukung. Gunakan .docx, .pdf, .png, atau .jpg.',
    tooLarge: 'File terlalu besar (maks 10 MB).',
    extracting: 'Mengekstrak teks dan mendeteksi bagian...',
    close: 'Tutup', cancel: 'Batal',
    back: 'Kembali', loading: 'Memuat...', newCvTitle: 'Mulai CV baru?',
    checkHint: 'Pemeriksaan format dan konten lokal sebelum ekspor. Ini bukan skor ATS dan tidak ada tool yang bisa menjamin hasil di setiap applicant tracking system.',
    aiWholeHint: 'Dapatkan saran penulisan untuk poin Anda: kata kerja lebih kuat, kalimat pasif, pengulangan, dampak terukur, dan konsistensi.',
    modeProfessional: 'Profesional', modeConcise: 'Ringkas', modeAchievement: 'Fokus pencapaian',
    modeTechnical: 'Teknis', modeBusiness: 'Fokus bisnis', modeAts: 'Ramah ATS',
    ocrNoText: 'PDF ini tidak memiliki lapisan teks yang bisa dibaca. Lanjutkan untuk menjalankan OCR?',
    ocrWarnBody: 'File akan dikirim ke layanan OCR pihak ketiga (OCR.Space) untuk membaca teks hasil scan. Aplikasi tidak menyimpan file Anda, dan CV Anda saat ini tetap tersedia tanpa perubahan.',
    beforeOcr: 'Sebelum lanjut', runOcr: 'Jalankan OCR',
    aiRefinedNote: 'Perapian struktur dengan AI diterapkan agar hasil ekstraksi lebih akurat.',
    newCvBody: 'Isi CV Anda saat ini akan dihapus dari sesi ini. Ekspor dulu jika ingin menyimpannya.',
    found: 'Ditemukan', review: 'Periksa', notFound: 'Tidak ditemukan',
    contentLanguage: 'Bahasa konten setelah impor',
    keepOriginal: 'Pertahankan bahasa asli (dideteksi otomatis)', translateToId: 'Terjemahkan ke Bahasa Indonesia',
    translateToEn: 'Terjemahkan ke Inggris',
    translateHint: 'Bahasa sumber dideteksi otomatis. Nama perusahaan, lokasi, tautan, dan istilah teknis dibiarkan apa adanya.',
    apply: 'Terapkan ke editor', translating: 'Menerjemahkan...',
    replacesWarning: 'Menerapkan akan menimpa CV Anda saat ini di sesi ini.',
  },
} as const;

export type UiStringKey = keyof typeof UI_STRINGS.en;

export function ui(language: CVLanguage, key: UiStringKey): string {
  return UI_STRINGS[language][key] ?? UI_STRINGS.en[key];
}
