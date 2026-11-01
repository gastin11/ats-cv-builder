import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DirectionalBlur } from "./components/DirectionalBlur";
import { WorldBackground } from "./components/WorldBackground";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Machine } from "./scenes/Scene2Machine";
import { Scene3Product } from "./scenes/Scene3Product";
import { Scene4MultiPage } from "./scenes/Scene4MultiPage";
import { Scene5Features } from "./scenes/Scene5Features";
import { Scene6Score } from "./scenes/Scene6Score";
import { Scene7Cta } from "./scenes/Scene7Cta";
import { EASINGS, FONTS, GITHUB_REPO_SHORT, PALETTE } from "./theme";

/**
 * Compute camera rig transform (push-throughs, whip pan, dolly, pull-back,
 * plus continuous sinusoidal breathing) as a pure function of frame.
 */
function useCameraRig(frame: number, fps: number) {
  const t = frame / fps;

  // Continuous camera breathing (±3% zoom drift + subtle handheld sway)
  const breathScale = 1 + 0.028 * Math.sin(t * 1.05);
  const breathX = Math.sin(t * 0.75) * 10;
  const breathY = Math.cos(t * 0.65) * 8;

  let cutScale = 1;
  let cutX = 0;
  let cutY = 0;
  let blurX = 0;
  let blurY = 0;
  let origin = "50% 50%";

  // Cut 1 @ frame 90 (3s): 3D Push-through into rejected CV -> Dark ATS Machine
  if (frame >= 78 && frame < 90) {
    const p = interpolate(frame, [78, 90], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.inQuad,
    });
    cutScale = interpolate(p, [0, 1], [1, 2.05]);
    origin = "68% 52%";
    blurX = p * 18;
    blurY = p * 18;
  } else if (frame >= 90 && frame < 114) {
    const p = interpolate(frame, [90, 114], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.outQuart,
    });
    cutScale = interpolate(p, [0, 1], [1.45, 1]);
    origin = "50% 50%";
    blurX = (1 - p) * 16;
  }

  // Cut 2 @ frame 210 (7s): Whip pan with directional horizontal blur -> Product
  if (frame >= 200 && frame < 210) {
    const p = interpolate(frame, [200, 210], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.inQuad,
    });
    cutX = interpolate(p, [0, 1], [0, -170]);
    cutScale = interpolate(p, [0, 1], [1, 1.08]);
    blurX = p * 38;
  } else if (frame >= 210 && frame < 228) {
    const p = interpolate(frame, [210, 228], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.outQuart,
    });
    cutX = interpolate(p, [0, 1], [160, 0]);
    cutScale = interpolate(p, [0, 1], [1.08, 1]);
    blurX = (1 - p) * 34;
  }

  // Cut 3 @ frame 330 (11s): Motivated dolly push into A4 Preview -> Special Moment
  if (frame >= 318 && frame < 330) {
    const p = interpolate(frame, [318, 330], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.inQuad,
    });
    cutScale = interpolate(p, [0, 1], [1, 1.75]);
    origin = "72% 56%";
    blurY = p * 16;
  } else if (frame >= 330 && frame < 352) {
    const p = interpolate(frame, [330, 352], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.outQuart,
    });
    cutScale = interpolate(p, [0, 1], [1.32, 1]);
    origin = "50% 54%";
    blurY = (1 - p) * 14;
  }

  // Cut 4 @ frame 450 (15s): Depth pull to Feature Icon Tiles
  if (frame >= 440 && frame < 450) {
    const p = interpolate(frame, [440, 450], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.inQuad,
    });
    cutScale = interpolate(p, [0, 1], [1, 1.28]);
    cutY = interpolate(p, [0, 1], [0, -70]);
    blurY = p * 20;
  } else if (frame >= 450 && frame < 468) {
    const p = interpolate(frame, [450, 468], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.outQuart,
    });
    cutScale = interpolate(p, [0, 1], [0.88, 1]);
    cutY = interpolate(p, [0, 1], [60, 0]);
    blurY = (1 - p) * 16;
  }

  // Cut 5 @ frame 540 (18s): Whip-pan to ATS Readiness Instrument
  if (frame >= 531 && frame < 540) {
    const p = interpolate(frame, [531, 540], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.inQuad,
    });
    cutX = interpolate(p, [0, 1], [0, 140]);
    blurX = p * 26;
  } else if (frame >= 540 && frame < 556) {
    const p = interpolate(frame, [540, 556], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.outQuart,
    });
    cutX = interpolate(p, [0, 1], [-140, 0]);
    blurX = (1 - p) * 24;
  }

  // Cut 6 @ frame 630 (21s): Pull-back reveal to CTA GitHub Poster
  if (frame >= 620 && frame < 630) {
    const p = interpolate(frame, [620, 630], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.inQuad,
    });
    cutScale = interpolate(p, [0, 1], [1, 1.38]);
    blurX = p * 14;
    blurY = p * 14;
  } else if (frame >= 630 && frame < 652) {
    const p = interpolate(frame, [630, 652], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASINGS.outQuart,
    });
    cutScale = interpolate(p, [0, 1], [1.26, 1]);
    blurX = (1 - p) * 12;
  }

  return {
    scale: breathScale * cutScale,
    x: breathX + cutX,
    y: breathY + cutY,
    blurX,
    blurY,
    origin,
  };
}

