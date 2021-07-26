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
  CropSide: 'cropSide',
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
type ImageInfo = { selector: string; imageList: HTMLImageElement[] };

export default class AppleLayout {
  private accYOffset = 0;
  private blendCanvasYPos = -1;
  private blendImageInfo: ImageInfo[] = [];
  private currentScene = 0;
  private currentYOffset = 0;
  private prevImageIndex = -1;
  private prevScene = 0;
  private prevScrollHeight = 0;
  private rafId = -1;
  private sceneList: LocalScene[] = [];
  private videoImageInfo: ImageInfo[] = [];
  private windowWidth = 0;

  constructor(public container: HTMLDivElement, sceneList: Scene[]) {
    this.sceneList = sceneList.map((scene) => {
      return { ...scene, scrollHeight: 0 };
    });

    this.handleScroll = this.handleScroll.bind(this);
    this.handlScrollTop = this.handlScrollTop.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleOrientationChange = this.handleOrientationChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);

    this.initEvents();
    this.resetLayout(sceneList);
  }

  public initEvents(): void {
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleOrientationChange);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  public destoryEvents(): void {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  private handleScroll(): void {
    this.prevScene = this.currentScene;
    this.currentYOffset = window.pageYOffset;

    this.prevScrollHeight = 0;
    for (let i = 0; i < this.currentScene; i++) {
      this.prevScrollHeight += this.sceneList[i].scrollHeight;
    }

    const currentScrollHeight = this.prevScrollHeight + this.sceneList[this.currentScene].scrollHeight;
    if (this.currentYOffset > currentScrollHeight - window.innerHeight) {
      this.preRenderBlendImage(this.currentScene + 1);
    }

    if (this.rafId === -1) {
      this.rafId = requestAnimationFrame(this.rafScroll.bind(this));
    }

    if (this.accYOffset > currentScrollHeight) {
      if (this.currentScene < this.sceneList.length - 1) {
        this.currentScene++;
        this.showStickyElement();
      } else {
        this.showStickyElement(false);
      }

      this.blendCanvasYPos = -1;
      this.prevImageIndex = -1;
      return;
    }

    if (this.accYOffset < this.prevScrollHeight) {
      if (this.currentScene === 0) {
        return;
      }

      this.currentScene--;
      this.blendCanvasYPos = -1;
      this.prevImageIndex = -1;
      this.showStickyElement();
      return;
    }
  }

  private rafScroll(): void {
    this.accYOffset = this.accYOffset + (this.currentYOffset - this.accYOffset) * 0.2;

    if (this.currentScene === this.prevScene) {
      this.playAnimation();
    }

    this.rafId = requestAnimationFrame(this.rafScroll.bind(this));

    if (Math.abs(this.currentYOffset - this.accYOffset) < 1) {
      cancelAnimationFrame(this.rafId);
      this.rafId = -1;
    }
  }

  private handlScrollTop(): void {
    this.resetLayout(this.sceneList);
  }

  private handleResize(): void {
    if (this.windowWidth !== window.innerWidth) {
      scrollTo(0, 0);
      window.addEventListener('scroll', this.handlScrollTop, { once: true });
    }
  }

  private handleOrientationChange(): void {
    setTimeout(() => {
      scrollTo(0, 0);
      window.addEventListener('scroll', this.handlScrollTop);
    }, 500);
  }

  private handleBeforeUnload(): void {
    let prevScrollHeight = 0;
    for (let i = 0; i < this.currentScene; i++) {
      prevScrollHeight += this.sceneList[i].scrollHeight;
    }

    if (this.currentYOffset > 0) {
      scrollTo(0, prevScrollHeight + 5);
    } else {
      scrollTo(0, 0);
    }
  }

  private canvasFitRatio(el: HTMLCanvasElement): number {
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
    const { width: canvasWidth, height: canvasHeight } = el;
    const widthRatio = windowWidth / canvasWidth;
    const heigthRaito = windowHeight / canvasHeight;
    return widthRatio <= heigthRaito ? heigthRaito : widthRatio;
  }

  private async loadVideoImagesInRestScene(): Promise<void> {
    this.sceneList.forEach(({ animationList }) => {
      animationList?.forEach(({ selector, videoImage }) => {
        if (videoImage) {
          const { imagePathList } = videoImage;
          if (imagePathList.length === 0) {
            return;
          }

          const findImageInfo = this.videoImageInfo.find(({ selector: _selector }) => {
            return _selector === selector;
          });
          if (!findImageInfo) {
            this.videoImageInfo.push({
              selector,
              imageList: imagePathList.map((path) => {
                const image = new Image();
                image.src = path;
                return image;
              }),
            });
            return;
          }
        }
      });
    });
  }

  private async loadVideoImagesInCurrentScene(
    selector: string,
    imagePathList: string[],
    el: HTMLCanvasElement,
    drawIndex: number,
  ): Promise<void> {
    if (imagePathList.length === 0) {
      return;
    }

    const findImageInfo = this.videoImageInfo.find(({ selector: _selector }) => {
      return _selector === selector;
    });
    if (!findImageInfo) {
      this.videoImageInfo.push({
        selector,
        imageList: imagePathList.map((path, index) => {
          const image = new Image();
          image.src = path;
          if (index === drawIndex) {
            image.onload = () => {
              el.getContext('2d')?.drawImage(image, 0, 0);
            };
          }
          return image;
        }),
      });
    }
  }

  private loadBlendImages(selector: string, imagePathList: string[]): void {
    if (imagePathList.length === 0) {
      return;
    }

    const findImageInfo = this.blendImageInfo.find(({ selector: _selector }) => {
      return _selector === selector;
    });
    if (!findImageInfo) {
      this.blendImageInfo.push({
        selector,
        imageList: imagePathList.map((path) => {
          const image = new Image();
          image.src = path;
          return image;
        }),
      });
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
      if (!blendImage) {
        return;
      }

      const findImageInfo = this.blendImageInfo.find(({ selector: _selector }) => {
        return _selector === selector;
      });
      if (!findImageInfo) {
        return;
      }

      const el = sectionEl.querySelector<HTMLCanvasElement>(selector);
      if (!el) {
        return;
      }

      el.getContext('2d')?.drawImage(findImageInfo.imageList[0], 0, 0);

      const { inAnimationType, inRatio } = blendImage;
      const fitRatio = this.canvasFitRatio(el);
      if (inAnimationType === BlendAnimation.CropSide) {
        const { width: canvasWidth, height: canvasHeight } = el;
        const fitWidth = document.body.offsetWidth / fitRatio;
        const rectWidth = fitWidth * (inRatio || 0);
        const leftX = (canvasWidth - fitWidth) / 2;
        el.style.transform = `translateX(-50%) scale(${fitRatio})`;
        el.getContext('2d')?.clearRect(leftX, 0, rectWidth, canvasHeight);
        el.getContext('2d')?.clearRect(leftX + fitWidth - rectWidth, 0, rectWidth, canvasHeight);
      } else if (!inAnimationType) {
        el.style.transform = `translateX(-50%) scale(${fitRatio})`;
      }
    });
  }

  private setCanvasStyle(el: HTMLCanvasElement, imageHeight: number): void {
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.transform = `translate3d(-50%, -50%, 0) scale(${window.innerHeight / imageHeight})`;
  }

  public resetLayout(sceneList: Scene[]): void {
    this.blendCanvasYPos = -1;
    this.currentYOffset = window.pageYOffset;
    this.prevImageIndex = -1;
    this.prevScene = 0;
    this.windowWidth = window.innerWidth;
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
    this.sceneList.forEach(({ type, selector, scrollHeight, animationList }) => {
      const sectionEl = document.querySelector<HTMLElement>(selector);
      if (!sectionEl) {
        return;
      }

      if (type === 'sticky') {
        sectionEl.style.height = `${scrollHeight}px`;
      }

      animationList?.forEach(({ selector, videoImage, blendImage }) => {
        const el = sectionEl.querySelector<HTMLCanvasElement>(selector);
        if (!el) {
          return;
        }

        if (videoImage) {
          this.setCanvasStyle(el, videoImage.imageHeight);
        }

        if (blendImage) {
          this.loadBlendImages(selector, blendImage.imagePathList);
        }
      });
    });

    let totalHeight = 0;
    for (let i = 0; i < this.sceneList.length; i++) {
      totalHeight += this.sceneList[i].scrollHeight;

      if (totalHeight >= this.currentYOffset) {
        this.currentScene = i;
        break;
      }
    }

    this.showStickyElement();

    if (this.currentYOffset === 0) {
      this.playAnimation();
    }
  }

  private showStickyElement(show = true): void {
    this.sceneList.forEach(({ selector }, index) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) {
        return;
      }

      const display = show ? (index === this.currentScene ? 'block' : 'none') : 'none';
      el.querySelectorAll<HTMLElement>('.sticky-element').forEach((el) => {
        el.style.display = display;
      });
      el.querySelectorAll<HTMLCanvasElement>('.sticky-canvas').forEach((el) => {
        const { width, height } = el;
        el.style.display = display;
        el.getContext('2d')?.clearRect(0, 0, width, height);
      });
      el.querySelectorAll<HTMLCanvasElement>('.blend-canvas').forEach((el) => {
        el.style.top = '0';
        el.style.marginTop = '0';
        el.classList.remove('sticky');
      });
    });
  }

  public playAnimation(): void {
    const { selector, animationList, scrollHeight } = this.sceneList[this.currentScene];
    const sectionEl = document.querySelector<HTMLElement>(selector);
    const scrollRatio = (this.currentYOffset - this.prevScrollHeight) / scrollHeight;
    animationList?.forEach(({ selector, videoImage, blendImage, opacity, ...transform }) => {
      const el = sectionEl?.querySelector<HTMLElement>(selector);
      if (!el) {
        return;
      }
      if (el instanceof HTMLCanvasElement) {
        if (videoImage) {
          const { imagePathList, ...animation } = videoImage;
          const findImageInfo = this.videoImageInfo.find(({ selector: _selector }) => {
            return _selector === selector;
          });
          if (findImageInfo) {
            const imageIndex = Math.round(this.ratioValue(animation, this.accYOffset - this.prevScrollHeight));
            const image = findImageInfo.imageList[imageIndex];
            if (imageIndex !== this.prevImageIndex && image) {
              el.getContext('2d')?.drawImage(image, 0, 0);
            }

            this.prevImageIndex = imageIndex;
          } else {
            this.loadVideoImagesInCurrentScene(
              selector,
              imagePathList,
              el,
              Math.round(this.ratioValue(animation, this.currentYOffset - this.prevScrollHeight)),
            );
          }
        }

        if (blendImage) {
          this.blendAnimation(selector, blendImage, scrollRatio, el);
        }

        this.loadVideoImagesInRestScene();
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

  private blendAnimation(
    selector: string,
    blendImage: AnimationBlendImage,
    scrollRatio: number,
    el: HTMLCanvasElement,
  ): void {
    const findImageInfo = this.blendImageInfo.find(({ selector: _selector }) => {
      return _selector === selector;
    });
    if (!findImageInfo) {
      return;
    }

    const { imageList } = findImageInfo;
    const { end: animationEnd, inAnimationType, inRatio, outAnimationType, outRatio } = blendImage;
    const sceneYOffset = this.currentYOffset - this.prevScrollHeight;
    const { scrollHeight } = this.sceneList[this.currentScene];
    const { offsetTop, width: canvasWidth, height: canvasHeight } = el;
    const fitRatio = this.canvasFitRatio(el);

    if (this.blendCanvasYPos === -1) {
      this.blendCanvasYPos = offsetTop;
    }

    el.getContext('2d')?.drawImage(imageList[0], 0, 0);
    const animationStart = this.blendCanvasYPos / scrollHeight;
    const diff = animationEnd - animationStart;
    const interval = outAnimationType ? diff / 2 : diff;

    if (inAnimationType) {
      const start = (this.blendCanvasYPos - window.innerHeight / 2) / scrollHeight;
      const end = animationStart;

      if (inAnimationType === BlendAnimation.CropSide) {
        const fitWidth = document.body.offsetWidth / fitRatio;
        const rectWidth = fitWidth * (inRatio || 0);
        const leftFrom = (canvasWidth - fitWidth) / 2;
        const rightFrom = leftFrom + fitWidth - rectWidth;
        el.getContext('2d')?.clearRect(
          this.ratioValue({ from: leftFrom, to: leftFrom - rectWidth, start, end }, sceneYOffset),
          0,
          rectWidth,
          canvasHeight,
        );
        el.getContext('2d')?.clearRect(
          this.ratioValue({ from: rightFrom, to: rightFrom + rectWidth, start, end }, sceneYOffset),
          0,
          rectWidth,
          canvasHeight,
        );
        el.style.transformOrigin = 'top';
        el.style.transform = `translateX(-50%) scale(${fitRatio})`;
      } else if (outAnimationType === BlendAnimation.Scale) {
        el.style.top = `-${(canvasHeight - canvasHeight * fitRatio) / 2}px`;
        el.style.transformOrigin = 'center';
        el.style.transform = `translateX(-50%) scale(${this.ratioValue(
          {
            from: el.getBoundingClientRect().width / el.width,
            to: fitRatio,
            start,
            end,
          },
          sceneYOffset,
        )})`;
      }
    } else {
      el.style.transformOrigin = 'top';
      el.style.transform = `translateX(-50%) scale(${fitRatio})`;
    }

    let nextAnimationStart = animationStart;
    if (scrollRatio < nextAnimationStart) {
      el.classList.remove('sticky');
    } else {
      el.classList.add('sticky');
      el.style.top = '0';
      el.style.marginTop = '0';
      const end = nextAnimationStart + interval;
      const blendHeight = this.ratioValue({ from: 0, to: canvasHeight, start: nextAnimationStart, end }, sceneYOffset);
      el.getContext('2d')?.drawImage(
        imageList[1],
        0,
        canvasHeight - blendHeight,
        canvasWidth,
        blendHeight,
        0,
        canvasHeight - blendHeight,
        canvasWidth,
        blendHeight,
      );
      nextAnimationStart = end;
    }

    if (scrollRatio > nextAnimationStart && outAnimationType) {
      const start = nextAnimationStart;
      const end = nextAnimationStart + interval;

      if (outAnimationType === BlendAnimation.CropSide) {
        const fitWidth = document.body.offsetWidth / fitRatio;
        const rectWidth = fitWidth * (outRatio || 0);
        const leftTo = (canvasWidth - fitWidth) / 2;
        const rightTo = leftTo + fitWidth - rectWidth;
        el.getContext('2d')?.clearRect(
          this.ratioValue({ from: leftTo - rectWidth, to: leftTo, start, end }, sceneYOffset),
          0,
          rectWidth,
          canvasHeight,
        );
        el.getContext('2d')?.clearRect(
          this.ratioValue({ from: rightTo + rectWidth, to: rightTo, start, end }, sceneYOffset),
          0,
          rectWidth,
          canvasHeight,
        );
      } else if (outAnimationType === BlendAnimation.Scale) {
        el.style.top = `-${(canvasHeight - canvasHeight * fitRatio) / 2}px`;
        el.style.transformOrigin = 'center';
        el.style.transform = `translateX(-50%) scale(${this.ratioValue(
          { from: fitRatio, to: outRatio || 1, start, end },
          sceneYOffset,
        )})`;
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
    const sceneYOffset = this.currentYOffset - this.prevScrollHeight;
    const oneAnimation = inAnimation || outAnimation;
    if (inAnimation && outAnimation) {
      if (scrollRatio <= (inAnimation.end + outAnimation.start) / 2) {
        return `${this.ratioValue(inAnimation, sceneYOffset)}`;
      } else {
        return `${this.ratioValue(outAnimation, sceneYOffset)}`;
      }
    } else if (oneAnimation) {
      return `${this.ratioValue(oneAnimation, sceneYOffset)}`;
    }

    return '';
  }

  private transformAnimation(
    { in: inAnimation, out: outAnimation }: AnimationInOut,
    scrollRatio: number,
    animationType: string,
  ): string {
    const sceneYOffset = this.currentYOffset - this.prevScrollHeight;
    const oneAnimation = inAnimation || outAnimation;
    if (inAnimation && outAnimation) {
      if (scrollRatio <= (inAnimation.end + outAnimation.start) / 2) {
        return `${this.transformValue(animationType, this.ratioValue(inAnimation, sceneYOffset), inAnimation.unit)}`;
      } else {
        return `${this.transformValue(animationType, this.ratioValue(outAnimation, sceneYOffset), outAnimation.unit)}`;
      }
    } else if (oneAnimation) {
      return `${this.transformValue(animationType, this.ratioValue(oneAnimation, sceneYOffset), oneAnimation.unit)}`;
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

  private ratioValue({ from, to, start, end }: Animation, sceneYOffset: number): number {
    const { scrollHeight } = this.sceneList[this.currentScene];
    const partStart = start * scrollHeight;
    const partEnd = end * scrollHeight;
    const partHeight = partEnd - partStart;

    if (sceneYOffset >= partStart && sceneYOffset <= partEnd) {
      return ((sceneYOffset - partStart) / partHeight) * (to - from) + from;
    } else if (sceneYOffset < partStart) {
      return from;
    }

    return to;
  }
}
