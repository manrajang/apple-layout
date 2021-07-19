type Animation = {
  from: number;
  to: number;
  start: number;
  end: number;
  unit?: string;
};
type AnimationVideoImage = Animation & {
  imageHeight: number;
  imagePathList: string[];
};
export const BlendAnimation = {
  Scale: 'scale',
  ResizeSide: 'resizeSide',
} as const;
type BlendAnimation = typeof BlendAnimation[keyof typeof BlendAnimation];
type AnimationBlendImage = {
  imagePathList: string[];
  end: number;
  inAnimationType?: BlendAnimation;
  outAnimationType?: BlendAnimation;
  inRatio?: number;
  outRatio?: number;
};
type AnimationInOut = {
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
type LocalScene = Scene & { scrollHeight: number };

export default class AppleLayout {
  private currentScene = 0;
  private prevHeight = 0;
  private yOffset = -1;
  private sceneList: LocalScene[] = [];
  private blendCanvasYPos = -1;
  private blendImageMap: { [key: string]: HTMLImageElement } = {};

  constructor(public container: HTMLDivElement, sceneList: Scene[]) {
    this.sceneList = sceneList.map((scene) => {
      return { ...scene, scrollHeight: 0 };
    });

    this.handleScroll = this.handleScroll.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.initEvents();
    this.resetLayout(sceneList);
  }

  public initEvents(): void {
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('resize', this.handleResize);
  }

  public destoryEvents(): void {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
  }

  private handleScroll(): void {
    this.yOffset = window.pageYOffset;
    this.prevHeight = 0;

    for (let i = 0; i < this.currentScene; i++) {
      this.prevHeight += this.sceneList[i].scrollHeight;
    }

    const currentHeight = this.prevHeight + this.sceneList[this.currentScene].scrollHeight;
    if (this.yOffset > currentHeight - window.innerHeight) {
      this.preRenderBlendImage(this.currentScene + 1);
    }

    if (this.yOffset > currentHeight) {
      this.currentScene++;
      this.blendCanvasYPos = -1;
      this.showCurrentStikcyElement();
      return;
    }

    if (this.yOffset < this.prevHeight) {
      if (this.currentScene === 0) {
        return;
      }

      this.currentScene--;
      this.blendCanvasYPos = -1;
      this.showCurrentStikcyElement();
      return;
    }

    this.playAnimation();
  }

  private handleResize(): void {
    this.resetLayout(this.sceneList);
  }

  private renderImage(el: HTMLCanvasElement, path: string): void {
    const image = new Image();
    image.src = path;
    image.onload = () => {
      el.getContext('2d')?.drawImage(image, 0, 0);
    };
  }

  private canvasFitRatio(el: HTMLCanvasElement): number {
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
    const { width: canvasWidth, height: canvasHeight } = el;
    const widthRatio = windowWidth / canvasWidth;
    const heigthRaito = windowHeight / canvasHeight;
    return widthRatio <= heigthRaito ? heigthRaito : widthRatio;
  }

  private loadBlendImage(path: string, callback: () => void): void {
    if (!this.blendImageMap[path]) {
      const image = new Image();
      image.src = path;
      image.onload = () => {
        this.blendImageMap[path] = image;
        callback();
      };
    }
  }

  private preRenderBlendImage(sceneIndex: number): void {
    const scene = this.sceneList[sceneIndex];
    if (!scene) {
      return;
    }

    const { selector, animationList } = scene;
    const sectionEl = document.querySelector<HTMLElement>(selector);
    if (!sectionEl || !animationList) {
      return;
    }

    animationList?.forEach(({ selector, blendImage }) => {
      const el = sectionEl.querySelector<HTMLElement>(selector);
      if (!(el instanceof HTMLCanvasElement) || !blendImage) {
        return;
      }

      const { imagePathList, inAnimationType, inRatio } = blendImage;
      this.loadBlendImage(imagePathList[0], () => {
        this.preRenderBlendImage(sceneIndex);
      });

      if (!this.blendImageMap[imagePathList[0]]) {
        return;
      }

      const fitRatio = this.canvasFitRatio(el);
      el.getContext('2d')?.drawImage(this.blendImageMap[imagePathList[0]], 0, 0);

      if (inAnimationType === BlendAnimation.ResizeSide) {
        const { width: canvasWidth, height: canvasHeight } = el;
        const fitWidth = document.body.offsetWidth / fitRatio;
        const rectWidth = fitWidth * (inRatio || 0);
        const leftX = (canvasWidth - fitWidth) / 2;
        el.style.transform = `scale(${fitRatio})`;
        el.getContext('2d')?.clearRect(leftX, 0, rectWidth, canvasHeight);
        el.getContext('2d')?.clearRect(leftX + fitWidth - rectWidth, 0, rectWidth, canvasHeight);
      } else if (!inAnimationType) {
        el.style.transform = `scale(${fitRatio})`;
      }
    });
  }

  private resizeAnimation(el: HTMLCanvasElement, leftX: number, rightX: number, rectWidth = 0): void {
    el.getContext('2d')?.clearRect(leftX, 0, rectWidth, el.height);
    el.getContext('2d')?.clearRect(rightX, 0, rectWidth, el.height);
  }

  private setCanvasStyle(el: HTMLCanvasElement, imageHeight: number): void {
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.transform = `translate3d(-50%, -50%, 0) scale(${window.innerHeight / imageHeight})`;
  }

  public resetLayout(sceneList: Scene[]): void {
    this.blendCanvasYPos = -1;
    this.blendImageMap = {};
    this.sceneList = sceneList.map(({ type, selector, heightMultiple, animationList }) => {
      const sectionEl = document.querySelector<HTMLElement>(selector);
      if (!sectionEl) {
        return { type, selector, heightMultiple, animationList, scrollHeight: 0 };
      }

      return {
        type,
        selector,
        heightMultiple,
        animationList,
        scrollHeight: type === 'sticky' ? heightMultiple * window.innerHeight : sectionEl.offsetHeight,
      };
    });
    this.sceneList.forEach(({ type, selector, animationList, scrollHeight }) => {
      const sectionEl = document.querySelector<HTMLElement>(selector);
      if (!sectionEl) {
        return;
      }

      if (type === 'sticky') {
        sectionEl.style.height = `${scrollHeight}px`;
      }

      animationList?.forEach(({ selector, videoImage }) => {
        const el = sectionEl.querySelector<HTMLElement>(selector);
        if (!(el instanceof HTMLCanvasElement)) {
          return;
        }

        if (videoImage) {
          this.setCanvasStyle(el, videoImage.imageHeight);
        }
      });
    });
    this.yOffset = window.pageYOffset;
    let totalHeight = 0;
    for (let i = 0; i < this.sceneList.length; i++) {
      totalHeight += this.sceneList[i].scrollHeight;

      if (totalHeight >= this.yOffset) {
        this.currentScene = i;
        break;
      }
    }

    this.showCurrentStikcyElement();
  }

  private showCurrentStikcyElement(): void {
    this.sceneList.forEach(({ selector }, index) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) {
        return;
      }

      const display = index === this.currentScene ? 'block' : 'none';
      el.querySelectorAll<HTMLElement>('.sticky-element').forEach((el) => {
        el.style.display = display;
      });
      el.querySelectorAll<HTMLElement>('.sticky-canvas').forEach((el) => {
        el.style.display = display;
      });
    });
  }

  public playAnimation(): void {
    const partYOffset = this.yOffset - this.prevHeight;
    const { selector, animationList, scrollHeight } = this.sceneList[this.currentScene];
    const sectionEl = document.querySelector<HTMLElement>(selector);
    const scrollRatio = partYOffset / scrollHeight;
    animationList?.forEach(({ selector, videoImage, blendImage, opacity, ...transform }) => {
      const el = sectionEl?.querySelector<HTMLElement>(selector);
      if (!el) {
        return;
      }

      if (videoImage && el instanceof HTMLCanvasElement) {
        const { imagePathList, ...animation } = videoImage;
        this.renderImage(el, imagePathList[Math.round(this.ratioValue(animation))]);
      }

      if (blendImage && el instanceof HTMLCanvasElement) {
        this.blendAnimation(blendImage, scrollRatio, el);
      }

      if (opacity) {
        el.style.opacity = this.opacityAnimation(opacity, scrollRatio);
      }

      const transformList = Object.keys(transform);
      if (transformList.length) {
        el.style.transform = transformList
          .reduce<string[]>((acc, key) => {
            if (
              key === 'rotateX' ||
              key === 'rotateY' ||
              key === 'rotateZ' ||
              key === 'translateX' ||
              key === 'translateY' ||
              key === 'translateZ' ||
              key === 'scaleX' ||
              key === 'scaleY' ||
              key === 'scaleZ' ||
              key === 'skewX' ||
              key === 'skewY'
            ) {
              const transformValue = transform[key];
              if (transformValue) {
                acc.push(this.transformAnimation(transformValue, scrollRatio, key));
              }
            }

            return acc;
          }, [])
          .join(' ');
      }
    });
  }

  private blendAnimation(blendImage: AnimationBlendImage, scrollRatio: number, el: HTMLCanvasElement): void {
    const { scrollHeight } = this.sceneList[this.currentScene];
    const { imagePathList, end: animationEnd, inAnimationType, inRatio, outAnimationType, outRatio } = blendImage;
    const { offsetTop, width: canvasWidth, height: canvasHeight } = el;
    const fitRatio = this.canvasFitRatio(el);

    if (this.blendCanvasYPos === -1) {
      this.blendCanvasYPos = offsetTop + (canvasHeight - canvasHeight * fitRatio) / 2;
    }

    this.loadBlendImage(imagePathList[0], () => {
      this.playAnimation();
    });
    this.loadBlendImage(imagePathList[1], () => {
      this.playAnimation();
    });

    let completeLoadedImage = true;
    imagePathList.forEach((path) => {
      if (!this.blendImageMap[path]) {
        completeLoadedImage = false;
      }
    });

    if (!completeLoadedImage) {
      return;
    }

    el.getContext('2d')?.drawImage(this.blendImageMap[imagePathList[0]], 0, 0);
    const animationStart = this.blendCanvasYPos / scrollHeight;
    const diff = animationEnd - animationStart;
    const interval = outAnimationType ? diff / 2 : diff;

    if (inAnimationType) {
      let start = (this.blendCanvasYPos - window.innerHeight / 2) / scrollHeight;
      start = start >= 0 ? start : 0;
      const end = animationStart;

      if (inAnimationType === BlendAnimation.ResizeSide) {
        const fitWidth = document.body.offsetWidth / fitRatio;
        const rectWidth = fitWidth * (inRatio || 0);
        const leftFrom = (canvasWidth - fitWidth) / 2;
        const rightFrom = leftFrom + fitWidth - rectWidth;
        this.resizeAnimation(
          el,
          this.ratioValue({ from: leftFrom, to: leftFrom - rectWidth, start, end }),
          this.ratioValue({ from: rightFrom, to: rightFrom + rectWidth, start, end }),
          rectWidth,
        );
        el.style.transform = `scale(${fitRatio})`;
      } else if (outAnimationType === BlendAnimation.Scale) {
        el.style.transform = `scale(${this.ratioValue({
          from: el.getBoundingClientRect().width / el.width,
          to: fitRatio,
          start,
          end,
        })})`;
      }
    } else {
      el.style.transform = `scale(${fitRatio})`;
    }

    let nextAnimationStart = animationStart;
    if (scrollRatio < nextAnimationStart) {
      el.classList.remove('sticky');
    } else {
      const end = nextAnimationStart + interval;
      const blendHeight = this.ratioValue({ from: 0, to: canvasHeight, start: nextAnimationStart, end });
      el.getContext('2d')?.drawImage(
        this.blendImageMap[imagePathList[1]],
        0,
        canvasHeight - blendHeight,
        canvasWidth,
        blendHeight,
        0,
        canvasHeight - blendHeight,
        canvasWidth,
        blendHeight,
      );
      el.classList.add('sticky');
      el.style.top = `${-(canvasHeight - canvasHeight * fitRatio) / 2}px`;
      el.style.marginTop = '0';
      nextAnimationStart = end;
    }

    if (scrollRatio > nextAnimationStart && outAnimationType) {
      const start = nextAnimationStart;
      const end = nextAnimationStart + interval;

      if (outAnimationType === BlendAnimation.ResizeSide) {
        const fitWidth = document.body.offsetWidth / fitRatio;
        const rectWidth = fitWidth * (outRatio || 0);
        const leftTo = (canvasWidth - fitWidth) / 2;
        const rightTo = leftTo + fitWidth - rectWidth;
        this.resizeAnimation(
          el,
          this.ratioValue({ from: leftTo - rectWidth, to: leftTo, start, end }),
          this.ratioValue({ from: rightTo + rectWidth, to: rightTo, start, end }),
          rectWidth,
        );
      } else if (outAnimationType === BlendAnimation.Scale) {
        el.style.transform = `scale(${this.ratioValue({ from: fitRatio, to: outRatio || 1, start, end })})`;
      }

      el.style.marginTop = '0';
      nextAnimationStart = end;
    }

    if (scrollRatio > nextAnimationStart && 0 < nextAnimationStart) {
      el.classList.remove('sticky');
      el.style.marginTop = `${scrollHeight * diff}px`;
    }
  }

  private opacityAnimation({ in: inAnimation, out: outAnimation }: AnimationInOut, scrollRatio: number): string {
    const oneAnimation = inAnimation || outAnimation;
    if (inAnimation && outAnimation) {
      if (scrollRatio <= (inAnimation.end + outAnimation.start) / 2) {
        return `${this.ratioValue(inAnimation)}`;
      } else {
        return `${this.ratioValue(outAnimation)}`;
      }
    } else if (oneAnimation) {
      return `${this.ratioValue(oneAnimation)}`;
    }

    return '';
  }

  private transformAnimation(
    { in: inAnimation, out: outAnimation }: AnimationInOut,
    scrollRatio: number,
    animationType: string,
  ): string {
    const oneAnimation = inAnimation || outAnimation;
    if (inAnimation && outAnimation) {
      if (scrollRatio <= (inAnimation.end + outAnimation.start) / 2) {
        return `${this.transformValue(animationType, this.ratioValue(inAnimation), inAnimation.unit)}`;
      } else {
        return `${this.transformValue(animationType, this.ratioValue(outAnimation), outAnimation.unit)}`;
      }
    } else if (oneAnimation) {
      return `${this.transformValue(animationType, this.ratioValue(oneAnimation), oneAnimation.unit)}`;
    }

    return '';
  }

  private transformValue(style: string, value: number, unit?: string): string {
    if (style === 'rotateX' || style === 'rotateY' || style === 'rotateZ' || style === 'skewX' || style === 'skewY') {
      return `${style}(${value}${unit || 'deg'})`;
    } else if (style === 'translateX' || style === 'translateY' || style === 'translateZ') {
      return `${style}(${value}${unit || 'px'})`;
    }

    return `${style}(${value})`;
  }

  private ratioValue({ from, to, start, end }: Animation): number {
    const { scrollHeight } = this.sceneList[this.currentScene];
    const partStart = start * scrollHeight;
    const partEnd = end * scrollHeight;
    const partHeight = partEnd - partStart;
    const partYOffset = this.yOffset - this.prevHeight;

    if (partYOffset >= partStart && partYOffset <= partEnd) {
      return ((partYOffset - partStart) / partHeight) * (to - from) + from;
    } else if (partYOffset < partStart) {
      return from;
    }

    return to;
  }
}
