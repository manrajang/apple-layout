import { Animation, LocalScene } from '@/types/layoutType';

export function canvasFitRatio({ offsetWidth, offsetHeight }: HTMLCanvasElement): number {
  const widthRatio = window.innerWidth / offsetWidth;
  const heigthRaito = window.innerHeight / offsetHeight;
  return widthRatio <= heigthRaito ? heigthRaito : widthRatio;
}

export function showStickyElement(sceneList: LocalScene[], currentScene: number, show = true): void {
  sceneList.forEach(({ selector }, index) => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) {
      return;
    }

    const display = show ? (index === currentScene ? 'block' : 'none') : 'none';
    el.querySelectorAll<HTMLElement>('.sticky-element').forEach((el) => {
      el.style.display = display;
    });
    el.querySelectorAll<HTMLCanvasElement>('.sticky-canvas').forEach((el) => {
      const { width, height } = el;
      el.style.display = display;
      el.getContext('2d')?.clearRect(0, 0, width, height);
    });
    el.querySelectorAll<HTMLCanvasElement>('.blend-canvas').forEach((el) => {
      el.style.marginTop = '0';
      el.classList.remove('blend-canvas-sticky');
    });
  });
}

export function transformValue(style: string, value: number, unit?: string): string {
  if (style === 'rotateX' || style === 'rotateY' || style === 'rotateZ' || style === 'skewX' || style === 'skewY') {
    return `${style}(${value}${unit || 'deg'})`;
  } else if (style === 'translateX' || style === 'translateY' || style === 'translateZ') {
    return `${style}(${value}${unit || 'px'})`;
  }

  return `${style}(${value})`;
}

export function ratioValue({ from, to, start, end }: Animation, sceneYOffset: number, scrollHeight: number): number {
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
