import React from "react";
import { Composition } from "remotion";
import { AtsCvPromo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AtsCvPromo"
        component={AtsCvPromo}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
