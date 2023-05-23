import { AnimationTypes } from "./enums";

export type AnimationInfo = {
  frames: number;
  minCycles: number;
  maxCycles: number;
};

export type AnimationMap = Map<AnimationTypes, AnimationInfo>;
