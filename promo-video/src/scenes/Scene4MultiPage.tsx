import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CanonicalCvSheet } from "../components/CvSheet";
import { KineticLine } from "../components/KineticLine";
import { EASINGS, FONTS, PALETTE } from "../theme";

/**
 * Adegan 4 (11–15 dtk · 120 frame): Momen Istimewa
 * Kalimat: "Rapi di *setiap* halaman."
 * Visual: Lembar CV A4 membelah jadi 2 halaman secara 3D (Live multi-page preview)
 *         tanpa memotong heading atau baris secara canggung.
 */
export const Scene4MultiPage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Split choreography: starts as single stack, unfolds into 2 pages in 3D at frame 18..62
  const splitP = interpolate(
    frame,
    [14, Math.round(1.9 * fps)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.outQuart,
    },
  );

  const page1X = interpolate(splitP, [0, 1], [0, -295]);
  const page1Z = interpolate(splitP, [0, 1], [30, 0]);
  const page1RotY = interpolate(splitP, [0, 1], [-18, 12]);

  const page2X = interpolate(splitP, [0, 1], [0, 295]);
  const page2Z = interpolate(splitP, [0, 1], [-60, 0]);
  const page2RotY = interpolate(splitP, [0, 1], [-18, -12]);

  // Laser pagination divider line flashes as the pages split
  const dividerOpacity = interpolate(
    frame,
    [12, 26, 70, 95],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill>
      {/* Kalimat utama: kiri-atas, ukuran md, arah inLeft */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 66,
          zIndex: 20,
        }}
      >
        <KineticLine
          id="s4-multipage"
          before="Rapi di"
          highlight="setiap"
          after="halaman"
          punctuation="."
          size="md"
          direction="inLeft"
          align="left"
          startFrame={3}
          exitFrame={102}
        />
      </div>

      {/* Satu objek visual (Momen Istimewa): Dua halaman A4 berlipat 3D */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 185,
          height: 820,
          perspective: 1800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Garis batas kalkulasi paginasi otomatis */}
        <div
          style={{
            position: "absolute",
            width: 6,
            height: 680,
            background: `linear-gradient(180deg, transparent 0%, ${PALETTE.accent} 20%, ${PALETTE.accent} 80%, transparent 100%)`,
            boxShadow: `0 0 28px ${PALETTE.accent}`,
            opacity: dividerOpacity,
            zIndex: 25,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: PALETTE.accent,
              color: "#FFFFFF",
              fontFamily: FONTS.mono,
              fontSize: 13,
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: 99,
              whiteSpace: "nowrap",
              letterSpacing: "0.08em",
              boxShadow: "0 8px 24px rgba(255, 90, 54, 0.45)",
            }}
          >
            AUTO-PAGINATION A4
          </div>
        </div>

        {/* Halaman 1 / 2 */}
        <div
          style={{
            position: "absolute",
            transform: `translate3d(${page1X}px, 0px, ${page1Z}px) rotateY(${page1RotY}deg) rotateX(4deg)`,
            transformStyle: "preserve-3d",
            zIndex: 10,
          }}
        >
          <CanonicalCvSheet
            width={510}
            height={700}
            pageNumber={1}
            totalPages={2}
            scanProgress={1}
            highlightActive
          />
        </div>

        {/* Halaman 2 / 2 */}
        <div
          style={{
            position: "absolute",
            transform: `translate3d(${page2X}px, 0px, ${page2Z}px) rotateY(${page2RotY}deg) rotateX(4deg)`,
            transformStyle: "preserve-3d",
            opacity: interpolate(splitP, [0, 0.25, 1], [0.4, 0.9, 1]),
            zIndex: 9,
          }}
        >
          <CanonicalCvSheet
            width={510}
            height={700}
            pageNumber={2}
            totalPages={2}
            scanProgress={1}
            highlightActive
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
