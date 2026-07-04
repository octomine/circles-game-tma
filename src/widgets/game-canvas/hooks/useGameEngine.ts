import { useCallback, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

import { GAME_CONFIG, useGameSessionStore } from '@/entities/game-session';

import { Circle, CrackedHeart, Particle } from '../lib';

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
  const crackedHeartsRef = useRef<CrackedHeart[]>([]);
  const lastSpawnTimeRef = useRef(0);

  // Состояние заморозки — ← ИЗМЕНЕНО
  const isFreezingRef = useRef(false);
  const freezeTimeLeftRef = useRef(0);

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
      lifetime: GAME_CONFIG.CIRCLE_LIFETIME_MS,
    });
  }, [appRef]);

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
          life: GAME_CONFIG.PARTICLE_LIFE_MS,
        });
        count++;
      }
    }
  }, []);

  // Спавн разбитого сердца
  const spawnCrackedHeart = useCallback((x: number, y: number) => {
    const freeHeart = crackedHeartsRef.current.find((h) => !h.isActive);
    if (!freeHeart) return;

    freeHeart.spawn({
      x,
      y,
      maxSize: GAME_CONFIG.LOSE_LIFE_HEART_MAX_SIZE,
      duration: GAME_CONFIG.LOSE_LIFE_HEART_DURATION_MS,
    });
  }, []);

  // --- Обработчик клика ---
  const handleCircleClick = useCallback(
    (circle: Circle) => {
      if (!circle.isActive) return;

      const currentTargetColor = useGameSessionStore.getState().targetColor;

      if (circle.color === currentTargetColor) {
        // Попадание
        addScore(10);
        haptics?.impactOccurred?.('light');
        spawnParticles(circle.x, circle.y, circle.color);
        circle.reset();
      } else {
        // Промах с эффектом
        loseLife();
        haptics?.notificationOccurred?.('error');

        // Спавним эффект разбитого сердца
        spawnCrackedHeart(circle.x, circle.y);

        // Замораживаем игру через ticker
        isFreezingRef.current = true;
        freezeTimeLeftRef.current = GAME_CONFIG.LOSE_LIFE_FREEZE_MS;

        circle.reset();
      }
    },
    [addScore, loseLife, haptics]
  );

  // --- Инициализация пулов ---
  useEffect(() => {
    const app = appRef.current;
    if (!app || !isAppReady) return;

    // Очищаем старые пулы
    circlesRef.current.forEach((c) => c.destroy());
    particlesRef.current.forEach((p) => p.destroy());
    crackedHeartsRef.current.forEach((h) => h.destroy());
    circlesRef.current = [];
    particlesRef.current = [];
    crackedHeartsRef.current = [];

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

    // Создаём пул разбитых сердец
    for (let i = 0; i < 2; i++) {
      const heart = new CrackedHeart();
      app.stage.addChild(heart);
      crackedHeartsRef.current.push(heart);
    }

    return () => {
      circlesRef.current.forEach((c) => c.destroy());
      particlesRef.current.forEach((p) => p.destroy());
      crackedHeartsRef.current.forEach((h) => h.destroy());
      circlesRef.current = [];
      particlesRef.current = [];
      crackedHeartsRef.current = [];
    };
  }, [isAppReady, handleCircleClick]);

  // --- Игровой цикл ---
  useEffect(() => {
    const app = appRef.current;
    if (!app || !isAppReady) return;

    const ticker = (ticker: PIXI.Ticker) => {
      const currentStatus = useGameSessionStore.getState().status;
      if (currentStatus !== 'playing') return;

      const dt = ticker.deltaMS;

      // Обработка freeze через ticker
      if (isFreezingRef.current) {
        // Уменьшаем время заморозки
        freezeTimeLeftRef.current -= dt;

        // Если время вышло — размораживаем
        if (freezeTimeLeftRef.current <= 0) {
          isFreezingRef.current = false;
          freezeTimeLeftRef.current = 0;

          // Проверяем, не закончились ли жизни
          const currentLives = useGameSessionStore.getState().lives;
          if (currentLives <= 0) {
            useGameSessionStore.getState().setScreen('gameover');
          }
        }

        // Во время freeze обновляем ТОЛЬКО визуальные эффекты
        for (const particle of particlesRef.current) {
          particle.update(dt);
        }
        for (const heart of crackedHeartsRef.current) {
          heart.update(dt);
        }

        return; // ← Выходим, не обновляем интерактивные объекты
      }

      // --- Обычное обновление (не freeze) ---

      // Обновляем таймеры и спавн
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

      // Обновление кругов (интерактивные)
      for (const circle of circlesRef.current) {
        circle.update(dt);
      }

      // Визуальные эффекты обновляются ВСЕГДА
      for (const particle of particlesRef.current) {
        particle.update(dt);
      }
      for (const heart of crackedHeartsRef.current) {
        heart.update(dt);
      }
    };

    app.ticker.add(ticker);
    return () => {
      app.ticker.remove(ticker);
    };
  }, [isAppReady, tickTime, changeTargetColor, spawnCircle]);
}
