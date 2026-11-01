import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticLine } from "../components/KineticLine";
import { ScanLine } from "../components/ScanLine";
import { EASINGS, FONTS, PALETTE } from "../theme";

/**
 * Adegan 2 (3–7 dtk · 120 frame): Mesin ATS (Latar Gelap #0F1626)
 * Kalimat: "Sistemnya tidak bisa *membaca*."
 * Visual: Layar parser mesin ATS memindai tabel/kolom yang hancur jadi token error.
 */
export const Scene2Machine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelIn = interpolate(frame, [4, Math.round(0.75 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.outQuart,
  });

  // Scan line sweeps down repeatedly
  const scanProg = interpolate(frame, [10, 92], [0.06, 0.92], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.inOutCubic,
  });

  const rows = [
    {
      threshold: 0.18,
      left: "┌── TABLE_COL_1 ──┬── TABLE_COL_2 ──┐",
      right: "ERR_NESTED_TABLE",
    },
    {
      threshold: 0.36,
      left: "│ Budi S. | 2023  │ Senior Dev      │",
      right: "COL_MERGE_COLLISION",
    },
    {
      threshold: 0.54,
      left: "│ █████░░░ 80% JS │ ██████░░ 90% TS │",
      right: "GRAPH_BAR_NULL",
    },
    {
      threshold: 0.72,
      left: "│ [Icon] +62812.. │ [Icon] Jakarta  │",
      right: "CONTACT_UNPARSED",
    },
  ];

  return (
    <AbsoluteFill>
      {/* Kantong gelap di bawah teks kiri agar kontras putih ≥ 90% */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 180,
          width: 820,
          height: 480,
          background:
            "radial-gradient(circle at 45% 50%, rgba(9, 14, 26, 0.78) 0%, transparent 72%)",
          pointerEvents: "none",
        }}
      />

      {/* Kalimat utama: kiri-tengah, ukuran md, arah inLeft (berbeda dari adegan 1!) */}
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 320,
          maxWidth: 740,
          zIndex: 20,
        }}
      >
        <KineticLine
          id="s2-machine"
          before="Sistemnya tidak bisa"
          highlight="membaca"
          after=""
          punctuation="."
          size="md"
          direction="inLeft"
          dark
          align="left"
          startFrame={5}
          exitFrame={100}
        />
      </div>

      {/* Satu objek visual: Mesin Parser ATS (Brutalis Mono) di sisi kanan */}
      <div
        style={{
          position: "absolute",
          right: 110,
          top: 165,
          width: 860,
          height: 740,
          background: PALETTE.machineSurface,
          borderRadius: 14,
          border: `2px solid ${PALETTE.machineLine}`,
          boxShadow: "0 32px 80px rgba(0, 0, 0, 0.55)",
          padding: "28px 34px",
          boxSizing: "border-box",
          opacity: panelIn,
          translate: `${interpolate(panelIn, [0, 1], [90, 0])}px 0px`,
          overflow: "hidden",
        }}
      >
        {/* Garis pindai laser oranye-merah */}
        <ScanLine
          progress={scanProg}
          color={PALETTE.accent}
          label="ATS TOKENIZER v4.2"
          opacity={frame >= 8 && frame <= 106 ? 1 : 0}
        />

        {/* Header bar mesin */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${PALETTE.machineLine}`,
            paddingBottom: 18,
            marginBottom: 24,
            fontFamily: FONTS.mono,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: PALETTE.danger,
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#F8FAFC",
                letterSpacing: "0.06em",
              }}
            >
              INPUT: CV_2_KOLOM_TABEL.PDF
            </span>
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: PALETTE.accent,
              background: "rgba(255, 90, 54, 0.14)",
              padding: "6px 14px",
              borderRadius: 6,
            }}
          >
            PARSE STATUS: FAILED
          </span>
        </div>

        {/* Baris-baris struktur yang gagal diparsing saat dilewati scan line */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {rows.map((r, idx) => {
            const hit = scanProg >= r.threshold;
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "22px 24px",
                  borderRadius: 10,
                  background: hit
                    ? "rgba(217, 45, 32, 0.14)"
                    : "rgba(15, 22, 38, 0.75)",
                  border: `1.5px solid ${
                    hit ? PALETTE.accent : PALETTE.machineLine
                  }`,
                  fontFamily: FONTS.mono,
                }}
              >
                <span
                  style={{
                    fontSize: 19,
                    color: hit ? "#FECACA" : "#94A3B8",
                    textDecoration: hit ? "line-through" : "none",
                  }}
                >
                  {r.left}
                </span>
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: hit ? "#FFFFFF" : "#64748B",
                    background: hit ? PALETTE.danger : "#1E293B",
                    padding: "6px 12px",
                    borderRadius: 6,
                    letterSpacing: "0.05em",
                  }}
                >
                  {hit ? r.right : "SCANNING..."}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer ringkasan parser */}
        <div
          style={{
            marginTop: 32,
            padding: "20px 24px",
            borderRadius: 10,
            background: "#090E1A",
            border: `1px solid ${PALETTE.machineLine}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: FONTS.mono,
          }}
        >
          <span style={{ fontSize: 18, color: "#94A3B8" }}>
            HEADING HIERARCHY: <strong style={{ color: "#F87171" }}>BROKEN</strong>
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: PALETTE.accent,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            READABLE FIELDS: 2 / 14
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
