import {
  Animation,
  BlendAnimation,
  AnimationBlendImage,
  AnimationInOut,
  Scene,
  LocalScene,
  ImageInfo,
} from '@/types/layoutType';
import { drawCircle, canvasFitRatio, showStickyElement, transformValue, ratioValue } from '@/utils/layoutUtil';

export default class AppleLayout {
  private accYOffset = 0;
  private blendCanvasYPos = -1;
  private blendImageInfoList: ImageInfo[] = [];
  private currentScene = 0;
  private currentYOffset = 0;
  private prevImageIndex = -1;
  private prevScene = 0;
  private rafId = -1;
  private sceneList: LocalScene[] = [];
  private videoImageInfoList: ImageInfo[] = [];
  private windowWidth = 0;

  constructor(public container: HTMLDivElement, sceneList: Scene[]) {
    this.sceneList = sceneList.map((scene) => {
      return { ...scene, scrollHeight: 0 };
    });

    this.handleScroll = this.handleScroll.bind(this);
    this.handleScrollTop = this.handleScrollTop.bind(this);
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

  get prevScrollHeight(): number {
    let prevScrollHeight = 0;
    for (let i = 0; i < this.currentScene; i++) {
      prevScrollHeight += this.sceneList[i].scrollHeight;
    }

    return prevScrollHeight;
  }

  private handleScroll(): void {
    this.prevScene = this.currentScene;
    this.currentYOffset = window.pageYOffset;

    const currentScrollHeight = this.prevScrollHeight + this.sceneList[this.currentScene].scrollHeight;
    if (this.currentYOffset > currentScrollHeight - window.innerHeight) {
      this.preRenderBlendImage(this.currentScene + 1);
    }

    if (this.currentYOffset > currentScrollHeight) {
      if (this.currentScene < this.sceneList.length - 1) {
        this.currentScene++;
        showStickyElement(this.sceneList, this.currentScene);
      } else {
        showStickyElement(this.sceneList, this.currentScene, false);
      }

      this.blendCanvasYPos = -1;
      this.prevImageIndex = -1;
    }

    if (this.currentYOffset < this.prevScrollHeight) {
      if (this.currentScene === 0) {
        return;
      }

      this.currentScene--;
      this.blendCanvasYPos = -1;
      this.prevImageIndex = -1;
      showStickyElement(this.sceneList, this.currentScene);
    }

    if (this.rafId === -1) {
      this.rafId = requestAnimationFrame(this.rafScroll.bind(this));
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

  private handleScrollTop(): void {
    this.resetLayout(this.sceneList);
  }

  private handleResize(): void {
    if (this.windowWidth !== window.innerWidth) {
      scrollTo(0, 0);
      window.addEventListener('scroll', this.handleScrollTop, { once: true });
    }
  }

  private handleOrientationChange(): void {
    setTimeout(() => {
      scrollTo(0, 0);
      window.addEventListener('scroll', this.handleScrollTop);
    }, 500);
  }

  private handleBeforeUnload(): void {
    if (this.currentYOffset > 0) {
      scrollTo(0, this.prevScrollHeight + 5);
    } else {
      scrollTo(0, 0);
    }
  }

  private loadImagesInCurrentScene(
    imageInfoList: ImageInfo[],
    selector: string,
    imagePathList: string[],
    el: HTMLCanvasElement,
  ): void {
    const { length: imageCount } = imagePathList;
    if (imageCount === 0) {
      return;
    }

    const findImageInfo = imageInfoList.find(({ selector: _selector }) => {
      return _selector === selector;
    });
    if (!findImageInfo) {
      let count = 0;
      let progress = 0;
      let rafLoadingId = -1;
      const loading = () => {
        el.getContext('2d')?.clearRect(0, 0, el.width, el.height);

        progress += 0.02;
        if (progress > 1) {
          progress = 0;
        }

        drawCircle(el, progress);
        rafLoadingId = requestAnimationFrame(loading);

        if (count === imageCount) {
          cancelAnimationFrame(rafLoadingId);
          this.playAnimation();
        }
      };
      const imageInfo = {
        selector,
        load: false,
        imageList: imagePathList.map((path) => {
          const image = new Image();
          image.src = path;
          image.onload = () => {
            count++;
            imageInfo.load = count === imageCount;
          };
          return image;
        }),
      };
      imageInfoList.push(imageInfo);
      loading();
    }
  }

  private loadImagesInRestScene(): void {
    this.sceneList.forEach(({ selector, animationList }) => {
      const sectionEl = document.querySelector<HTMLElement>(selector);
      animationList?.forEach(({ selector, videoImage, blendImage }) => {
        const el = sectionEl?.querySelector<HTMLCanvasElement>(selector);
        if (!el) {
          return;
        }

        if (videoImage) {
          this.loadImagesInCurrentScene(this.videoImageInfoList, selector, videoImage.imagePathList, el);
        }

        if (blendImage) {
          this.loadImagesInCurrentScene(this.blendImageInfoList, selector, blendImage.imagePathList, el);
        }
      });
    });
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

    let totalHeight = 0;
    for (let i = 0; i < this.sceneList.length; i++) {
      totalHeight += this.sceneList[i].scrollHeight;

      if (totalHeight >= this.currentYOffset) {
        this.currentScene = i;
        break;
      }
    }

    this.sceneList.forEach(({ type, selector, scrollHeight, animationList }, index) => {
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
          el.style.left = '50%';
          el.style.top = '50%';
          el.style.transform = `translate3d(-50%, -50%, 0) scale(${window.innerHeight / videoImage.imageHeight})`;
        }

        if (index === this.currentScene) {
          if (videoImage) {
            this.loadImagesInCurrentScene(this.videoImageInfoList, selector, videoImage.imagePathList, el);
          }

          if (blendImage) {
            this.loadImagesInCurrentScene(this.blendImageInfoList, selector, blendImage.imagePathList, el);
          }
        }
      });

      this.loadImagesInRestScene();
    });

    showStickyElement(this.sceneList, this.currentScene);

    if (this.currentYOffset === 0) {
      this.playAnimation();
    }
  }

