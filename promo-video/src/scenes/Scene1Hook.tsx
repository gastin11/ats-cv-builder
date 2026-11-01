import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticLine } from "../components/KineticLine";
import { ScanLine } from "../components/ScanLine";
import { EASINGS, FONTS, PALETTE } from "../theme";

/**
 * Adegan 1 (0–3 dtk · 90 frame): Hook
 * Kalimat: "CV bagus pun bisa *ditolak* sistem."
 * Visual: Tumpukan CV miring 3D, garis pindai menyapu CV multi-kolom lalu tercap "REJECTED".
 */
export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Stack entrance from bottom-right with 3D perspective
  const cardIn = interpolate(frame, [0, Math.round(0.75 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.outQuart,
  });

  // Scan line sweeps down the CV sheet between frame 14 and 54
  const scanProg = interpolate(frame, [14, 54], [0.08, 0.88], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.inOutCubic,
  });

  // Stamp slams down at frame 42
  const stampP = interpolate(frame, [40, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.outBack,
  });

  const stampScale = interpolate(stampP, [0, 1], [2.4, 1]);

  return (
    <AbsoluteFill>
      {/* Kalimat utama: kiri-atas, ukuran lg, arah inUp */}
      <div
        style={{
          position: "absolute",
          left: 116,
          top: 138,
          maxWidth: 920,
          zIndex: 20,
        }}
      >
        <KineticLine
          id="s1-hook"
          before="CV bagus pun bisa"
          highlight="ditolak"
          after="sistem"
          punctuation="."
          size="lg"
          direction="inUp"
          align="left"
          startFrame={3}
          exitFrame={74}
        />
      </div>

      {/* Satu objek visual: tumpukan CV miring 3D di kanan-tengah */}
      <div
        style={{
          position: "absolute",
          right: 140,
          top: 150,
          width: 680,
          height: 780,
          perspective: 1500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Lembar CV belakang 1 */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 680,
            background: "#EAE4D7",
            borderRadius: 10,
            border: "1px solid rgba(20,33,61,0.14)",
            boxShadow: "0 18px 40px rgba(20,33,61,0.10)",
            transform: `translate3d(${interpolate(cardIn, [0, 1], [120, -34])}px, ${interpolate(cardIn, [0, 1], [180, 22])}px, -80px) rotateZ(-9deg) rotateY(-12deg)`,
            opacity: cardIn * 0.85,
          }}
        />

        {/* Lembar CV belakang 2 */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 680,
            background: "#F2EDE2",
            borderRadius: 10,
            border: "1px solid rgba(20,33,61,0.16)",
            boxShadow: "0 20px 44px rgba(20,33,61,0.12)",
            transform: `translate3d(${interpolate(cardIn, [0, 1], [90, 26])}px, ${interpolate(cardIn, [0, 1], [150, 10])}px, -40px) rotateZ(6deg) rotateY(-10deg)`,
            opacity: cardIn * 0.92,
          }}
        />

        {/* Lembar CV utama (2 kolom + tabel rumit yang gagal dibaca ATS) */}
        <div
          style={{
            position: "relative",
            width: 510,
            height: 690,
            background: "#FFFFFF",
            borderRadius: 10,
            border: "2px solid rgba(20,33,61,0.18)",
            boxShadow: "0 30px 70px rgba(20,33,61,0.20)",
            padding: 28,
            boxSizing: "border-box",
            transform: `translate3d(0px, ${interpolate(cardIn, [0, 1], [140, 0])}px, 0px) rotateZ(-2.5deg) rotateY(-10deg) rotateX(6deg)`,
            opacity: cardIn,
            overflow: "hidden",
          }}
        >
          {/* Garis pindai merah menyapu lembar CV */}
          <ScanLine
            progress={scanProg}
            color={PALETTE.danger}
            label="ATS BOT // PARSE FAIL"
            opacity={frame >= 12 && frame <= 78 ? 1 : 0}
          />

          {/* Layout CV 2 kolom yang membingungkan parser */}
          <div style={{ display: "flex", gap: 18, height: "100%" }}>
            {/* Sidebar kiri gelap penuh grafik bar */}
            <div
              style={{
                width: "36%",
                background: "#1E293B",
                borderRadius: 8,
                padding: 16,
                color: "#F8FAFC",
                fontFamily: FONTS.ui,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#475569",
                  marginBottom: 16,
                }}
              />
              <div
                style={{
                  height: 12,
                  width: "85%",
                  background: "#94A3B8",
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  height: 8,
                  width: "65%",
                  background: "#64748B",
                  borderRadius: 4,
                  marginBottom: 24,
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  fontFamily: FONTS.mono,
                  color: "#F87171",
                  marginBottom: 10,
                }}
              >
                SKILL CHARTS (?)
              </div>
              {[78, 92, 64, 85].map((pct, idx) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      height: 6,
                      width: "60%",
                      background: "#64748B",
                      borderRadius: 3,
                      marginBottom: 5,
                    }}
                  />
                  <div
                    style={{
                      height: 8,
                      width: "100%",
                      background: "#334155",
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: frame > 32 ? PALETTE.danger : "#38BDF8",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Kolom kanan bertabel bertingkat */}
            <div style={{ flex: 1, paddingTop: 6 }}>
              <div
                style={{
                  height: 22,
                  width: "75%",
                  background: "#14213D",
                  borderRadius: 4,
                  marginBottom: 10,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: "50%",
                  background: "#94A3B8",
                  borderRadius: 4,
                  marginBottom: 22,
                }}
              />

              {/* Kotak-kotak tabel yang disilang merah */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                {[0, 1, 2, 3].map((cell) => (
                  <div
                    key={cell}
                    style={{
                      height: 76,
                      borderRadius: 6,
                      border: `1.5px dashed ${
                        frame > 28 ? PALETTE.danger : "#CBD5E1"
                      }`,
                      background:
                        frame > 28
                          ? "rgba(217, 45, 32, 0.06)"
                          : "rgba(241, 245, 249, 0.8)",
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        height: 8,
                        width: "80%",
                        background: "#94A3B8",
                        borderRadius: 3,
                        marginBottom: 8,
                      }}
                    />
                    <div
                      style={{
                        height: 8,
                        width: "55%",
                        background: "#CBD5E1",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                ))}
              </div>

              {[0, 1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  style={{
                    height: 10,
                    width: `${92 - (row % 3) * 14}%`,
                    background: "#E2E8F0",
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Cap REJECTED besar */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "52%",
              transform: `translate(-50%, -50%) rotate(-14deg) scale(${stampScale})`,
              opacity: stampP,
              border: `6px solid ${PALETTE.danger}`,
              borderRadius: 12,
              padding: "14px 28px",
              background: "rgba(255, 245, 245, 0.95)",
              boxShadow: "0 16px 40px rgba(217, 45, 32, 0.28)",
              textAlign: "center",
              zIndex: 40,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 44,
                fontWeight: 700,
                letterSpacing: "0.10em",
                color: PALETTE.danger,
                lineHeight: 1,
              }}
            >
              REJECTED
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.16em",
                color: PALETTE.ink,
                marginTop: 6,
              }}
            >
              ATS PARSER ERROR
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
