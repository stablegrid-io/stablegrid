'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

type SequencePerformanceMode = 'full' | 'balanced';

interface TransmissionLineSequenceBackgroundProps {
  progress: number;
  reducedMotion: boolean;
  performanceMode?: SequencePerformanceMode;
  frameOverride?: number | null;
  minimumFrame?: number;
}

interface SequenceConfig {
  basePath: string;
  frameCount: number;
  fileExtension: 'jpg' | 'png' | 'webp';
  zeroPad: number;
  reducedMotionFrame: number;
  scrollResponse: number;
  assetVersion?: string;
}

interface DrawState {
  frame: number;
  width: number;
  height: number;
}

export const TRANSMISSION_LINE_SEQUENCE_CONFIG: SequenceConfig = {
  basePath: '/transmission_line',
  frameCount: 80,
  fileExtension: 'jpg',
  zeroPad: 5,
  reducedMotionFrame: 40,
  scrollResponse: 1.32,
  assetVersion: '20260310-tower-line-80'
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const FRAME_CROP_LEFT_RATIO = 0.01;
const FRAME_CROP_TOP_RATIO = 0.01;
const FRAME_CROP_RIGHT_RATIO = 0.08;
const FRAME_CROP_BOTTOM_RATIO = 0.08;

const formatFramePath = (frame: number) => {
  const { basePath, fileExtension, zeroPad, assetVersion } =
    TRANSMISSION_LINE_SEQUENCE_CONFIG;
  const filePath = `${basePath}/${String(frame).padStart(zeroPad, '0')}.${fileExtension}`;
  if (!assetVersion) {
    return filePath;
  }
  return `${filePath}?v=${assetVersion}`;
};

const toFrameIndex = (progress: number) => {
  const normalized = clamp(progress, 0, 1);
  const responsiveProgress = clamp(
    normalized * TRANSMISSION_LINE_SEQUENCE_CONFIG.scrollResponse,
    0,
    1
  );
  const maxIndex = TRANSMISSION_LINE_SEQUENCE_CONFIG.frameCount - 1;
  // Use round for slightly denser perceived motion under scroll.
  return Math.round(responsiveProgress * maxIndex) + 1;
};

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
) => {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  if (imageWidth <= 0 || imageHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    return;
  }

  // Slight source crop keeps composition but trims the lower-right watermark edge.
  const sourceX = imageWidth * FRAME_CROP_LEFT_RATIO;
  const sourceY = imageHeight * FRAME_CROP_TOP_RATIO;
  const sourceWidth = imageWidth * (1 - FRAME_CROP_LEFT_RATIO - FRAME_CROP_RIGHT_RATIO);
  const sourceHeight = imageHeight * (1 - FRAME_CROP_TOP_RATIO - FRAME_CROP_BOTTOM_RATIO);
  if (sourceWidth <= 1 || sourceHeight <= 1) {
    return;
  }

  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = (targetWidth - drawWidth) * 0.5;
  const drawY = (targetHeight - drawHeight) * 0.5;

  context.clearRect(0, 0, targetWidth, targetHeight);
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight);
};

const getPreloadNearWindow = (performanceMode: SequencePerformanceMode) =>
  performanceMode === 'balanced' ? 6 : 12;

const getPreloadBatchSize = (performanceMode: SequencePerformanceMode) =>
  performanceMode === 'balanced' ? 4 : 8;

const getDevicePixelRatioCap = (performanceMode: SequencePerformanceMode) =>
  performanceMode === 'balanced' ? 1.75 : 2.5;

