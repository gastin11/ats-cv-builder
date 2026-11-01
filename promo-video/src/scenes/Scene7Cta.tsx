import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticLine } from "../components/KineticLine";
import {
  EASINGS,
  FONTS,
  GITHUB_REPO_SHORT,
  GITHUB_REPO_URL,
  PALETTE,
} from "../theme";

/**
 * Adegan 7 (21–25 dtk · 120 frame): CTA & Link Repo GitHub
 * Kalimat: "Gratis & *open source*."
 * Visual: Kartu repositori GitHub besar dengan github.com/gastin11/ats-cv-builder (≥ 58px)
 *         ditahan > 3,5 detik agar jelas dibaca.
 */
export const Scene7Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = interpolate(frame, [4, Math.round(0.75 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.outQuart,
  });

  // Subtle scan-line sweep once across the CTA card as signature motion payoff
  const scanX = interpolate(frame, [18, 72], [-20, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.inOutCubic,
  });

  return (
    <AbsoluteFill>
      {/* Kalimat utama: tengah-atas, ukuran xl, arah inUp */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 118,
          zIndex: 20,
        }}
      >
        <KineticLine
          id="s7-cta"
          before="Gratis &"
          highlight="open source"
          after=""
          punctuation="."
          size="xl"
          direction="inUp"
          align="center"
          startFrame={3}
          exitFrame={9999}
        />
      </div>

      {/* Satu objek visual utama: Kartu GitHub Repo di tengah panggung */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 340,
          width: 1460,
          transform: `translateX(-50%) translateY(${interpolate(
            cardIn,
            [0, 1],
            [70, 0],
          )}px) scale(${interpolate(cardIn, [0, 1], [0.92, 1])})`,
          opacity: cardIn,
        }}
      >
        <div
          style={{
            position: "relative",
            background: PALETTE.ink,
            borderRadius: 32,
            border: `4px solid ${PALETTE.accent}`,
            boxShadow:
              "0 40px 95px rgba(20, 33, 61, 0.30), 0 0 0 12px rgba(255, 90, 54, 0.12)",
            padding: "54px 68px",
            color: "#FFFFFF",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
          }}
        >
          {/* Sapuan cahaya sekali melintasi kartu CTA */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${scanX}%`,
              width: 220,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255, 90, 54, 0.22) 50%, transparent 100%)",
              transform: "skewX(-20deg)",
              pointerEvents: "none",
            }}
          />

          {/* Baris atas: GitHub icon + Label repositori resmi */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              background: "rgba(255, 255, 255, 0.08)",
              padding: "12px 28px",
              borderRadius: 99,
              border: "1px solid rgba(255, 255, 255, 0.18)",
            }}
          >
            {/* GitHub Mark SVG */}
            <svg
              width={38}
              height={38}
              viewBox="0 0 24 24"
              fill="#FFFFFF"
              aria-hidden="true"
            >
              <path d="M12 0.297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: PALETTE.accentSoft,
              }}
            >
              MIT LICENSE · REACT + FASTIFY + TYPESCRIPT
            </span>
          </div>

          {/* Link Repo GitHub Utama (≥ 56px sesuai rencana!) */}
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 60,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.015em",
              background: "rgba(9, 14, 26, 0.65)",
              padding: "24px 44px",
              borderRadius: 20,
              border: "2px solid rgba(255, 90, 54, 0.55)",
              boxShadow: "inset 0 2px 18px rgba(0, 0, 0, 0.45)",
              textAlign: "center",
            }}
          >
            {GITHUB_REPO_SHORT}
          </div>

          {/* URL penuh di bawahnya */}
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 30,
              fontWeight: 500,
              color: PALETTE.accent,
              letterSpacing: "0.02em",
            }}
          >
            {GITHUB_REPO_URL}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
