import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CanonicalCvSheet } from "../components/CvSheet";
import { KineticLine } from "../components/KineticLine";
import { ScanLine } from "../components/ScanLine";
import { EASINGS, FONTS, PALETTE } from "../theme";

/**
 * Adegan 3 (7–11 dtk · 120 frame): Produk Masuk
 * Kalimat: "Kenalkan, ATS CV *Builder*."
 * Visual: Mockup editor aplikasi asli (setia pada TopBar.tsx + EditorSidebar.tsx + CVPreview.tsx)
 *         masuk dari kedalaman 3D, garis pindai menyapu preview A4 dan menyalakan bagian CV.
 */
export const Scene3Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mockupIn = interpolate(frame, [4, Math.round(0.85 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.outQuart,
  });

  // 3D rotation settles from -18deg to -3deg as camera dollies in
  const rotY = interpolate(frame, [4, 95], [-18, -2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.outQuart,
  });

  const rotX = interpolate(frame, [4, 95], [10, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.outQuart,
  });

  const scanProg = interpolate(frame, [24, 96], [0.05, 0.92], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.inOutCubic,
  });

  const sections = [
    { label: "Data Pribadi", done: true },
    { label: "Ringkasan", done: true },
    { label: "Pengalaman Kerja", active: true },
    { label: "Pendidikan", done: true },
    { label: "Keahlian", done: true },
  ];

  return (
    <AbsoluteFill>
      {/* Kalimat utama: tengah-atas, ukuran lg, arah inUp */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 58,
          zIndex: 20,
        }}
      >
        <KineticLine
          id="s3-product"
          before="Kenalkan, ATS CV"
          highlight="Builder"
          after=""
          punctuation="."
          size="lg"
          direction="inUp"
          align="center"
          startFrame={3}
          exitFrame={102}
        />
      </div>

      {/* Satu objek visual: Mockup UI Aplikasi ATS CV Builder */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 195,
          width: 1520,
          height: 810,
          perspective: 1800,
          transform: "translateX(-50%)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: PALETTE.appBg,
            borderRadius: 18,
            border: "2px solid rgba(20, 33, 61, 0.16)",
            boxShadow:
              "0 36px 90px rgba(20, 33, 61, 0.22), 0 8px 24px rgba(20, 33, 61, 0.10)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            fontFamily: FONTS.ui,
            opacity: mockupIn,
            transform: `translate3d(0px, ${interpolate(mockupIn, [0, 1], [110, 0])}px, 0px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
          }}
        >
          {/* TopBar.tsx faithful reproduction */}
          <div
            style={{
              height: 64,
              background: "#FFFFFF",
              borderBottom: "1px solid #D4D4D4",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 28px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: PALETTE.appAccent,
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                CV
              </div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#171717",
                }}
              >
                ATS CV Builder
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: FONTS.mono,
                  background: PALETTE.appAccentSoft,
                  color: PALETTE.appAccent,
                  padding: "4px 10px",
                  borderRadius: 99,
                  fontWeight: 600,
                }}
              >
                LOCAL-FIRST · ZERO-PERSISTENCE
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #D4D4D4",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#171717",
                  background: "#FFFFFF",
                }}
              >
                Impor PDF / DOCX / OCR
              </div>
              <div
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: PALETTE.appAccent,
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Unduh PDF · DOCX
              </div>
            </div>
          </div>

          {/* Workspace: Left Sidebar + Middle Editor + Right Live A4 Preview */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* EditorSidebar */}
            <div
              style={{
                width: 240,
                background: "#FFFFFF",
                borderRight: "1px solid #D4D4D4",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontFamily: FONTS.mono,
                  color: "#525252",
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}
              >
                STRUKTUR KANONIK ATS
              </div>
              {sections.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "11px 14px",
                    borderRadius: 8,
                    background: s.active ? PALETTE.appAccentSoft : "transparent",
                    color: s.active ? PALETTE.appAccent : "#171717",
                    fontWeight: s.active ? 700 : 500,
                    fontSize: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{s.label}</span>
                  <span style={{ color: PALETTE.appAccent, fontSize: 13 }}>
                    ✓
                  </span>
                </div>
              ))}
            </div>

            {/* EditorPanel + AI Assistant card */}
            <div
              style={{
                width: 540,
                padding: 26,
                borderRight: "1px solid #D4D4D4",
                background: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#171717",
                }}
              >
                Pengalaman Kerja — Nusantara Tech
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #D4D4D4",
                    background: "#F9FAFB",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#525252" }}>Posisi</div>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}
                  >
                    Senior Backend Engineer
                  </div>
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #D4D4D4",
                    background: "#F9FAFB",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#525252" }}>Periode</div>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}
                  >
                    Jan 2023 – Sekarang
                  </div>
                </div>
              </div>

              {/* AI Writing Assistant Box */}
              <div
                style={{
                  marginTop: 6,
                  padding: 18,
                  borderRadius: 10,
                  background: PALETTE.appAccentSoft,
                  border: `1.5px solid ${PALETTE.appAccent}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: PALETTE.appAccent,
                    }}
                  >
                    ✦ AI Writing Assistant (Factuality-Guaranteed)
                  </span>
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 11,
                      color: PALETTE.appAccent,
                      fontWeight: 700,
                    }}
                  >
                    ACTION VERB + METRIC
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: "#171717",
                    background: "#FFFFFF",
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(31,77,58,0.2)",
                  }}
                >
                  “Memangkas latensi pemrosesan dokumen sebesar{" "}
                  <strong style={{ color: PALETTE.appAccent }}>42%</strong>{" "}
                  untuk 120rb pengguna aktif bulanan.”
                </div>
              </div>

              {/* ATS Check summary */}
              <div
                style={{
                  marginTop: "auto",
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: "#F7F7F5",
                  border: "1px solid #D4D4D4",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Pemeriksaan Struktur ATS
                </span>
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: PALETTE.appAccent,
                  }}
                >
                  ✓ 100% TERBACA PARSER
                </span>
              </div>
            </div>

            {/* Right: Live A4 Preview with our Signature ScanLine */}
            <div
              style={{
                flex: 1,
                background: "#ECEAE4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                position: "relative",
              }}
            >
              <div style={{ position: "relative" }}>
                <ScanLine
                  progress={scanProg}
                  color={PALETTE.accent}
                  label="ATS PARSER: OK ✓"
                  opacity={frame >= 22 && frame <= 104 ? 1 : 0}
                />
                <CanonicalCvSheet
                  width={490}
                  height={660}
                  pageNumber={1}
                  totalPages={1}
                  scanProgress={scanProg}
                  highlightActive
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