export function TransmissionLineSequenceBackground({
  progress,
  reducedMotion,
  performanceMode = 'full',
  frameOverride = null,
  minimumFrame
}: TransmissionLineSequenceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const imageCacheRef = useRef(new Map<number, HTMLImageElement>());
  const inflightLoadRef = useRef(new Map<number, Promise<HTMLImageElement | null>>());
  const pendingBackgroundFramesRef = useRef<number[]>([]);
  const idleHandleRef = useRef<number | null>(null);
  const drawRafRef = useRef<number | null>(null);
  const lastDrawStateRef = useRef<DrawState | null>(null);
  const lastSuccessfulFrameRef = useRef(1);
  const targetFrameRef = useRef(1);

  const targetFrame = useMemo(() => {
    const frameCount = TRANSMISSION_LINE_SEQUENCE_CONFIG.frameCount;

    if (typeof frameOverride === 'number') {
      return clamp(Math.round(frameOverride), 1, frameCount);
    }

    if (reducedMotion) {
      return TRANSMISSION_LINE_SEQUENCE_CONFIG.reducedMotionFrame;
    }

    const progressFrame = toFrameIndex(progress);
    if (typeof minimumFrame === 'number') {
      const clampedMinimum = clamp(Math.round(minimumFrame), 1, frameCount);
      return Math.max(progressFrame, clampedMinimum);
    }

    return progressFrame;
  }, [frameOverride, minimumFrame, progress, reducedMotion]);

  const clearIdlePreload = useCallback(() => {
    if (idleHandleRef.current === null || typeof window === 'undefined') {
      return;
    }

    if (
      typeof window.cancelIdleCallback === 'function' &&
      typeof window.requestIdleCallback === 'function'
    ) {
      window.cancelIdleCallback(idleHandleRef.current);
    } else {
      window.clearTimeout(idleHandleRef.current);
    }
    idleHandleRef.current = null;
  }, []);

  const loadFrame = useCallback((frameIndex: number) => {
    if (frameIndex < 1 || frameIndex > TRANSMISSION_LINE_SEQUENCE_CONFIG.frameCount) {
      return Promise.resolve<HTMLImageElement | null>(null);
    }

    const cachedImage = imageCacheRef.current.get(frameIndex);
    if (cachedImage) {
      return Promise.resolve(cachedImage);
    }

    const inflight = inflightLoadRef.current.get(frameIndex);
    if (inflight) {
      return inflight;
    }

    const framePath = formatFramePath(frameIndex);
    const loadPromise = new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.decoding = 'async';

      const complete = () => {
        imageCacheRef.current.set(frameIndex, image);
        inflightLoadRef.current.delete(frameIndex);
        resolve(image);
      };

      image.onload = () => {
        if (typeof image.decode === 'function') {
          image.decode().then(complete).catch(complete);
          return;
        }
        complete();
      };

      image.onerror = () => {
        inflightLoadRef.current.delete(frameIndex);
        resolve(null);
      };

      image.src = framePath;
    });

    inflightLoadRef.current.set(frameIndex, loadPromise);
    return loadPromise;
  }, []);

  const drawFrame = useCallback(
    (requestedFrame: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      if (!contextRef.current) {
        contextRef.current = canvas.getContext('2d', { alpha: false, desynchronized: true });
      }
      const context = contextRef.current;
      if (!context) {
        return;
      }

      const dprCap = getDevicePixelRatioCap(performanceMode);
      const dpr = clamp(window.devicePixelRatio || 1, 1, dprCap);
      const rect = canvas.getBoundingClientRect();
      const targetWidth = Math.max(1, Math.round(rect.width * dpr));
      const targetHeight = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      let frameToDraw = requestedFrame;
      if (!imageCacheRef.current.has(frameToDraw)) {
        frameToDraw = lastSuccessfulFrameRef.current;
      }
      if (!imageCacheRef.current.has(frameToDraw)) {
        frameToDraw = 1;
      }

      const image = imageCacheRef.current.get(frameToDraw);
      if (!image) {
        return;
      }

      const previousDraw = lastDrawStateRef.current;
      if (
        previousDraw &&
        previousDraw.frame === frameToDraw &&
        previousDraw.width === targetWidth &&
        previousDraw.height === targetHeight
      ) {
        return;
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      drawCoverImage(context, image, targetWidth, targetHeight);

      lastSuccessfulFrameRef.current = frameToDraw;
      lastDrawStateRef.current = {
        frame: frameToDraw,
        width: targetWidth,
        height: targetHeight
      };
    },
    [performanceMode]
  );

  const requestDraw = useCallback(() => {
    if (drawRafRef.current !== null) {
      return;
    }

    drawRafRef.current = window.requestAnimationFrame(() => {
      drawRafRef.current = null;
      drawFrame(targetFrameRef.current);
    });
  }, [drawFrame]);

  useEffect(() => {
    targetFrameRef.current = targetFrame;
    requestDraw();

    void loadFrame(targetFrame).then((image) => {
      if (!image) {
        return;
      }
      requestDraw();
    });
  }, [loadFrame, requestDraw, targetFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const handleResize = () => requestDraw();
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            requestDraw();
          })
        : null;

    resizeObserver?.observe(canvas);
    window.addEventListener('resize', handleResize, { passive: true });
    requestDraw();

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [requestDraw]);

  useEffect(() => {
    const nearWindow = getPreloadNearWindow(performanceMode);
    const preloadBatchSize = getPreloadBatchSize(performanceMode);
    const frameCount = TRANSMISSION_LINE_SEQUENCE_CONFIG.frameCount;
    const reducedMotionFrame = TRANSMISSION_LINE_SEQUENCE_CONFIG.reducedMotionFrame;
    const immediateFrames = new Set([1, targetFrame, reducedMotionFrame]);

    immediateFrames.forEach((frameIndex) => {
      void loadFrame(frameIndex).then(() => {
        if (frameIndex === targetFrame || frameIndex === 1) {
          requestDraw();
        }
      });
    });

    if (reducedMotion) {
      clearIdlePreload();
      pendingBackgroundFramesRef.current = [];
      return undefined;
    }

    const nearFrames = new Set<number>();
    for (let offset = -nearWindow; offset <= nearWindow; offset += 1) {
      const frameIndex = targetFrame + offset;
      if (frameIndex < 1 || frameIndex > frameCount || immediateFrames.has(frameIndex)) {
        continue;
      }
      nearFrames.add(frameIndex);
      void loadFrame(frameIndex);
    }

    const remainingFrames: number[] = [];
    for (let frameIndex = 1; frameIndex <= frameCount; frameIndex += 1) {
      if (immediateFrames.has(frameIndex) || nearFrames.has(frameIndex)) {
        continue;
      }
      remainingFrames.push(frameIndex);
    }

    remainingFrames.sort(
      (left, right) => Math.abs(left - targetFrame) - Math.abs(right - targetFrame)
    );
    pendingBackgroundFramesRef.current = remainingFrames;

    const runBackgroundPreload = (deadline?: IdleDeadline) => {
      idleHandleRef.current = null;
      let loadedInBatch = 0;

      while (pendingBackgroundFramesRef.current.length > 0 && loadedInBatch < preloadBatchSize) {
        if (deadline && !deadline.didTimeout && deadline.timeRemaining() < 4) {
          break;
        }

        const frameIndex = pendingBackgroundFramesRef.current.shift();
        if (typeof frameIndex !== 'number') {
          break;
        }

        void loadFrame(frameIndex);
        loadedInBatch += 1;
      }

      if (pendingBackgroundFramesRef.current.length === 0) {
        return;
      }

      if (typeof window.requestIdleCallback === 'function') {
        idleHandleRef.current = window.requestIdleCallback(runBackgroundPreload, {
          timeout: 220
        });
      } else {
        idleHandleRef.current = window.setTimeout(() => {
          runBackgroundPreload();
        }, 80);
      }
    };

    clearIdlePreload();
    if (typeof window.requestIdleCallback === 'function') {
      idleHandleRef.current = window.requestIdleCallback(runBackgroundPreload, {
        timeout: 220
      });
    } else {
      idleHandleRef.current = window.setTimeout(() => {
        runBackgroundPreload();
      }, 80);
    }

    return () => {
      clearIdlePreload();
    };
  }, [clearIdlePreload, loadFrame, performanceMode, reducedMotion, requestDraw, targetFrame]);

  useEffect(
    () => () => {
      if (drawRafRef.current !== null) {
        window.cancelAnimationFrame(drawRafRef.current);
        drawRafRef.current = null;
      }
      clearIdlePreload();
    },
    [clearIdlePreload]
  );

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full bg-black"
      aria-hidden="true"
    />
  );
}
