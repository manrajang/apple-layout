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
  imageHeight: number;
  imagePathList: string[];
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
  private blendImageList: HTMLImageElement[] = [];

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

    if (this.yOffset > this.prevHeight + this.sceneList[this.currentScene].scrollHeight) {
      this.currentScene++;
      this.blendCanvasYPos = -1;
      this.blendImageList = [];
      this.showCurrentStikcyElement();
      return;
    }

    if (this.yOffset < this.prevHeight) {
      if (this.currentScene === 0) {
        return;
      }

      this.currentScene--;
      this.blendCanvasYPos = -1;
      this.blendImageList = [];
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

  private renderBlendFirstImage(
    el: HTMLCanvasElement,
    image: HTMLImageElement,
    leftX?: number,
    rightX?: number,
    width?: number,
  ): void {
    el.style.transform = `scale(${this.canvasFitRatio(el)})`;
    const context = el.getContext('2d');
    if (!context) {
      return;
    }

    context.drawImage(image, 0, 0);

    if (leftX !== undefined && rightX !== undefined && width !== undefined) {
      context.clearRect(leftX, 0, width, el.height);
      context.clearRect(rightX, 0, width, el.height);
    }
  }

  private renderBlendSecondImage(el: HTMLCanvasElement, image: HTMLImageElement, blendHeight: number): void {
    const { width: canvasWidth, height: canvasHeight } = el;
    el.getContext('2d')?.drawImage(
      image,
      0,
      canvasHeight - blendHeight,
      canvasWidth,
      blendHeight,
      0,
      canvasHeight - blendHeight,
      canvasWidth,
      blendHeight,
    );
  }

  private setCanvasStyle(el: HTMLCanvasElement, imageHeight: number): void {
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.transform = `translate3d(-50%, -50%, 0) scale(${window.innerHeight / imageHeight})`;
  }

  public resetLayout(sceneList: Scene[]): void {
    this.blendCanvasYPos = -1;
    this.blendImageList = [];
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

      animationList?.forEach(({ selector, videoImage, blendImage }) => {
        const el = sectionEl.querySelector<HTMLElement>(selector);
        if (!(el instanceof HTMLCanvasElement)) {
          return;
        }

        if (videoImage) {
          this.setCanvasStyle(el, videoImage.imageHeight);
        }

        if (blendImage) {
          const { imagePathList, inAnimationType, inRatio } = blendImage;
          let rectLeftX: number;
          let rectRightX: number;
          let rectWidth: number;

          if (inAnimationType === BlendAnimation.ResizeSide) {
            const fitWidth = document.body.offsetWidth / this.canvasFitRatio(el);
            rectWidth = fitWidth * (inRatio || 0);
            rectLeftX = (el.width - fitWidth) / 2;
            rectRightX = rectLeftX + fitWidth - rectWidth;
          }

          const image = new Image();
          image.src = imagePathList[0];
          image.onload = () => {
            this.renderBlendFirstImage(el, image, rectLeftX, rectRightX, rectWidth);
          };
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
    const { imagePathList, inAnimationType, inRatio, outAnimationType, outRatio } = blendImage;
    const { offsetTop, width: canvasWidth, height: canvasHeight } = el;
    const fitRatio = this.canvasFitRatio(el);

    if (this.blendImageList.length === 0) {
      const firstImage = new Image();
      firstImage.src = imagePathList[0];
      const secondImage = new Image();
      secondImage.src = imagePathList[1];
      this.blendCanvasYPos = offsetTop + (canvasHeight - canvasHeight * fitRatio) / 2;
      this.blendImageList = [firstImage, secondImage];
    }

    let end = this.blendCanvasYPos / scrollHeight;
    let rectLeftX;
    let rectRightX;
    let rectWidth;

    if (inAnimationType === BlendAnimation.ResizeSide) {
      let start = (this.blendCanvasYPos - window.innerHeight / 2) / scrollHeight;
      start = start >= 0 ? start : 0;
      const fitWidth = document.body.offsetWidth / fitRatio;
      rectWidth = fitWidth * (inRatio || 0);
      let from = (canvasWidth - fitWidth) / 2;
      rectLeftX = this.ratioValue({ from, to: from - rectWidth, start, end });
      from = from + fitWidth - rectWidth;
      rectRightX = this.ratioValue({ from, to: from + rectWidth, start, end });
    }

    this.renderBlendFirstImage(el, this.blendImageList[0], rectLeftX, rectRightX, rectWidth);

    if (scrollRatio < end) {
      el.classList.remove('sticky');
    } else {
      const start = end;
      end = end + 0.2;
      this.renderBlendSecondImage(
        el,
        this.blendImageList[1],
        this.ratioValue({ from: 0, to: canvasHeight, start, end }),
      );
      el.classList.add('sticky');
      el.style.top = `${-(canvasHeight - canvasHeight * fitRatio) / 2}px`;
    }

    if (scrollRatio > end) {
      const start = end;
      end = end + 0.2;
      el.style.transform = `scale(${this.ratioValue({ from: fitRatio, to: outRatio || 1, start, end })})`;
      el.style.marginTop = '0';
    }

    if (scrollRatio > end && 0 < end) {
      el.classList.remove('sticky');
      el.style.marginTop = `${scrollHeight * 0.4}px`;
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