  public playAnimation(): void {
    const { selector, animationList } = this.sceneList[this.currentScene];
    const sectionEl = document.querySelector<HTMLElement>(selector);
    animationList?.forEach(({ selector, videoImage, blendImage, opacity, ...transform }) => {
      const el = sectionEl?.querySelector<HTMLElement>(selector);
      if (!el) {
        return;
      }

      if (el instanceof HTMLCanvasElement) {
        if (videoImage) {
          const findImageInfo = this.videoImageInfoList.find(({ selector: _selector }) => {
            return _selector === selector;
          });
          if (findImageInfo && findImageInfo.load) {
            this.videoAnimation(videoImage, findImageInfo.imageList, el);
          }
        }

        if (blendImage) {
          const findImageInfo = this.blendImageInfoList.find(({ selector: _selector }) => {
            return _selector === selector;
          });
          if (findImageInfo && findImageInfo.load) {
            this.blendAnimation(blendImage, findImageInfo.imageList, el);
          }
        }
      }

      if (opacity) {
        el.style.opacity = this.opacityAnimation(opacity);
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
                acc.push(this.transformAnimation(transformValue, key));
              }
            }

            return acc;
          }, [])
          .join(' ');
      }
    });
  }

  private videoAnimation(animation: Animation, imageList: HTMLImageElement[], el: HTMLCanvasElement): void {
    const imageIndex = Math.round(
      ratioValue(animation, this.accYOffset - this.prevScrollHeight, this.sceneList[this.currentScene].scrollHeight),
    );
    const image = imageList[imageIndex];
    if (image && image.complete) {
      if (imageIndex !== this.prevImageIndex) {
        el.getContext('2d')?.drawImage(image, 0, 0);
      }
    }

    this.prevImageIndex = imageIndex;
  }

  private preBlendAnimaiton(
    { inAnimationType, inRatio }: AnimationBlendImage,
    el: HTMLCanvasElement,
    start: number,
    end: number,
  ): void {
    const sceneYOffset = this.currentYOffset - this.prevScrollHeight;
    const { scrollHeight } = this.sceneList[this.currentScene];
    const { width: canvasWidth, height: canvasHeight } = el;
    const fitRatio = canvasFitRatio(el);

    if (inAnimationType === BlendAnimation.CropSide) {
      const fitWidth = document.body.offsetWidth / fitRatio;
      const rectWidth = fitWidth * (inRatio || 0);
      const leftFrom = (canvasWidth - fitWidth) / 2;
      const rightFrom = leftFrom + fitWidth - rectWidth;
      el.style.transformOrigin = 'top';
      el.style.transform = `translateX(-50%) scale(${fitRatio})`;
      el.getContext('2d')?.clearRect(
        ratioValue({ from: leftFrom, to: leftFrom - rectWidth, start, end }, sceneYOffset, scrollHeight),
        0,
        rectWidth,
        canvasHeight,
      );
      el.getContext('2d')?.clearRect(
        ratioValue({ from: rightFrom, to: rightFrom + rectWidth, start, end }, sceneYOffset, scrollHeight),
        0,
        rectWidth,
        canvasHeight,
      );
    } else if (inAnimationType === BlendAnimation.Scale) {
      el.style.top = `-${(canvasHeight - canvasHeight * fitRatio) / 2}px`;
      el.style.transformOrigin = 'center';
      el.style.transform = `translateX(-50%) scale(${ratioValue(
        {
          from: el.getBoundingClientRect().width / el.width,
          to: fitRatio,
          start,
          end,
        },
        sceneYOffset,
        scrollHeight,
      )})`;
    }
  }

  private preRenderBlendImage(sceneIndex: number): void {
    const scene = this.sceneList[sceneIndex];
    if (!scene) {
      return;
    }

    const { selector, animationList } = scene;
    const sectionEl = document.querySelector<HTMLElement>(selector);
    if (!sectionEl) {
      return;
    }

    animationList?.forEach(({ selector, blendImage }) => {
      if (!blendImage) {
        return;
      }

      const findImageInfo = this.blendImageInfoList.find(({ selector: _selector }) => {
        return _selector === selector;
      });
      if (!findImageInfo) {
        return;
      }

      const el = sectionEl.querySelector<HTMLCanvasElement>(selector);
      if (!el) {
        return;
      }

      const { scrollHeight } = this.sceneList[this.currentScene];
      const { offsetTop } = el;
      el.getContext('2d')?.drawImage(findImageInfo.imageList[0], 0, 0);

      if (blendImage.inAnimationType) {
        this.preBlendAnimaiton(
          blendImage,
          el,
          (scrollHeight + (offsetTop - window.innerHeight / 2)) / scrollHeight,
          (scrollHeight + offsetTop) / scrollHeight,
        );
      }
    });
  }

  private blendAnimation(animation: AnimationBlendImage, imageList: HTMLImageElement[], el: HTMLCanvasElement): void {
    const { end: animationEnd, inAnimationType, outAnimationType, outRatio } = animation;
    const sceneYOffset = this.currentYOffset - this.prevScrollHeight;
    const { scrollHeight } = this.sceneList[this.currentScene];
    const scrollRatio = sceneYOffset / scrollHeight;
    const { offsetTop, width: canvasWidth, height: canvasHeight } = el;
    const fitRatio = canvasFitRatio(el);

    if (this.blendCanvasYPos === -1) {
      this.blendCanvasYPos = offsetTop;
    }

    const animationStart = this.blendCanvasYPos / scrollHeight;
    const diff = animationEnd - animationStart;
    const interval = outAnimationType ? diff / 2 : diff;
    el.getContext('2d')?.drawImage(imageList[0], 0, 0);

    if (inAnimationType) {
      this.preBlendAnimaiton(
        animation,
        el,
        (this.blendCanvasYPos - window.innerHeight / 2) / scrollHeight,
        animationStart,
      );
    } else {
      el.style.transformOrigin = 'top';
      el.style.transform = `translateX(-50%) scale(${fitRatio})`;
    }

    let nextAnimationStart = animationStart;
    if (scrollRatio < nextAnimationStart) {
      el.classList.remove('sticky');
    } else {
      const end = nextAnimationStart + interval;
      const blendHeight = ratioValue(
        { from: 0, to: canvasHeight, start: nextAnimationStart, end },
        sceneYOffset,
        scrollHeight,
      );
      el.classList.add('sticky');
      el.style.top = '0';
      el.style.marginTop = '0';
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
          ratioValue({ from: leftTo - rectWidth, to: leftTo, start, end }, sceneYOffset, scrollHeight),
          0,
          rectWidth,
          canvasHeight,
        );
        el.getContext('2d')?.clearRect(
          ratioValue({ from: rightTo + rectWidth, to: rightTo, start, end }, sceneYOffset, scrollHeight),
          0,
          rectWidth,
          canvasHeight,
        );
      } else if (outAnimationType === BlendAnimation.Scale) {
        el.style.top = `-${(canvasHeight - canvasHeight * fitRatio) / 2}px`;
        el.style.transformOrigin = 'center';
        el.style.transform = `translateX(-50%) scale(${ratioValue(
          { from: fitRatio, to: outRatio || 1, start, end },
          sceneYOffset,
          scrollHeight,
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

  private opacityAnimation({ in: inAnimation, out: outAnimation }: AnimationInOut): string {
    const sceneYOffset = this.currentYOffset - this.prevScrollHeight;
    const { scrollHeight } = this.sceneList[this.currentScene];
    const scrollRatio = sceneYOffset / scrollHeight;
    const oneAnimation = inAnimation || outAnimation;
    if (inAnimation && outAnimation) {
      if (scrollRatio <= (inAnimation.end + outAnimation.start) / 2) {
        return `${ratioValue(inAnimation, sceneYOffset, scrollHeight)}`;
      } else {
        return `${ratioValue(outAnimation, sceneYOffset, scrollHeight)}`;
      }
    } else if (oneAnimation) {
      return `${ratioValue(oneAnimation, sceneYOffset, scrollHeight)}`;
    }

    return '';
  }

  private transformAnimation({ in: inAnimation, out: outAnimation }: AnimationInOut, animationType: string): string {
    const sceneYOffset = this.currentYOffset - this.prevScrollHeight;
    const { scrollHeight } = this.sceneList[this.currentScene];
    const scrollRatio = sceneYOffset / scrollHeight;
    const oneAnimation = inAnimation || outAnimation;
    if (inAnimation && outAnimation) {
      if (scrollRatio <= (inAnimation.end + outAnimation.start) / 2) {
        return `${transformValue(
          animationType,
          ratioValue(inAnimation, sceneYOffset, scrollHeight),
          inAnimation.unit,
        )}`;
      } else {
        return `${transformValue(
          animationType,
          ratioValue(outAnimation, sceneYOffset, scrollHeight),
          outAnimation.unit,
        )}`;
      }
    } else if (oneAnimation) {
      return `${transformValue(
        animationType,
        ratioValue(oneAnimation, sceneYOffset, scrollHeight),
        oneAnimation.unit,
      )}`;
    }

    return '';
  }
}
