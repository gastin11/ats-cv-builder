import React from "react";
import { FONTS, PALETTE } from "../theme";

type CanonicalCvSheetProps = {
  readonly width?: number;
  readonly height?: number;
  readonly pageNumber?: 1 | 2;
  readonly totalPages?: 1 | 2;
  readonly scanProgress?: number;
  readonly highlightActive?: boolean;
  readonly style?: React.CSSProperties;
};

/**
 * Mirrors the real ATS CV Builder document layout from frontend/src/styles.css
 * and frontend/src/components/preview/CVPreview.tsx (Alex Morgan sample).
 */
export const CanonicalCvSheet: React.FC<CanonicalCvSheetProps> = ({
  width = 520,
  height = 735,
  pageNumber = 1,
  totalPages = 1,
  scanProgress = -1,
  highlightActive = false,
  style,
}) => {
  const isScanned = (threshold: number) =>
    highlightActive && scanProgress >= threshold;

  return (
    <div
      style={{
        width,
        height,
        background: "#FFFFFF",
        borderRadius: 8,
        boxShadow:
          "0 20px 50px rgba(20, 33, 61, 0.16), 0 2px 8px rgba(20, 33, 61, 0.08)",
        border: "1px solid rgba(20, 33, 61, 0.12)",
        padding: "36px 40px",
        boxSizing: "border-box",
        fontFamily: FONTS.cvSerif,
        color: "#171717",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Page badge */}
      {totalPages > 1 ? (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 18,
            fontFamily: FONTS.mono,
            fontSize: 12,
            fontWeight: 700,
            color: PALETTE.appAccent,
            background: PALETTE.appAccentSoft,
            padding: "3px 9px",
            borderRadius: 4,
            letterSpacing: "0.06em",
          }}
        >
          HALAMAN {pageNumber} / {totalPages}
        </div>
      ) : null}

      {pageNumber === 1 ? (
        <>
          {/* Header: Canonical centered name & single-line contact */}
          <div
            style={{
              textAlign: "center",
              padding: "4px 8px",
              borderRadius: 4,
              background: isScanned(0.15)
                ? "rgba(255, 90, 54, 0.09)"
                : "transparent",
              borderLeft: isScanned(0.15)
                ? `3px solid ${PALETTE.accent}`
                : "3px solid transparent",
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              ALEX MORGAN
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "#404040",
                marginTop: 4,
                fontFamily: FONTS.ui,
              }}
            >
              Jakarta · +62 812 3456 7890 · alex@example.com ·
              linkedin.com/in/alexmorgan
            </div>
          </div>

          {/* Summary */}
          <div
            style={{
              marginTop: 16,
              padding: "4px 8px",
              borderRadius: 4,
              background: isScanned(0.32)
                ? "rgba(255, 90, 54, 0.08)"
                : "transparent",
              borderLeft: isScanned(0.32)
                ? `3px solid ${PALETTE.accent}`
                : "3px solid transparent",
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                borderBottom: "1.2px solid #171717",
                paddingBottom: 3,
                letterSpacing: "0.03em",
              }}
            >
              RINGKASAN PROFESIONAL
            </div>
            <div
              style={{
                fontSize: 11,
                lineHeight: 1.48,
                color: "#262626",
                marginTop: 6,
              }}
            >
              Software Engineer dengan 5+ tahun pengalaman membangun arsitektur
              web berskala tinggi, optimasi performa API, dan sistem dokumen
              otomatis.
            </div>
          </div>

          {/* Experience */}
          <div
            style={{
              marginTop: 16,
              padding: "4px 8px",
              borderRadius: 4,
              background: isScanned(0.55)
                ? "rgba(255, 90, 54, 0.08)"
                : "transparent",
              borderLeft: isScanned(0.55)
                ? `3px solid ${PALETTE.accent}`
                : "3px solid transparent",
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                borderBottom: "1.2px solid #171717",
                paddingBottom: 3,
                letterSpacing: "0.03em",
              }}
            >
              PENGALAMAN KERJA
            </div>

            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                <span>Senior Backend Engineer — Nusantara Tech</span>
                <span>Jan 2023 – Sekarang</span>
              </div>
              <ul
                style={{
                  margin: "5px 0 0 16px",
                  padding: 0,
                  fontSize: 10.8,
                  lineHeight: 1.46,
                  color: "#262626",
                }}
              >
                <li>
                  Memangkas latensi pemrosesan dokumen sebesar 42% untuk 120rb
                  pengguna aktif bulanan.
                </li>
                <li>
                  Merancang pipeline parser PDF/DOCX otomatis dengan akurasi
                  ekstraksi 98.4%.
                </li>
              </ul>
            </div>

            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                <span>Full-Stack Developer — Kreasi Digital</span>
                <span>Mar 2020 – Des 2022</span>
              </div>
              <ul
                style={{
                  margin: "5px 0 0 16px",
                  padding: 0,
                  fontSize: 10.8,
                  lineHeight: 1.46,
                  color: "#262626",
                }}
              >
                <li>
                  Mengembangkan aplikasi React + TypeScript dengan waktu muat
                  awal di bawah 1,2 detik.
                </li>
                <li>
                  Mengintegrasikan pengujian otomatis CI/CD yang menurunkan bug
                  produksi hingga 60%.
                </li>
              </ul>
            </div>
          </div>

          {/* Skills */}
          <div
            style={{
              marginTop: 16,
              padding: "4px 8px",
              borderRadius: 4,
              background: isScanned(0.8)
                ? "rgba(255, 90, 54, 0.08)"
                : "transparent",
              borderLeft: isScanned(0.8)
                ? `3px solid ${PALETTE.accent}`
                : "3px solid transparent",
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                borderBottom: "1.2px solid #171717",
                paddingBottom: 3,
                letterSpacing: "0.03em",
              }}
            >
              KEAHLIAN UTAMA
            </div>
            <div style={{ fontSize: 11, marginTop: 6, lineHeight: 1.45 }}>
              <strong>Bahasa & Runtime:</strong> TypeScript, Node.js, Python,
              SQL, Go
              <br />
              <strong>Sistem & Cloud:</strong> Fastify, React 18, Docker,
              PostgreSQL, CI/CD
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Page 2: Clean continuation without mid-bullet splits */}
          <div
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              background: "rgba(31, 77, 58, 0.06)",
              borderLeft: `3px solid ${PALETTE.appAccent}`,
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                borderBottom: "1.2px solid #171717",
                paddingBottom: 3,
                letterSpacing: "0.03em",
              }}
            >
              PENDIDIKAN
            </div>
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                <span>Institut Teknologi — S1 Teknik Informatika</span>
                <span>2016 – 2020</span>
              </div>
              <div style={{ fontSize: 10.8, marginTop: 4, color: "#262626" }}>
                IPK 3.84 / 4.00 · Fokus Rekayasa Perangkat Lunak & Sistem
                Terdistribusi
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, padding: "4px 8px" }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                borderBottom: "1.2px solid #171717",
                paddingBottom: 3,
                letterSpacing: "0.03em",
              }}
            >
              SERTIFIKASI & PROYEK
            </div>
            <ul
              style={{
                margin: "8px 0 0 16px",
                padding: 0,
                fontSize: 10.8,
                lineHeight: 1.5,
                color: "#262626",
              }}
            >
              <li>
                <strong>ATS CV Builder (Open Source):</strong> Arsitektur editor
                CV local-first dengan paginasi A4 real-time.
              </li>
              <li>
                <strong>Cloud Architect Associate:</strong> Sertifikasi desain
                infrastruktur mikroservis berketahanan tinggi.
              </li>
            </ul>
          </div>

          {/* Visual proof badge inside page 2 */}
          <div
            style={{
              marginTop: 28,
              padding: "12px 14px",
              borderRadius: 6,
              background: PALETTE.appAccentSoft,
              border: `1px dashed ${PALETTE.appAccent}`,
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: PALETTE.appAccent,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>✓ HEADING UTUH · TANPA BARIS TERPOTONG</span>
            <strong>A4 297MM</strong>
          </div>
        </>
      )}
    </div>
  );
};
