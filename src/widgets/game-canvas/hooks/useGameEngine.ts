import { useCallback, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

import { GAME_CONFIG, useGameSessionStore } from '@/entities/game-session';

import { Circle, Particle } from '../lib';

import type { UseGameEngineProps } from './types';

export function useGameEngine({ appRef, isAppReady, haptics }: UseGameEngineProps) {
  // Селекторы стора
  const addScore = useGameSessionStore((state) => state.addScore);
  const loseLife = useGameSessionStore((state) => state.loseLife);
  const tickTime = useGameSessionStore((state) => state.tickTime);
  const changeTargetColor = useGameSessionStore((state) => state.changeTargetColor);

  // Пулы объектов
  const circlesRef = useRef<Circle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastSpawnTimeRef = useRef(0);

  // --- Спавн частиц ---
  const spawnParticles = useCallback((x: number, y: number, color: string) => {
    let count = 0;
    for (const particle of particlesRef.current) {
      if (!particle.isActive && count < 8) {
        particle.spawn({
          x,
          y,
          color,
          velocity: {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
          },
          life: GAME_CONFIG.PARTICLE_LIFE_SEC,
        });
        count++;
      }
    }
  }, []);

  // --- Обработчик клика ---
  const handleCircleClick = useCallback(
    (circle: Circle) => {
      console.log('Клик по кругу');
      if (!circle.isActive) return;

      const currentTargetColor = useGameSessionStore.getState().targetColor;

      if (circle.color === currentTargetColor) {
        addScore(10);
        haptics?.impactOccurred?.('light');
        spawnParticles(circle.x, circle.y, circle.color);
      } else {
        loseLife();
        haptics?.notificationOccurred?.('error');
      }

      circle.reset();
    },
    [addScore, loseLife, haptics]
  );

  // --- Спавн круга ---
  const spawnCircle = useCallback(() => {
    const app = appRef.current;
    if (!app) return;

    const freeCircle = circlesRef.current.find((c) => !c.isActive);
    if (!freeCircle) return;

    const color = GAME_CONFIG.COLORS[Math.floor(Math.random() * GAME_CONFIG.COLORS.length)];
    const x =
      Math.random() * (app.screen.width - GAME_CONFIG.CIRCLE_RADIUS * 2) +
      GAME_CONFIG.CIRCLE_RADIUS;
    const y =
      Math.random() * (app.screen.height - GAME_CONFIG.CIRCLE_RADIUS * 2) +
      GAME_CONFIG.CIRCLE_RADIUS;

    freeCircle.spawn({
      x,
      y,
      color,
      lifetime: GAME_CONFIG.CIRCLE_LIFETIME_SEC,
    });
  }, [appRef]);

  // --- Инициализация пулов ---
  useEffect(() => {
    const app = appRef.current;
    if (!app || !isAppReady) return;

    // Очищаем старые пулы
    circlesRef.current.forEach((c) => c.destroy());
    particlesRef.current.forEach((p) => p.destroy());
    circlesRef.current = [];
    particlesRef.current = [];

    // Создаём пул кругов
    for (let i = 0; i < GAME_CONFIG.MAX_CIRCLES_ON_SCREEN; i++) {
      const circle = new Circle();
      circle.on('pointerdown', () => handleCircleClick(circle));
      app.stage.addChild(circle);
      circlesRef.current.push(circle);
    }

    // Создаём пул частиц
    for (let i = 0; i < GAME_CONFIG.MAX_PARTICLES; i++) {
      const particle = new Particle();
      app.stage.addChild(particle);
      particlesRef.current.push(particle);
    }

    return () => {
      circlesRef.current.forEach((c) => c.destroy());
      particlesRef.current.forEach((p) => p.destroy());
      circlesRef.current = [];
      particlesRef.current = [];
    };
  }, [isAppReady, handleCircleClick]);

  // --- Игровой цикл ---
  useEffect(() => {
    const app = appRef.current;
    if (!app || !isAppReady) return;

    const ticker = (ticker: PIXI.Ticker) => {
      const currentStatus = useGameSessionStore.getState().status;
      if (currentStatus !== 'playing') return;

      const dt = ticker.deltaMS / 1000;
      tickTime(dt);

      // Смена цвета по таймеру
      if (useGameSessionStore.getState().timeToNextColor <= 0) {
        changeTargetColor();
      }

      // Спавн новых кругов
      const now = Date.now();
      if (now - lastSpawnTimeRef.current > GAME_CONFIG.SPAWN_INTERVAL_MS) {
        spawnCircle();
        lastSpawnTimeRef.current = now;
      }

      // Обновление всех объектов — ОДНА СТРОЧКА!
      for (const circle of circlesRef.current) {
        circle.update(dt);
      }
      for (const particle of particlesRef.current) {
        particle.update(dt);
      }
    };

    app.ticker.add(ticker);
    return () => {
      app.ticker.remove(ticker);
    };
  }, [isAppReady, tickTime, changeTargetColor, spawnCircle]);
}
