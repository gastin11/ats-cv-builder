import { describe, expect, it } from 'vitest';
import { parseTextToCv } from '../src/services/cv-parser.service.js';
import { validateCv } from '../src/services/cv-validator.service.js';
import { isEndDateBeforeStart, parseMonthYear } from '../src/utils/misc.js';
import { renderCvHtml } from '../src/templates/cv-html.template.js';
import { cvDocumentSchema, emptyCV } from '../../shared/cv-schema/cv.schema.js';

describe('parseMonthYear', () => {
  it('parses Indonesian and English month names', () => {
    expect(parseMonthYear('Nov 2025')).toEqual({ month: 11, year: 2025 });
    expect(parseMonthYear('Desember 2024')).toEqual({ month: 12, year: 2024 });
    expect(parseMonthYear('January 2023')).toEqual({ month: 1, year: 2023 });
  });

  it('parses bare years and numeric dates', () => {
    expect(parseMonthYear('2023')).toEqual({ month: 0, year: 2023 });
    expect(parseMonthYear('05/2024')).toEqual({ month: 5, year: 2024 });
    expect(parseMonthYear('soon')).toBeNull();
  });
});

describe('isEndDateBeforeStart', () => {
  it('detects inverted ranges', () => {
    expect(isEndDateBeforeStart('Jan 2024', 'Nov 2023')).toBe(true);
    expect(isEndDateBeforeStart('Nov 2023', 'Jan 2024')).toBe(false);
  });

  it('ignores unparseable values', () => {
    expect(isEndDateBeforeStart('whenever', 'sometime')).toBe(false);
  });
});

const SAMPLE_CV_TEXT = `ALEX MORGAN
Jakarta | +62 812 3456 7890 | alex@example.com | linkedin.com/in/alexmorgan

PROFIL SINGKAT
Fresh graduate with internship experience in data analysis.

PENDIDIKAN
Universitas Contoh - S1 Informatika   Aug 2019 - Jul 2023
• IPK: 3.80/4.00
• Skripsi: Sistem analisis data

PENGALAMAN
PT Contoh Jaya   Jan 2023 - Des 2023
• Membuat dashboard untuk data perusahaan
• Membantu evaluasi kandidat produk

PROYEK
Aplikasi Contoh   Okt 2022 - Des 2022
• Mengembangkan aplikasi web sederhana

ORGANISASI
BEM Universitas Contoh   2020 - 2021
• Mengkoordinasikan acara tahunan

KEMAMPUAN
Hard Skills: Python, SQL, Excel
Soft Skills: Komunikasi, Kerja Tim

SERTIFIKASI
Sertifikat Analisis Data — 2023
`;

describe('parseTextToCv', () => {
  const parsed = parseTextToCv(SAMPLE_CV_TEXT);
  const cv = parsed.cv;

  it('extracts personal info', () => {
    expect(cv.personal.fullName.toLowerCase()).toBe('alex morgan');
    expect(cv.personal.email).toBe('alex@example.com');
    expect(cv.personal.phone).toContain('812 3456 7890');
    expect(cv.personal.linkedin).toContain('linkedin.com/in/alexmorgan');
  });

  it('extracts summary', () => {
    expect(cv.summary).toContain('Fresh graduate');
  });

  it('extracts education entry with details', () => {
    expect(cv.education).toHaveLength(1);
    expect(cv.education[0].institution).toContain('Universitas Contoh');
    expect(cv.education[0].startDate).toBe('Aug 2019');
    expect(cv.education[0].endDate).toBe('Jul 2023');
    expect(cv.education[0].details).toContain('IPK: 3.80/4.00');
  });

  it('extracts experience with bullets and dates', () => {
    expect(cv.experience).toHaveLength(1);
    expect(cv.experience[0].company).toContain('PT Contoh Jaya');
    expect(cv.experience[0].startDate).toBe('Jan 2023');
    expect(cv.experience[0].bullets).toHaveLength(2);
  });

  it('extracts projects and organizations', () => {
    expect(cv.projects).toHaveLength(1);
    expect(cv.projects[0].name).toContain('Aplikasi Contoh');
    expect(cv.organizations).toHaveLength(1);
  });

  it('groups skills by label', () => {
    expect(cv.skills).toHaveLength(2);
    const hard = cv.skills.find((g) => /hard/i.test(g.label));
    expect(hard?.skills).toContain('Python');
  });

  it('extracts certifications', () => {
    expect(cv.certifications).toHaveLength(1);
    expect(cv.certifications[0].name).toContain('Sertifikat Analisis Data');
  });

  it('returns review statuses for every detected section', () => {
    const sections = parsed.reviews.map((r) => r.section);
    expect(sections).toContain('personal');
    expect(sections).toContain('experience');
  });

  it('parses an empty string without crashing', () => {
    const result = parseTextToCv('');
    expect(result.cv.personal.fullName).toBe('');
    expect(result.confidence).toBe('low');
  });
});

