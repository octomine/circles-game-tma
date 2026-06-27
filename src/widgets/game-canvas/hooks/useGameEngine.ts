import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { GAME_CONFIG, useGameSessionStore } from '@/entities/game-session';
import type { UseGameEngineProps, GameCircle, Particle } from './types';
import { spawnCircle, returnToPool, spawnParticles } from './helpers';

export function useGameEngine({ appRef, isAppReady, haptics }: UseGameEngineProps) {
  // Селекторы стора
  const status = useGameSessionStore((state) => state.status);
  const targetColor = useGameSessionStore((state) => state.targetColor);
  const addScore = useGameSessionStore((state) => state.addScore);
  const loseLife = useGameSessionStore((state) => state.loseLife);
  const tickTime = useGameSessionStore((state) => state.tickTime);
  const changeTargetColor = useGameSessionStore((state) => state.changeTargetColor);

  // Рефы
  const circlesRef = useRef<GameCircle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastSpawnTimeRef = useRef(0);

  // --- Инициализация Пулов ---
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    // Пул кругов
    for (let i = 0; i < GAME_CONFIG.MAX_CIRCLES_ON_SCREEN; i++) {
      const circle = new PIXI.Graphics() as GameCircle;
      circle.eventMode = 'static';
      circle.cursor = 'pointer';
      circle.visible = false;
      circle.on('pointerdown', () => handleCircleClick(circle));
      app.stage.addChild(circle);
      circlesRef.current.push(circle as GameCircle);
    }

    // Пул частиц
    for (let i = 0; i < 50; i++) {
      const particle = new PIXI.Graphics();
      particle.visible = false;
      app.stage.addChild(particle);
      particlesRef.current.push(particle as Particle);
    }

    return () => {
      circlesRef.current.forEach((c) => c.destroy());
      particlesRef.current.forEach((p) => p.destroy());
      circlesRef.current = [];
      particlesRef.current = [];
    };
  }, [isAppReady]);

  // --- Логика Клика ---
  const handleCircleClick = (circle: GameCircle) => {
    if (!circle.visible || !circle.isActive) return;

    if (circle.colorHex === targetColor) {
      addScore(10);
      haptics?.impactOccurred('light');
      spawnParticles(particlesRef.current, circle.x, circle.y, circle.colorHex);
      returnToPool(circle);
    } else {
      loseLife();
      haptics?.notificationOccurred('error');
      returnToPool(circle);
    }
  };

  // --- Игровой Цикл (Ticker) ---
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    const ticker = (ticker: PIXI.Ticker) => {
      if (status !== 'playing') return;

      const deltaSeconds = ticker.deltaMS / 60;
      tickTime(deltaSeconds);

      if (useGameSessionStore.getState().timeToNextColor <= 0) {
        changeTargetColor();
      }

      const now = Date.now();
      if (now - lastSpawnTimeRef.current > GAME_CONFIG.SPAWN_INTERVAL_MS) {
        spawnCircle(circlesRef.current, app);
        lastSpawnTimeRef.current = now;
      }

      // Анимация частиц
      particlesRef.current.forEach((p) => {
        if (p.visible) {
          const particle = p as Particle;
          particle.x += particle.velocity.x;
          particle.y += particle.velocity.y;
          particle.life -= deltaSeconds;
          p.alpha = Math.max(0, particle.life);
          if (particle.life <= 0) p.visible = false;
        }
      });
    };

    app.ticker.add(ticker);
    return () => {
      app.ticker.remove(ticker);
    };
  }, [appRef, status, tickTime, changeTargetColor, targetColor]);
}
