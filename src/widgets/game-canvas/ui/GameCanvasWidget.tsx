'use client';

import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useGameSessionStore } from '@/entities/game-session';
import { useTelegram } from '@/shared';
import { useGameEngine } from '../hooks/useGameEngine';

export function GameCanvasWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const { webApp } = useTelegram();
  const startGame = useGameSessionStore((state) => state.startGame);
  const [isAppReady, setIsAppReady] = useState(false);

  useGameEngine({
    appRef,
    isAppReady,
    haptics: webApp?.HapticFeedback || null,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Очищаем контейнер от старых канвасов (защита от дублей)
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const app = new PIXI.Application();
    appRef.current = app;

    // Инициализируем с размерами окна
    app
      .init({
        background: '#1c1c1e',
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        width: window.innerWidth,
        height: window.innerHeight,
      })
      .then(() => {
        if (!containerRef.current || !appRef.current) return;

        containerRef.current.appendChild(app.canvas);

        // Принудительно растягиваем канвас через CSS
        app.canvas.style.width = '100%';
        app.canvas.style.height = '100%';
        app.canvas.style.display = 'block';

        setIsAppReady(true);
        startGame();
      });

    const handleResize = () => {
      if (appRef.current && containerRef.current) {
        appRef.current.renderer.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      const currentApp = appRef.current;
      appRef.current = null;
      setIsAppReady(false);

      if (currentApp) {
        // 2. Останавливаем тикер
        try {
          currentApp.ticker.stop();
        } catch (e) {
          /* ignore */
        }

        // 3. ВАЖНО: Сохраняем ссылку на canvas ДО уничтожения приложения
        const canvas = currentApp.canvas;

        try {
          // 4. Удаляем канвас из DOM вручную
          if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        } catch (e) {
          /* ignore */
        }

        // 5. Уничтожаем приложение с задержкой
        setTimeout(() => {
          try {
            // Передаем false, так как canvas мы уже удалили сами
            currentApp.destroy(false, { children: true, texture: true });
          } catch (e) {
            console.warn('Pixi destroy warning:', e);
          }
        }, 50);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      // 6. Используем fixed, чтобы перекрыть весь экран и убрать скролл
      className="fixed inset-0 z-50 h-screen w-screen touch-none overflow-hidden"
      style={{ backgroundColor: 'var(--tg-theme-bg-color, #1c1c1e)' }}
    />
  );
}
