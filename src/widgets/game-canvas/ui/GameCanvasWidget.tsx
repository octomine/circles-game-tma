'use client';

import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

import { useGameSessionStore } from '@/entities/game-session';
import { useTelegram } from '@/shared';

import { useGameEngine } from '../hooks/useGameEngine';

export function GameCanvasWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);
  const { webApp } = useTelegram();
  const startGame = useGameSessionStore((state) => state.startGame);
  const [isAppReady, setIsAppReady] = useState(false);

  useGameEngine({
    appRef,
    isAppReady,
    haptics: webApp?.HapticFeedback || null,
  });

  useEffect(() => {
    isMountedRef.current = true;

    if (!containerRef.current) return;

    // Проверка поддержки WebGL в PIXI v8
    const isWebGLSupported = (): boolean => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
      } catch (_e) {
        return false;
      }
    };

    if (!isWebGLSupported()) {
      console.error('WebGL is not supported in this browser');
      // TODO: показывать сообщение пользователю
      return;
    }

    // Очищаем контейнер
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const app = new PIXI.Application();
    appRef.current = app;

    let cancelled = false;

    app
      .init({
        background: '#1c1c1e',
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: containerRef.current, // Автоматический ресайз
      })
      .then(() => {
        if (cancelled || !isMountedRef.current || !containerRef.current) {
          try {
            app.destroy(true, { children: true, texture: true });
          } catch (e) {
            console.warn('Cleanup after unmount:', e);
          }
          return;
        }

        isInitializedRef.current = true;

        containerRef.current.appendChild(app.canvas);

        app.canvas.style.width = '100%';
        app.canvas.style.height = '100%';
        app.canvas.style.display = 'block';

        setIsAppReady(true);
        startGame();
      })
      .catch((error) => {
        console.error('Pixi initialization failed:', error);
        appRef.current = null;
        isInitializedRef.current = false;
      });

    return () => {
      cancelled = true;
      isMountedRef.current = false;

      const currentApp = appRef.current;
      appRef.current = null;
      setIsAppReady(false);

      if (currentApp && isInitializedRef.current) {
        isInitializedRef.current = false;

        // Останавливаем тикер
        try {
          if (currentApp.ticker) {
            currentApp.ticker.stop();
          }
        } catch (e) {
          console.warn('Ticker stop warning:', e);
        }

        // Удаляем canvas из DOM
        try {
          if (currentApp.canvas?.parentNode) {
            currentApp.canvas.parentNode.removeChild(currentApp.canvas);
          }
        } catch (e) {
          console.warn('Canvas removal warning:', e);
        }

        // Уничтожаем приложение
        try {
          currentApp.destroy(false, {
            children: true,
            texture: true,
          });
        } catch (e) {
          console.warn('Destroy warning:', e);
        }
      } else if (currentApp && !isInitializedRef.current) {
        console.log('App was not initialized, skipping cleanup');
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 h-screen w-screen touch-none overflow-hidden"
      style={{ backgroundColor: 'var(--tg-theme-bg-color, #1c1c1e)' }}
    />
  );
}
