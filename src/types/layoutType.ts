export type Animation = {
  from: number;
  to: number;
  start: number;
  end: number;
  unit?: string;
};
export type AnimationVideoImage = Animation & {
  imageHeight: number;
  imagePathList: string[];
};
export const BlendAnimation = {
  Scale: 'scale',
  CropSide: 'cropSide',
} as const;
type BlendAnimation = typeof BlendAnimation[keyof typeof BlendAnimation];
export type AnimationBlendImage = {
  imagePathList: string[];
  end: number;
  inAnimationType?: BlendAnimation;
  outAnimationType?: BlendAnimation;
  inRatio?: number;
  outRatio?: number;
};
export type AnimationInOut = {
  in?: Animation;
  out?: Animation;
};
export type AnimationInfo = {
  selector: string;
  videoImage?: AnimationVideoImage;
  blendImage?: AnimationBlendImage;
  opacity?: AnimationInOut;
  rotateX?: AnimationInOut;
  rotateY?: AnimationInOut;
  rotateZ?: AnimationInOut;
  translateX?: AnimationInOut;
  translateY?: AnimationInOut;
  translateZ?: AnimationInOut;
  scaleX?: AnimationInOut;
  scaleY?: AnimationInOut;
  scaleZ?: AnimationInOut;
  skewX?: AnimationInOut;
  skewY?: AnimationInOut;
};
export type Scene = {
  type: 'normal' | 'sticky';
  selector: string;
  heightMultiple: number;
  animationList?: AnimationInfo[];
};
export type LocalScene = Scene & { scrollHeight: number };
export type ImageInfo = { selector: string; load: boolean; imageList: HTMLImageElement[] };
