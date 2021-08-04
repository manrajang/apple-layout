import {
  Animation,
  BlendAnimation,
  AnimationBlendImage,
  AnimationInOut,
  Scene,
  LocalScene,
  ImageInfo,
} from '@/types/layoutType';
import { canvasFitRatio, showStickyElement, transformValue, ratioValue } from '@/utils/layoutUtil';

export default class AppleLayout {
  private accYOffset = 0;
  private blendCanvasStaticTopList: { selector: string; position: number }[] = [];
  private blendImageInfoList: ImageInfo[] = [];
  private currentScene = 0;
  private currentYOffset = 0;
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

  get sceneYOffset(): number {
    return this.currentYOffset - this.prevScrollHeight;
  }

  get scrollRatio(): number {
    return (this.currentYOffset - this.prevScrollHeight) / this.sceneList[this.currentScene].scrollHeight;
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
    }

    if (this.currentYOffset < this.prevScrollHeight) {
      if (this.currentScene === 0) {
        return;
      }

      this.currentScene--;
      showStickyElement(this.sceneList, this.currentScene);
    }

    if (this.rafId === -1) {
      this.rafId = requestAnimationFrame(this.rafScroll.bind(this));
    }
  }

  private rafScroll(): void {
    // 가속도
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
      this.resetLayout(this.sceneList);
    }
  }

  private handleOrientationChange(): void {
    setTimeout(() => {
      scrollTo(0, 0);
      window.addEventListener('scroll', this.handleScrollTop);
    }, 500);
  }

  private handleBeforeUnload(): void {
    // 새로고침 할 때 씬의 처음부터 실행을 위해 포지션 이동
    const pos = this.currentYOffset > 0 ? this.prevScrollHeight + 5 : 0;
    scrollTo(0, pos);
    localStorage.setItem('scrollpos', `${pos}`);
  }

  private loadImagesInCurrentScene(imageInfoList: ImageInfo[], selector: string, imagePathList: string[]): void {
    const { length: imageCount } = imagePathList;
    if (imageCount === 0) {
      return;
    }

    const imageInfo = imageInfoList.find(({ selector: _selector }) => {
      return _selector === selector;
    });
    if (!imageInfo) {
      let count = 0;
      const imageInfo = {
        selector,
        load: false,
        imageList: imagePathList.map((path) => {
          const image = new Image();
          image.src = path;
          image.onload = () => {
            count++;
            imageInfo.load = count === imageCount;

            // 이미지 다 로드되면 애니메이션 실행
            if (count === imageCount) {
              this.playAnimation();
            }
          };
          return image;
        }),
      };
      imageInfoList.push(imageInfo);
    }
  }

  private loadImagesInRestScene(): void {
    this.sceneList.forEach(({ animationList }) => {
      animationList?.forEach(({ selector, videoImage, blendImage }) => {
        if (videoImage) {
          this.loadImagesInCurrentScene(this.videoImageInfoList, selector, videoImage.imagePathList);
        }

        if (blendImage) {
          this.loadImagesInCurrentScene(this.blendImageInfoList, selector, blendImage.imagePathList);
        }
      });
    });
  }

  public resetLayout(sceneList: Scene[]): void {
    const scrollPos = localStorage.getItem('scrollpos');
    this.blendCanvasStaticTopList = [];
    this.currentYOffset = scrollPos ? parseInt(scrollPos, 10) : window.pageYOffset;
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

    let totalScrollHeight = 0;
    for (let i = 0; i < this.sceneList.length; i++) {
      totalScrollHeight += this.sceneList[i].scrollHeight;

      if (totalScrollHeight >= this.currentYOffset) {
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

        const { style: canvasStyle } = el;

        if (videoImage) {
          // fixed 이미지 중앙에 표시
          canvasStyle.left = '50%';
          canvasStyle.top = '50%';
          canvasStyle.transform = `translate3d(-50%, -50%, 0) scale(${window.innerHeight / el.height})`;
        }

        if (blendImage) {
          // fixed 되기 전에 blend canvas의 top 위치 필요
          this.blendCanvasStaticTopList.push({ selector, position: el.offsetTop });
        }

        // 현재 씬 위치의 이미지 먼저 로드
        if (index === this.currentScene) {
          if (videoImage) {
            this.loadImagesInCurrentScene(this.videoImageInfoList, selector, videoImage.imagePathList);
          }

          if (blendImage) {
            this.loadImagesInCurrentScene(this.blendImageInfoList, selector, blendImage.imagePathList);
          }
        }
      });
    });

    this.loadImagesInRestScene();
    showStickyElement(this.sceneList, this.currentScene);

    if (this.currentYOffset === 0) {
      this.playAnimation();
    }
  }

  public playAnimation(): void {
    this.sceneList[this.currentScene].animationList?.forEach(
      ({ selector, videoImage, blendImage, opacity, ...transform }) => {
        const el = document.querySelector<HTMLElement>(selector);
        if (!el) {
          return;
        }

        if (el instanceof HTMLCanvasElement) {
          if (videoImage) {
            const imageInfo = this.videoImageInfoList.find(({ selector: _selector }) => {
              return _selector === selector;
            });
            if (imageInfo?.load) {
              this.videoAnimation(videoImage, imageInfo.imageList, el);
            }
          }

          if (blendImage) {
            const imageInfo = this.blendImageInfoList.find(({ selector: _selector }) => {
              return _selector === selector;
            });
            const staticTop = this.blendCanvasStaticTopList.find(({ selector: _selector }) => {
              return _selector === selector;
            });
            if (imageInfo?.load && staticTop) {
              this.blendAnimation(blendImage, imageInfo.imageList, el, staticTop.position);
            }
          }
        }

        const { style: elStyle } = el;

        if (opacity) {
          elStyle.opacity = this.opacityAnimation(opacity);
        }

        const transformList = Object.keys(transform);
        if (transformList.length) {
          elStyle.transform = transformList
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
      },
    );
  }

  private videoAnimation(animation: Animation, imageList: HTMLImageElement[], el: HTMLCanvasElement): void {
    const image =
      imageList[
        Math.round(
          ratioValue(
            animation,
            this.accYOffset - this.prevScrollHeight,
            this.sceneList[this.currentScene].scrollHeight,
          ),
        )
      ];
    if (image) {
      const { width: canvasWidth, height: canvasHeight } = el;
      el.getContext('2d')?.drawImage(image, 0, 0, canvasWidth, canvasHeight);
    }
  }

  private setBlendCanvasStyle(
    { end: animationEndRatio, outAnimationType }: AnimationBlendImage,
    el: HTMLCanvasElement,
    canvasStaticOffsetTop: number,
  ): void {
    if (el.parentElement) {
      const { scrollHeight } = this.sceneList[this.currentScene];
      const {
        style: canvasStyle,
        parentElement: { style: parentElStyle },
        offsetHeight: canvasOffsetHeight,
      } = el;
      const animationStartRatio = canvasStaticOffsetTop / scrollHeight;
      const fitTop = (canvasOffsetHeight * canvasFitRatio(el) - canvasOffsetHeight) / 2;
      canvasStyle.top = `${fitTop}px`;
      canvasStyle.marginTop = '0';
      parentElStyle.height = `${
        scrollHeight * (animationEndRatio - animationStartRatio) +
        (outAnimationType === BlendAnimation.Scale ? 0 : fitTop)
      }px`;
    }
  }

  private blendInAnimaiton(
    { inAnimationType, inRatio }: AnimationBlendImage,
    el: HTMLCanvasElement,
    start: number,
    end: number,
  ): void {
    const { scrollHeight } = this.sceneList[this.currentScene];
    const {
      style: canvasStyle,
      classList: canvasClassList,
      offsetWidth: canvasOffsetWidth,
      width: canvasWidth,
      height: canvasHeight,
    } = el;
    const fitRatio = canvasFitRatio(el);
    canvasClassList.remove('blend-canvas-sticky');

    if (inAnimationType === BlendAnimation.CropSide) {
      const fitDocumentWidth = document.body.offsetWidth / fitRatio;
      // 돔 너비가 아닌 실제 캔버스 너비를 재계산. 실제 캔버스 크기 + (도큐먼트 너비 - 돔 너비) * (캔버스 너비와 돔 너비의 비율)
      const fitWidth = canvasWidth + (fitDocumentWidth - canvasOffsetWidth) * (canvasWidth / canvasOffsetWidth);
      const rectWidth = fitWidth * (inRatio || 0);
      const leftFrom = (canvasWidth - fitWidth) / 2;
      const rightFrom = leftFrom + fitWidth - rectWidth;
      canvasStyle.transform = `translateX(-50%) scale(${fitRatio})`;
      el.getContext('2d')?.clearRect(
        ratioValue({ from: leftFrom, to: leftFrom - rectWidth, start, end }, this.sceneYOffset, scrollHeight),
        0,
        rectWidth,
        canvasHeight,
      );
      el.getContext('2d')?.clearRect(
        ratioValue({ from: rightFrom, to: rightFrom + rectWidth, start, end }, this.sceneYOffset, scrollHeight),
        0,
        rectWidth,
        canvasHeight,
      );
    } else if (inAnimationType === BlendAnimation.Scale) {
      // 들어올 때 애니메이션이 스케일일 경우 1에서 핏에 맞는 스케일로 증가
      canvasStyle.transform = `translateX(-50%) scale(${ratioValue(
        { from: 1, to: fitRatio, start, end },
        this.sceneYOffset,
        scrollHeight,
      )})`;
    }
  }

  private blendOutAnimaiton(
    { outAnimationType, outRatio }: AnimationBlendImage,
    el: HTMLCanvasElement,
    start: number,
    end: number,
  ): void {
    const { scrollHeight } = this.sceneList[this.currentScene];
    const { style: canvasStyle, offsetWidth: canvasOffsetWidth, width: canvasWidth, height: canvasHeight } = el;
    const fitRatio = canvasFitRatio(el);

    if (outAnimationType === BlendAnimation.CropSide) {
      const fitDocumentWidth = document.body.offsetWidth / fitRatio;
      // 돔 너비가 아닌 실제 캔버스 너비를 재계산. 실제 캔버스 크기 + (도큐먼트 너비 - 돔 너비) * (캔버스 너비와 돔 너비의 비율)
      const fitWidth = canvasWidth + (fitDocumentWidth - canvasOffsetWidth) * (canvasWidth / canvasOffsetWidth);
      const rectWidth = fitWidth * (outRatio || 0);
      const leftTo = (canvasWidth - fitWidth) / 2;
      const rightTo = leftTo + fitWidth - rectWidth;
      el.getContext('2d')?.clearRect(
        ratioValue({ from: leftTo - rectWidth, to: leftTo, start, end }, this.sceneYOffset, scrollHeight),
        0,
        rectWidth,
        canvasHeight,
      );
      el.getContext('2d')?.clearRect(
        ratioValue({ from: rightTo + rectWidth, to: rightTo, start, end }, this.sceneYOffset, scrollHeight),
        0,
        rectWidth,
        canvasHeight,
      );
    } else if (outAnimationType === BlendAnimation.Scale) {
      canvasStyle.transform = `translateX(-50%) scale(${ratioValue(
        { from: fitRatio, to: 1, start, end },
        this.sceneYOffset,
        scrollHeight,
      )})`;
    }
  }

  private preRenderBlendImage(sceneIndex: number): void {
    const scene = this.sceneList[sceneIndex];
    if (!scene) {
      return;
    }

    scene.animationList?.forEach(({ selector, blendImage }) => {
      if (!blendImage) {
        return;
      }

      const imageInfo = this.blendImageInfoList.find(({ selector: _selector }) => {
        return _selector === selector;
      });
      if (!imageInfo) {
        return;
      }

      const staticTop = this.blendCanvasStaticTopList.find(({ selector: _selector }) => {
        return _selector === selector;
      });
      if (!staticTop) {
        return;
      }

      const el = document.querySelector<HTMLCanvasElement>(selector);
      if (!el) {
        return;
      }

      const { position: canvasStaticOffsetTop } = staticTop;
      const { style: canvasStyle, width: canvasWidth, height: canvasHeight } = el;
      const { scrollHeight } = this.sceneList[this.currentScene];

      el.getContext('2d')?.drawImage(imageInfo.imageList[0], 0, 0, canvasWidth, canvasHeight);
      this.setBlendCanvasStyle(blendImage, el, canvasStaticOffsetTop);

      if (blendImage.inAnimationType) {
        this.blendInAnimaiton(
          blendImage,
          el,
          (scrollHeight + (canvasStaticOffsetTop - window.innerHeight / 2)) / scrollHeight,
          (scrollHeight + canvasStaticOffsetTop) / scrollHeight,
        );
      } else {
        canvasStyle.transform = `translateX(-50%) scale(${canvasFitRatio(el)})`;
      }
    });
  }

  private blendAnimation(
    animation: AnimationBlendImage,
    imageList: HTMLImageElement[],
    el: HTMLCanvasElement,
    canvasStaticOffsetTop: number,
  ): void {
    const { end: animationEndRatio, inAnimationType, outAnimationType } = animation;
    const { scrollHeight } = this.sceneList[this.currentScene];
    const {
      style: canvasStyle,
      classList: canvasClassList,
      offsetHeight: canvasOffsetHeight,
      width: canvasWidth,
      height: canvasHeight,
    } = el;
    const fitRatio = canvasFitRatio(el);
    const canvasRatio = ((canvasOffsetHeight * fitRatio - canvasOffsetHeight) / 2 + canvasOffsetHeight) / scrollHeight;
    const animationStartRatio = canvasStaticOffsetTop / scrollHeight;
    const animationDiffRatio = animationEndRatio - animationStartRatio;
    const intervalRatio = outAnimationType ? (animationDiffRatio - canvasRatio) / 2 : animationDiffRatio - canvasRatio;
    el.getContext('2d')?.drawImage(imageList[0], 0, 0, canvasWidth, canvasHeight);
    this.setBlendCanvasStyle(animation, el, canvasStaticOffsetTop);

    if (inAnimationType) {
      this.blendInAnimaiton(
        animation,
        el,
        (canvasStaticOffsetTop - window.innerHeight / 2) / scrollHeight,
        animationStartRatio,
      );
    } else {
      canvasStyle.transform = `translateX(-50%) scale(${fitRatio})`;
    }

    let nextAnimationStartRatio = animationStartRatio;
    if (this.scrollRatio < nextAnimationStartRatio) {
      canvasClassList.remove('blend-canvas-sticky');
    } else {
      const end = nextAnimationStartRatio + intervalRatio;
      const image = imageList[1];
      const { width: imageWidth, height: imageHeight } = image;
      const blendSourceHeight = ratioValue(
        { from: 0, to: imageHeight, start: nextAnimationStartRatio, end },
        this.sceneYOffset,
        scrollHeight,
      );
      const blendDrawHeight = ratioValue(
        { from: 0, to: canvasHeight, start: nextAnimationStartRatio, end },
        this.sceneYOffset,
        scrollHeight,
      );
      canvasClassList.add('blend-canvas-sticky');
      el.getContext('2d')?.drawImage(
        image,
        0,
        imageHeight - blendSourceHeight,
        imageWidth,
        blendSourceHeight,
        0,
        canvasHeight - blendDrawHeight,
        canvasWidth,
        blendDrawHeight,
      );

      nextAnimationStartRatio = end;
    }

    if (outAnimationType && this.scrollRatio > nextAnimationStartRatio) {
      const end = nextAnimationStartRatio + intervalRatio;
      this.blendOutAnimaiton(animation, el, nextAnimationStartRatio, end);
      nextAnimationStartRatio = end;
    }

    if (0 < nextAnimationStartRatio && this.scrollRatio > nextAnimationStartRatio) {
      canvasClassList.remove('blend-canvas-sticky');
      canvasStyle.top = `0`;
      canvasStyle.marginTop = `${scrollHeight * animationDiffRatio - canvasOffsetHeight}px`;
    }
  }

  private opacityAnimation({ in: inAnimation, out: outAnimation }: AnimationInOut): string {
    const { scrollHeight } = this.sceneList[this.currentScene];
    const animation = inAnimation || outAnimation;
    if (inAnimation && outAnimation) {
      if (this.scrollRatio <= (inAnimation.end + outAnimation.start) / 2) {
        return `${ratioValue(inAnimation, this.sceneYOffset, scrollHeight)}`;
      } else {
        return `${ratioValue(outAnimation, this.sceneYOffset, scrollHeight)}`;
      }
    } else if (animation) {
      return `${ratioValue(animation, this.sceneYOffset, scrollHeight)}`;
    }

    return '';
  }

  private transformAnimation({ in: inAnimation, out: outAnimation }: AnimationInOut, animationType: string): string {
    const { scrollHeight } = this.sceneList[this.currentScene];
    const animation = inAnimation || outAnimation;
    if (inAnimation && outAnimation) {
      if (this.scrollRatio <= (inAnimation.end + outAnimation.start) / 2) {
        return `${transformValue(
          animationType,
          ratioValue(inAnimation, this.sceneYOffset, scrollHeight),
          inAnimation.unit,
        )}`;
      } else {
        return `${transformValue(
          animationType,
          ratioValue(outAnimation, this.sceneYOffset, scrollHeight),
          outAnimation.unit,
        )}`;
      }
    } else if (animation) {
      return `${transformValue(animationType, ratioValue(animation, this.sceneYOffset, scrollHeight), animation.unit)}`;
    }

    return '';
  }
}
