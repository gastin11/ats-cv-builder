import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticLine } from "../components/KineticLine";
import { EASINGS, FONTS, PALETTE } from "../theme";

/**
 * Adegan 6 (18–21 dtk · 90 frame): Instrumen Skor ATS + Privasi Local-First
 * Kalimat: "*Lolos* ATS. Tanpa akun."
 * Visual: Instrumen skor ATS naik 0 -> 98 (tabular-nums) + perisai gembok Local-First.
 */
export const Scene6Score: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = interpolate(frame, [3, Math.round(0.7 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.outQuart,
  });

  // Deterministic score counter 0 -> 98
  const scoreProgress = interpolate(
    frame,
    [8, Math.round(1.65 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.outQuart,
    },
  );
  const scoreValue = Math.round(scoreProgress * 98);

  const radius = 136;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - scoreProgress * 0.98);

  return (
    <AbsoluteFill>
      {/* Kalimat utama: kanan-atas, ukuran lg, arah inLeft (variasi posisi & arah) */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: 230,
          maxWidth: 780,
          zIndex: 20,
        }}
      >
        <KineticLine
          id="s6-score"
          before=""
          highlight="Lolos"
          after="ATS. Tanpa akun"
          punctuation="."
          size="lg"
          direction="inLeft"
          align="left"
          startFrame={4}
          exitFrame={74}
        />

        {/* Pill Gembok Privasi di bawah kalimat */}
        <div
          style={{
            marginTop: 36,
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            padding: "18px 28px",
            borderRadius: 18,
            background: "#FFFFFF",
            border: `2px solid ${PALETTE.appAccent}`,
            boxShadow: "0 18px 42px rgba(20, 33, 61, 0.12)",
            opacity: cardIn,
            translate: `0px ${interpolate(cardIn, [0, 1], [36, 0])}px`,
          }}
        >
          <svg width={42} height={42} viewBox="0 0 48 48" fill="none">
            <rect
              x={10}
              y={22}
              width={28}
              height={20}
              rx={5}
              stroke={PALETTE.appAccent}
              strokeWidth={3.6}
            />
            <path
              d="M16 22V15C16 10.5817 19.5817 7 24 7C28.4183 7 32 10.5817 32 15V22"
              stroke={PALETTE.appAccent}
              strokeWidth={3.6}
              strokeLinecap="round"
            />
            <circle cx={24} cy={32} r={3} fill={PALETTE.accent} />
          </svg>
          <div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 22,
                fontWeight: 700,
                color: PALETTE.appAccent,
                letterSpacing: "0.04em",
              }}
            >
              100% MEMORI BROWSER
            </div>
          </div>
        </div>
      </div>

      {/* Satu objek visual utama: Instrumen Skor ATS di sisi kiri */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 175,
          width: 680,
          height: 680,
          borderRadius: 36,
          background: "#FFFFFF",
          border: "2.5px solid rgba(20, 33, 61, 0.16)",
          boxShadow: "0 34px 80px rgba(20, 33, 61, 0.18)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: cardIn,
          scale: `${interpolate(cardIn, [0, 1], [0.86, 1])}`,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: PALETTE.inkMuted,
            marginBottom: 24,
          }}
        >
          ATS READINESS INSTRUMENT
        </div>

        <div
          style={{
            position: "relative",
            width: 340,
            height: 340,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={340}
            height={340}
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx={170}
              cy={170}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={22}
              fill="none"
            />
            <circle
              cx={170}
              cy={170}
              r={radius}
              stroke={PALETTE.accent}
              strokeWidth={22}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>

          {/* Angka hidup dengan tabular-nums + min-width (Bang Motion checklist #376) */}
          <div
            style={{
              position: "absolute",
              textAlign: "center",
              minWidth: 220,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 108,
                fontWeight: 700,
                color: PALETTE.ink,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(scoreValue).padStart(2, "0")}
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 20,
                fontWeight: 700,
                color: PALETTE.appAccent,
                marginTop: 8,
                letterSpacing: "0.1em",
              }}
            >
              PASSED ✓
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 28,
            fontFamily: FONTS.mono,
            fontSize: 20,
            fontWeight: 700,
            color: PALETTE.ink,
            background: PALETTE.paper,
            padding: "10px 24px",
            borderRadius: 99,
          }}
        >
          ZERO DATABASE · ZERO TRACKING
        </div>
      </div>
    </AbsoluteFill>
  );
};
