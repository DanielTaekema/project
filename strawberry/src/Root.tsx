import { Composition } from "remotion";
import { Short, TOTAL_FRAMES } from "./Short";

export const Root = () => (
  <Composition id="Short" component={Short} durationInFrames={TOTAL_FRAMES} fps={30} width={1080} height={1920} />
);
