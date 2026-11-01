import React from "react";

type DirectionalBlurProps = {
  readonly id: string;
  readonly blurX?: number;
  readonly blurY?: number;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/**
 * Bang Motion §2: Directional motion blur via SVG feGaussianBlur with widened
 * bounding region (-70% / 240%) so blur tails are never clipped. Automatically
 * detaches filter when blur is near zero to avoid unnecessary rasterization.
 */
export const DirectionalBlur: React.FC<DirectionalBlurProps> = ({
  id,
  blurX = 0,
  blurY = 0,
  children,
  style,
}) => {
  const bx = Math.max(0, blurX);
  const by = Math.max(0, blurY);
  const active = bx > 0.35 || by > 0.35;

  return (
    <div
      style={{
        ...style,
        filter: active ? `url(#${id})` : "none",
        willChange: active ? "transform, opacity, filter" : "transform, opacity",
      }}
    >
      {active ? (
        <svg
          width={0}
          height={0}
          style={{ position: "absolute", pointerEvents: "none" }}
          aria-hidden="true"
        >
          <defs>
            <filter id={id} x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`}
              />
            </filter>
          </defs>
        </svg>
      ) : null}
      {children}
    </div>
  );
};