describe('validateCv', () => {
  it('fails on an empty CV', () => {
    const result = validateCv(emptyCV());
    const byId = Object.fromEntries(result.checks.map((c) => [c.id, c.status]));
    expect(byId.name).toBe('fail');
    expect(byId.contact).toBe('fail');
    expect(result.score).toBeNull();
  });

  it('passes core checks on a filled CV', () => {
    const cv = cvDocumentSchema.parse({
      personal: { fullName: 'Alex Morgan', email: 'alex@example.com', phone: '+62 812 3456 7890' },
      summary: 'Data analyst with internship experience.',
      education: [{ institution: 'Universitas Contoh', degree: 'S1', startDate: 'Aug 2019', endDate: 'Jul 2023' }],
      experience: [
        {
          company: 'PT Contoh',
          jobTitle: 'Analyst',
          startDate: 'Jan 2023',
          endDate: 'Dec 2023',
          bullets: ['Built a dashboard for 3 departments', 'Reduced reporting time by 40%'],
        },
      ],
      skills: [{ label: 'Hard Skills', skills: ['Python'] }],
    });
    const result = validateCv(cv);
    const byId = Object.fromEntries(result.checks.map((c) => [c.id, c.status]));
    expect(byId.name).toBe('pass');
    expect(byId.contact).toBe('pass');
    expect(byId.entries).toBe('pass');
  });
});

describe('renderCvHtml', () => {
  it('renders the ATS reference structure without reference-CV content', () => {
    const cv = emptyCV();
    cv.personal.fullName = 'Alex Morgan';
    cv.summary = 'Synthetic summary for tests.';
    cv.experience = [
      {
        id: 'e1',
        company: 'PT Contoh',
        jobTitle: 'Analyst',
        employmentType: '',
        location: 'Jakarta',
        startDate: 'Jan 2023',
        endDate: 'Dec 2023',
        isCurrent: false,
        bullets: ['Built a dashboard for 3 departments.'],
      },
    ];
    const html = renderCvHtml(cv);
    expect(html).toContain('@page');
    expect(html).toContain('size: A4');
    expect(html).toContain('Alex Morgan');
    expect(html).toContain('Synthetic summary for tests.'); // tagline under the header
    expect(html).toContain('Professional Experience'); // experience-first heading
    expect(html).toContain('PT Contoh - Jakarta'); // "Employer - Location" bold row
    expect(html).toContain('text-align: justify'); // justify tagline alignment
    // summary must not render as its own heading section
    expect(html).not.toContain('Professional Summary');
    // no reference-CV content leaks into templates
    expect(html).not.toContain('FARADITA');
  });
});

