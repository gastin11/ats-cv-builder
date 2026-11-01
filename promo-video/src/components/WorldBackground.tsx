import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS, PALETTE } from "../theme";

type WorldBackgroundProps = {
  readonly darkMode?: boolean;
};

/**
 * Bang Motion §7b, §7c, §7d:
 * - 3 layers: (1) Base paper (#F6F3EC) or dark ATS machine (#0F1626) switched behind cuts,
 *   (2) Warm radial ambient blobs + vignette,
 *   (3) Breathing editorial baseline grid (scale 1.0 <-> 1.035) + deterministic grain offset.
 * - Subdued in text pockets so typography always has high luminance contrast.
 */
export const WorldBackground: React.FC<WorldBackgroundProps> = ({
  darkMode = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Breathing grid scale (1.0 <-> 1.035 over ~7s)
  const gridScale = 1 + 0.018 * (1 + Math.sin(t * 0.95));
  const gridOpacity = darkMode ? 0.16 : 0.24;

  // Deterministic drift for ambient color blobs
  const blob1X = Math.sin(t * 0.7) * 55;
  const blob1Y = Math.cos(t * 0.55) * 40;
  const blob2X = Math.cos(t * 0.6) * -65;
  const blob2Y = Math.sin(t * 0.8) * 45;

  // Deterministic grain step (8 steps per second, pure function of frame)
  const grainStep = Math.floor(frame / 4);
  const grainOffsetX = ((grainStep * 37) % 120) - 60;
  const grainOffsetY = ((grainStep * 73) % 120) - 60;

  const baseBg = darkMode
    ? `radial-gradient(75% 55% at 50% 105%, rgba(255, 90, 54, 0.20) 0%, rgba(22, 32, 56, 0.45) 48%, transparent 75%), linear-gradient(180deg, #090E1A 0%, ${PALETTE.machineBg} 60%, #131D33 100%)`
    : `linear-gradient(165deg, #FAF8F3 0%, ${PALETTE.paper} 52%, ${PALETTE.paperWarm} 100%)`;

  const lineColor = darkMode
    ? "rgba(148, 163, 184, 0.16)"
    : "rgba(20, 33, 61, 0.09)";

  return (
    <div
      style={{
        position: "absolute",
        inset: -240,
        background: baseBg,
        overflow: "hidden",
      }}
    >
      {/* Layer 2: Soft ambient color blobs */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: -60,
          width: 1150,
          height: 1150,
          borderRadius: "50%",
          background: darkMode
            ? "radial-gradient(circle, rgba(255, 90, 54, 0.16) 0%, transparent 68%)"
            : "radial-gradient(circle, rgba(255, 90, 54, 0.13) 0%, transparent 68%)",
          translate: `${blob1X}px ${blob1Y}px`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: -100,
          width: 1100,
          height: 1100,
          borderRadius: "50%",
          background: darkMode
            ? "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 66%)"
            : "radial-gradient(circle, rgba(31, 77, 58, 0.11) 0%, transparent 66%)",
          translate: `${blob2X}px ${blob2Y}px`,
          pointerEvents: "none",
        }}
      />

      {/* Layer 3: Breathing editorial baseline & margin grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: gridOpacity,
          scale: `${gridScale}`,
          backgroundImage: `
            linear-gradient(to right, ${lineColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)
          `,
          backgroundSize: "120px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Editorial margin crop marks */}
      <div
        style={{
          position: "absolute",
          inset: 284,
          border: `1px solid ${
            darkMode ? "rgba(255,255,255,0.08)" : "rgba(20,33,61,0.10)"
          }`,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 14,
            left: 20,
            fontFamily: FONTS.mono,
            fontSize: 16,
            letterSpacing: "0.14em",
            color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(20,33,61,0.32)",
          }}
        >
          ATS-CV-SPEC // A4 · 210×297MM
        </span>
        <span
          style={{
            position: "absolute",
            top: 14,
            right: 20,
            fontFamily: FONTS.mono,
            fontSize: 16,
            letterSpacing: "0.14em",
            color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(20,33,61,0.32)",
          }}
        >
          LOCAL-FIRST · ZERO-DB
        </span>
      </div>

      {/* Layer 4: Deterministic live paper grain overlay */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          opacity: darkMode ? 0.09 : 0.07,
          mixBlendMode: darkMode ? "screen" : "multiply",
          pointerEvents: "none",
          translate: `${grainOffsetX}px ${grainOffsetY}px`,
          scale: "1.18",
        }}
      >
        <filter id="paper-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves={2}
            seed={11}
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-grain)" />
      </svg>

      {/* Soft perimeter vignette */}
      <div
        style={{
          position: "absolute",
          inset: 240,
          background: darkMode
            ? "radial-gradient(circle at 50% 50%, transparent 56%, rgba(4, 7, 15, 0.65) 100%)"
            : "radial-gradient(circle at 50% 50%, transparent 62%, rgba(20, 33, 61, 0.12) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
