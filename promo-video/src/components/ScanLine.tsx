import React from "react";
import { FONTS, PALETTE } from "../theme";

type ScanLineProps = {
  /** Vertical progress from 0 (top) to 1 (bottom) */
  readonly progress: number;
  readonly color?: string;
  readonly label?: string;
  readonly opacity?: number;
};

/**
 * Tanda tangan gerak: Garis Pindai (ATS Scan Line)
 * Menyapu dokumen CV dan menyalakan bagian yang dipindai.
 */
export const ScanLine: React.FC<ScanLineProps> = ({
  progress,
  color = PALETTE.accent,
  label = "ATS PARSER SCAN",
  opacity = 1,
}) => {
  const clamped = Math.max(0, Math.min(1, progress));
  const topPct = `${(clamped * 100).toFixed(2)}%`;

  return (
    <div
      style={{
        position: "absolute",
        left: -24,
        right: -24,
        top: topPct,
        height: 4,
        opacity,
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      {/* Trailing soft glow above scan bar */}
      <div
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          bottom: 2,
          height: 68,
          background: `linear-gradient(180deg, transparent 0%, ${color}33 100%)`,
        }}
      />
      {/* Core laser line */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: color,
          boxShadow: `0 0 22px ${color}, 0 0 6px #FFFFFF`,
          borderRadius: 4,
        }}
      />
      {/* Label pill on the right edge */}
      {label ? (
        <div
          style={{
            position: "absolute",
            right: 38,
            top: -16,
            background: color,
            color: "#FFFFFF",
            fontFamily: FONTS.mono,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.08em",
            padding: "4px 10px",
            borderRadius: 6,
            boxShadow: `0 4px 14px ${color}66`,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