export const AtsCvPromo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cam = useCameraRig(frame, fps);

  // Dark background only during Scene 2 (frames 90..209), switched cleanly behind cuts
  const isDarkSegment = frame >= 90 && frame < 210;

  // Light leak once on the special moment transition (around frame 330, Bang Motion §5)
  const lightLeakOpacity = interpolate(
    frame,
    [320, 330, 348],
    [0, 0.55, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Corner GitHub badge shown during Scene 6 (18s–21s) before expanding to main CTA at 21s
  const showCornerRepo = frame >= 540 && frame < 630;
  const cornerOpacity = interpolate(
    frame,
    [540, 554, 618, 630],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: isDarkSegment ? PALETTE.machineBg : PALETTE.paper,
        overflow: "hidden",
      }}
    >
      {/* Master Camera Rig (#world) — drives both background and scenes together */}
      <DirectionalBlur
        id="world-cam-blur"
        blurX={cam.blurX}
        blurY={cam.blurY}
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: cam.origin,
          transform: `translate3d(${cam.x.toFixed(2)}px, ${cam.y.toFixed(
            2,
          )}px, 0px) scale(${cam.scale.toFixed(4)})`,
        }}
      >
        <WorldBackground darkMode={isDarkSegment} />

        {/* 0–3s (0..90): Hook */}
        <Sequence durationInFrames={3 * fps} name="01-Hook">
          <Scene1Hook />
        </Sequence>

        {/* 3–7s (90..210): Mesin ATS */}
        <Sequence from={3 * fps} durationInFrames={4 * fps} name="02-Mesin-ATS">
          <Scene2Machine />
        </Sequence>

        {/* 7–11s (210..330): Produk Masuk */}
        <Sequence
          from={7 * fps}
          durationInFrames={4 * fps}
          name="03-Produk-Masuk"
        >
          <Scene3Product />
        </Sequence>

        {/* 11–15s (330..450): Momen Istimewa (3D Multi-Page A4) */}
        <Sequence
          from={11 * fps}
          durationInFrames={4 * fps}
          name="04-Momen-Istimewa-A4"
        >
          <Scene4MultiPage />
        </Sequence>

        {/* 15–18s (450..540): Fitur (3 Icon Tiles) */}
        <Sequence
          from={15 * fps}
          durationInFrames={3 * fps}
          name="05-Fitur-Tiles"
        >
          <Scene5Features />
        </Sequence>

        {/* 18–21s (540..630): Skor ATS + Privasi */}
        <Sequence
          from={18 * fps}
          durationInFrames={3 * fps}
          name="06-Skor-Privasi"
        >
          <Scene6Score />
        </Sequence>

        {/* 21–25s (630..750): CTA & Link Repo GitHub */}
        <Sequence
          from={21 * fps}
          durationInFrames={4 * fps}
          name="07-CTA-GitHub"
        >
          <Scene7Cta />
        </Sequence>
      </DirectionalBlur>

      {/* Voice Over Tracks (Neural TTS Bahasa Indonesia per scene) */}
      <Audio src={staticFile("voiceover/s1-hook.mp3")} volume={0.95} />
      <Audio
        from={3 * fps}
        src={staticFile("voiceover/s2-machine.mp3")}
        volume={0.95}
      />
      <Audio
        from={7 * fps}
        src={staticFile("voiceover/s3-product.mp3")}
        volume={0.95}
      />
      <Audio
        from={11 * fps}
        src={staticFile("voiceover/s4-multipage.mp3")}
        volume={0.95}
      />
      <Audio
        from={15 * fps}
        src={staticFile("voiceover/s5-features.mp3")}
        volume={0.95}
      />
      <Audio
        from={18 * fps}
        src={staticFile("voiceover/s6-score.mp3")}
        volume={0.95}
      />
      <Audio
        from={21 * fps}
        src={staticFile("voiceover/s7-cta.mp3")}
        volume={0.95}
      />

      {/* Pojok kanan-bawah Link Repo GitHub mulai detik 18 (sesuai rencana) */}
      {showCornerRepo ? (
        <div
          style={{
            position: "absolute",
            right: 68,
            bottom: 64,
            opacity: cornerOpacity,
            background: PALETTE.ink,
            color: "#FFFFFF",
            padding: "14px 24px",
            borderRadius: 14,
            border: `2px solid ${PALETTE.accent}`,
            boxShadow: "0 14px 36px rgba(20, 33, 61, 0.22)",
            fontFamily: FONTS.mono,
            fontSize: 30,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 14,
            zIndex: 50,
          }}
        >
          <span style={{ color: PALETTE.accent }}>★</span>
          <span>{GITHUB_REPO_SHORT}</span>
        </div>
      ) : null}

      {/* Light leak di depan lensa saat masuk Momen Istimewa (Bang Motion §5) */}
      {lightLeakOpacity > 0.01 ? (
        <div
          style={{
            position: "absolute",
            right: -400,
            top: -300,
            width: 1800,
            height: 1800,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255, 90, 54, 0.85) 0%, rgba(255, 180, 120, 0.35) 45%, transparent 70%)",
            filter: "blur(48px)",
            mixBlendMode: "screen",
            opacity: lightLeakOpacity,
            pointerEvents: "none",
            zIndex: 60,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
