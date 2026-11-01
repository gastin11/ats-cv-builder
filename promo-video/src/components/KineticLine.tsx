import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASINGS, FONTS, PALETTE } from "../theme";
import { DirectionalBlur } from "./DirectionalBlur";

export type KineticSize = "sm" | "md" | "lg" | "xl";
export type KineticDirection = "inUp" | "inLeft";

type KineticLineProps = {
  readonly id: string;
  readonly before?: string;
  readonly highlight: string;
  readonly after?: string;
  readonly punctuation?: string;
  readonly size?: KineticSize;
  readonly direction?: KineticDirection;
  readonly dark?: boolean;
  readonly align?: "left" | "center" | "right";
  readonly startFrame?: number;
  readonly exitFrame?: number;
  readonly style?: React.CSSProperties;
};

const SIZE_MAP: Record<KineticSize, number> = {
  sm: 68,
  md: 82,
  lg: 94,
  xl: 108,
};

/**
 * Bang Motion Hukum #4 — Teks hidup:
 * - Sentence case weight 500–600
 * - Satu kata sorotan dengan garis marker oranye (#FF5A36) yang menggambar dari kiri
 * - Tanda baca (. / !) muncul terpisah paling akhir
 * - Masuk asimetris (0.75s outQuart) + keluar cepat (0.38s inQuad) dengan motion blur berarah
 */
export const KineticLine: React.FC<KineticLineProps> = ({
  id,
  before = "",
  highlight,
  after = "",
  punctuation = ".",
  size = "md",
  direction = "inUp",
  dark = false,
  align = "center",
  startFrame = 4,
  exitFrame = 9999,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fontSize = SIZE_MAP[size];
  const textColor = dark ? PALETTE.white : PALETTE.ink;
  const textShadow = dark ? "0 4px 28px rgba(0, 0, 0, 0.55)" : "none";

  const beforeWords = before.trim() ? before.trim().split(/\s+/) : [];
  const afterWords = after.trim() ? after.trim().split(/\s+/) : [];

  const inDur = Math.round(0.68 * fps);
  const outDur = Math.round(0.36 * fps);

  // Exit animation
  const exitProgress = interpolate(
    frame,
    [exitFrame, exitFrame + outDur],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.inQuad,
    },
  );

  // Entry motion blur
  const entryBlur = interpolate(
    frame,
    [startFrame, startFrame + inDur],
    [direction === "inLeft" ? 36 : 24, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.outQuart,
    },
  );

  const exitBlur = interpolate(
    frame,
    [exitFrame, exitFrame + outDur],
    [0, direction === "inLeft" ? 42 : 32],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.inQuad,
    },
  );

  const totalBlur = entryBlur + exitBlur;
  const blurX = direction === "inLeft" ? totalBlur : totalBlur * 0.1;
  const blurY = direction === "inUp" ? totalBlur : totalBlur * 0.1;

  const renderWord = (
    word: string,
    wordIdx: number,
    isLastBeforePunctuation = false,
  ) => {
    const wordStart = startFrame + wordIdx * 2;
    const p = interpolate(frame, [wordStart, wordStart + inDur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.outQuart,
    });

    const opacity = p * (1 - exitProgress);
    const tx =
      direction === "inLeft"
        ? interpolate(p, [0, 1], [-48, 0]) - exitProgress * 64
        : 0;
    const ty =
      direction === "inUp"
        ? interpolate(p, [0, 1], [52, 0]) - exitProgress * 56
        : -exitProgress * 30;
    const scaleY =
      direction === "inUp" ? interpolate(p, [0, 1], [1.28, 1]) : 1;

    return (
      <span
        key={`${word}-${wordIdx}`}
        style={{
          display: "inline-block",
          whiteSpace: "pre",
          opacity,
          translate: `${tx}px ${ty}px`,
          scale: `1 ${scaleY}`,
          marginRight: isLastBeforePunctuation ? "0.03em" : "0.26em",
        }}
      >
        {word}
      </span>
    );
  };

  // Highlighted word timing (appears slightly after leading words, per techniques.md §1)
  const hlStart = startFrame + beforeWords.length * 2 + Math.round(0.18 * fps);
  const hlWordP = interpolate(frame, [hlStart, hlStart + inDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.outQuart,
  });
  const barStart = hlStart + Math.round(0.12 * fps);
  const barScaleX = interpolate(
    frame,
    [barStart, barStart + Math.round(0.48 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.outQuart,
    },
  );

  // Trailing words start right after highlight word starts
  const afterBaseIdx = beforeWords.length + 2;

  // Punctuation pops last (techniques.md §1: popDot 0.25s after highlight)
  const dotStart =
    hlStart + afterWords.length * 2 + Math.round(0.26 * fps);
  const dotP = interpolate(
    frame,
    [dotStart, dotStart + Math.round(0.42 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.outBack,
    },
  );

  const hlTy =
    interpolate(hlWordP, [0, 1], [54, 0]) - exitProgress * 56;
  const dotTy =
    interpolate(dotP, [0, 1], [44, 0]) - exitProgress * 56;

  return (
    <DirectionalBlur
      id={`blur-${id}`}
      blurX={blurX}
      blurY={blurY}
      style={{
        textAlign: align,
        ...style,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontFamily: FONTS.display,
          fontSize,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          lineHeight: 1.12,
          color: textColor,
          textShadow,
          display: "inline-block",
        }}
      >
        {beforeWords.map((w, i) => renderWord(w, i))}

        {/* Highlighted word with signature orange marker bar drawing underneath */}
        <span
          style={{
            position: "relative",
            display: "inline-block",
            marginRight: afterWords.length > 0 ? "0.26em" : "0.04em",
            opacity: hlWordP * (1 - exitProgress),
            translate: `0px ${hlTy}px`,
            fontWeight: 600,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-0.06em",
              right: "-0.06em",
              bottom: "0.02em",
              height: "0.22em",
              borderRadius: "0.08em",
              background: PALETTE.accent,
              opacity: dark ? 0.92 : 0.85,
              transformOrigin: "0% 50%",
              transform: `scaleX(${barScaleX}) rotate(-1deg)`,
              zIndex: 0,
            }}
          />
          <span
            style={{
              position: "relative",
              zIndex: 1,
            }}
          >
            {highlight}
          </span>
        </span>

        {afterWords.map((w, i) =>
          renderWord(
            w,
            afterBaseIdx + i,
            Boolean(punctuation) && i === afterWords.length - 1,
          ),
        )}

        {punctuation ? (
          <span
            style={{
              display: "inline-block",
              color: PALETTE.accent,
              fontWeight: 700,
              opacity: dotP * (1 - exitProgress),
              translate: `0px ${dotTy}px`,
            }}
          >
            {punctuation}
          </span>
        ) : null}
      </h1>
    </DirectionalBlur>
  );
};
