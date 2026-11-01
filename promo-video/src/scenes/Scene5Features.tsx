import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticLine } from "../components/KineticLine";
import { EASINGS, FONTS, PALETTE } from "../theme";

/**
 * Adegan 5 (15–18 dtk · 90 frame): Fitur (Ikon Tile — Bukan daftar poin!)
 * Kalimat: "Impor, *tulis*, ekspor."
 * Visual: 3 tile ikon berlabel 1–2 kata dengan inner glow dari bawah & rim border.
 */
export const Scene5Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tiles = [
    {
      title: "DOCX · PDF · OCR",
      tag: "01 // IMPOR",
      accent: PALETTE.ink,
      icon: (
        <svg width={88} height={88} viewBox="0 0 64 64" fill="none">
          <rect
            x={12}
            y={8}
            width={40}
            height={48}
            rx={6}
            stroke={PALETTE.ink}
            strokeWidth={3.8}
          />
          <path
            d="M22 22H42M22 32H42M22 42H34"
            stroke={PALETTE.accent}
            strokeWidth={3.8}
            strokeLinecap="round"
          />
          <path
            d="M8 32H56"
            stroke={PALETTE.accent}
            strokeWidth={2.5}
            strokeDasharray="4 4"
          />
        </svg>
      ),
    },
    {
      title: "AI Jujur",
      tag: "02 // TULIS",
      accent: PALETTE.accent,
      icon: (
        <svg width={88} height={88} viewBox="0 0 64 64" fill="none">
          <path
            d="M32 8L37.5 24.5L54 30L37.5 35.5L32 52L26.5 35.5L10 30L26.5 24.5L32 8Z"
            stroke={PALETTE.accent}
            strokeWidth={3.8}
            strokeLinejoin="round"
          />
          <circle cx={48} cy={14} r={4} fill={PALETTE.ink} />
        </svg>
      ),
    },
    {
      title: "Ekspor A4",
      tag: "03 // UNDUH",
      accent: PALETTE.appAccent,
      icon: (
        <svg width={88} height={88} viewBox="0 0 64 64" fill="none">
          <path
            d="M32 12V42M32 42L20 30M32 42L44 30"
            stroke={PALETTE.appAccent}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 50H50"
            stroke={PALETTE.ink}
            strokeWidth={4}
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <AbsoluteFill>
      {/* Kalimat utama: tengah-atas, ukuran lg, arah inUp */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 120,
          zIndex: 20,
        }}
      >
        <KineticLine
          id="s5-features"
          before="Impor,"
          highlight="tulis,"
          after="ekspor"
          punctuation="."
          size="lg"
          direction="inUp"
          align="center"
          startFrame={3}
          exitFrame={74}
        />
      </div>

      {/* Tiga tile ikon berlabel singkat (Bang Motion §8) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 340,
          display: "flex",
          justifyContent: "center",
          gap: 64,
          perspective: 1400,
        }}
      >
        {tiles.map((tile, idx) => {
          const delay = 8 + idx * 6;
          const p = interpolate(
            frame,
            [delay, delay + Math.round(0.65 * fps)],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASINGS.outBack,
            },
          );

          const exitP = interpolate(frame, [74, 88], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASINGS.inQuad,
          });

          const ty = interpolate(p, [0, 1], [110, 0]) - exitP * 70;
          const rotY = interpolate(p, [0, 1], [-28, 0]);
          const scale = interpolate(p, [0, 1], [0.82, 1]);

          return (
            <div
              key={tile.title}
              style={{
                width: 380,
                height: 410,
                borderRadius: 28,
                background:
                  "radial-gradient(85% 65% at 50% 115%, rgba(255, 90, 54, 0.18) 0%, rgba(255, 255, 255, 0.96) 72%)",
                border: `2.5px solid ${tile.accent}`,
                boxShadow:
                  "0 28px 64px rgba(20, 33, 61, 0.14), inset 0 -18px 36px rgba(255, 90, 54, 0.10)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 32,
                boxSizing: "border-box",
                opacity: p * (1 - exitP),
                transform: `translate3d(0px, ${ty}px, 0px) rotateY(${rotY}deg) scale(${scale})`,
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: tile.accent,
                  marginBottom: 24,
                }}
              >
                {tile.tag}
              </span>

              <div
                style={{
                  width: 148,
                  height: 148,
                  borderRadius: 32,
                  background: PALETTE.paper,
                  border: "1.5px solid rgba(20, 33, 61, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 28,
                  boxShadow: "0 12px 28px rgba(20, 33, 61, 0.08)",
                }}
              >
                {tile.icon}
              </div>

              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 36,
                  fontWeight: 600,
                  color: PALETTE.ink,
                  letterSpacing: "-0.01em",
                }}
              >
                {tile.title}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