describe('parseTextToCv - Indonesian & English Continuation Lines and Headings', () => {
  it('handles Indonesian CV with INFORMASI PRIBADI and continuation lines without extra dots', () => {
    const raw = `CURRICULUM VITAE

INFORMASI PRIBADI
Nama: Budi Pratama
Alamat: Jl. Sudirman No. 45, Jakarta Selatan
No. Telepon: +62 812 9876 5432
Email: budi.pratama@gmail.com
LinkedIn: linkedin.com/in/budipratama

PROFIL SAYA
Software engineer berpengalaman dalam pengembangan sistem informasi terdistribusi dan layanan berbasis cloud.

RIWAYAT PEKERJAAN
PT Teknologi Maju   Januari 2021 sampai Sekarang
Software Engineer
• Merancang dan mengimplementasikan arsitektur microservices menggunakan Node.js dan TypeScript
untuk meningkatkan skalabilitas sistem pembayaran perusahaan.
• Memimpin tim kecil yang terdiri dari 4 pengembang dalam integrasi payment gateway
sehingga mempercepat proses transaksi sebesar 30%.

RIWAYAT PENDIDIKAN
Universitas Indonesia - S1 Ilmu Komputer   2016 s.d. 2020
• Skripsi mengenai optimasi query database relasional pada sistem terdistribusi
yang diimplementasikan di lingkungan produksi.
`;

    const parsed = parseTextToCv(raw);
    const cv = parsed.cv;

    // Must NOT treat "CURRICULUM VITAE" or "INFORMASI PRIBADI" as full name
    expect(cv.personal.fullName).toBe('Budi Pratama');
    expect(cv.personal.email).toBe('budi.pratama@gmail.com');
    expect(cv.personal.phone).toContain('812 9876 5432');
    expect(cv.personal.location).toContain('Jakarta');
    expect(cv.summary).toContain('Software engineer berpengalaman');

    // Experience must be detected
    expect(cv.experience).toHaveLength(1);
    expect(cv.experience[0].company).toContain('PT Teknologi Maju');
    expect(cv.experience[0].isCurrent).toBe(true);

    // Continuation lines must be merged: exactly 2 bullets, NOT 4 bullets!
    expect(cv.experience[0].bullets).toHaveLength(2);
    expect(cv.experience[0].bullets[0]).toContain('skalabilitas sistem pembayaran perusahaan');
    expect(cv.experience[0].bullets[1]).toContain('mempercepat proses transaksi sebesar 30%');

    // Education details continuation merged: 1 detail, NOT 2 details!
    expect(cv.education).toHaveLength(1);
    expect(cv.education[0].institution).toContain('Universitas Indonesia');
    expect(cv.education[0].details).toHaveLength(1);
    expect(cv.education[0].details[0]).toContain('diimplementasikan di lingkungan produksi');

    // Must NOT dump INFORMASI PRIBADI into additional
    expect(cv.additional).toHaveLength(0);
  });

  it('handles English CV with line-wrapped text without turning continuations into dots', () => {
    const raw = `RESUME

Sarah Jenkins
London, UK | +44 20 7946 0958 | sarah@example.co.uk | linkedin.com/in/sarahjenkins

PROFESSIONAL SUMMARY
Senior Data Scientist with extensive background in machine learning operations and big data analytics.

WORK EXPERIENCE
FinTech Solutions Ltd - London   Jan 2021 to Present
Lead Data Scientist
• Architected and deployed predictive risk scoring models across 1.5 million active accounts
resulting in a 25% reduction in fraudulent loan applications.
• Collaborated with product and engineering teams to establish automated CI/CD pipelines
for retraining deep learning models on AWS.

EDUCATION
University of Cambridge   2016 until 2020
Bachelor of Science in Computer Science
• Graduated with First Class Honours and completed dissertation on graph neural networks
applied to molecular property prediction.
`;

    const parsed = parseTextToCv(raw);
    const cv = parsed.cv;

    expect(cv.personal.fullName).toBe('Sarah Jenkins');
    expect(cv.personal.location).toContain('London');
    expect(cv.summary).toContain('Senior Data Scientist');

    expect(cv.experience).toHaveLength(1);
    expect(cv.experience[0].isCurrent).toBe(true);

    // Continuation lines must be merged: exactly 2 bullets, NOT 4!
    expect(cv.experience[0].bullets).toHaveLength(2);
    expect(cv.experience[0].bullets[0]).toContain('fraudulent loan applications');
    expect(cv.experience[0].bullets[1]).toContain('retraining deep learning models');

    // Education dissertation continuation merged: 1 detail, NOT 2!
    expect(cv.education[0].details).toHaveLength(1);
    expect(cv.education[0].details[0]).toContain('molecular property prediction');
  });
});

describe('AI JSON parser and think-tag cleaner', () => {
  it('cleans reasoning model <think> tags and parses enclosed JSON', async () => {
    const { cleanAiResponseText, extractJson } = await import('../src/services/ai.service.js');

    const thinkingOutput = `<think>
The user wants to improve this resume bullet.
Let's see: original is "Worked on website".
We should make it stronger: "Engineered scalable responsive web application".
Return JSON with suggestion and reason.
</think>
\`\`\`json
{
  "original": "Worked on website",
  "suggestion": "Engineered scalable, responsive web application using React and TypeScript",
  "reason": "Uses stronger action verb and specifies technical stack",
  "missing_information": []
}
\`\`\``;

    const cleaned = cleanAiResponseText(thinkingOutput);
    expect(cleaned).not.toContain('<think>');
    expect(cleaned).not.toContain('The user wants to improve');

    const parsed = extractJson(thinkingOutput) as Record<string, unknown>;
    expect(parsed.suggestion).toContain('Engineered scalable');
  });

  it('extracts JSON surrounded by conversational text without fences', async () => {
    const { extractJson } = await import('../src/services/ai.service.js');

    const conversationalOutput = `Tentu, ini adalah perbaikan yang ramah ATS untuk poin CV Anda:
{
  "original": "membuat web perusahaan",
  "suggestion": "Mengembangkan dan memelihara aplikasi web perusahaan berbasis React",
  "reason": "Lebih spesifik dan profesional",
  "missing_information": []
}
Semoga bermanfaat untuk melamar pekerjaan!`;

    const parsed = extractJson(conversationalOutput) as Record<string, unknown>;
    expect(parsed.suggestion).toContain('Mengembangkan dan memelihara');
  });
});
