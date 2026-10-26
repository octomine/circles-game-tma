import { useCallback, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

import { GAME_CONFIG, useGameSessionStore, type GameStatus } from '@/entities/game-session';

import { Circle, CrackedHeart, Particle } from '../lib';

import type { UseGameEngineProps } from './types';

export function useGameEngine({ appRef, isAppReady }: UseGameEngineProps) {
  // Селекторы стора
  const status = useGameSessionStore((state) => state.status);
  const processCorrectClick = useGameSessionStore((state) => state.processCorrectClick);
  const processWrongClick = useGameSessionStore((state) => state.processWrongClick);
  const pauseGame = useGameSessionStore((state) => state.pauseGame);
  const resumeGame = useGameSessionStore((state) => state.resumeGame);
  const tickTime = useGameSessionStore((state) => state.tickTime);
  const changeTargetColor = useGameSessionStore((state) => state.changeTargetColor);

  // Пулы объектов
  const circlesRef = useRef<Circle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const crackedHeartsRef = useRef<CrackedHeart[]>([]);
  // Время последнего спавна в единицах ИГРОВОГО времени, а не Date.now():
  // отрицательный старт нужен, чтобы первый круг появился сразу, без ожидания
  // полного интервала (gameTime начинается с нуля).
  const lastSpawnTimeRef = useRef(-GAME_CONFIG.SPAWN_INTERVAL_MS);

  // Предыдущий статус: отличает старт игры от возврата из паузы
  const prevStatusRef = useRef<GameStatus | null>(null);

  // Состояние заморозки
  const isFreezingRef = useRef(false);
  const freezeTimeLeftRef = useRef(0);

  // --- Выбор цвета для спавна ---
  const chooseColorForSpawn = useCallback((): string => {
    const targetColor = useGameSessionStore.getState().targetColor;

    // Считаем количество активных кругов
    const activeCircles = circlesRef.current.filter((circle) => circle.isActive);
    const activeCirclesCount = activeCircles.length;

    // Проверяем, есть ли на экране хотя бы один круг нужного цвета
    const hasTargetColorOnScreen = activeCircles.some((circle) => circle.color === targetColor);

    // Гарантия только если экран достаточно заполнен
    if (activeCirclesCount >= GAME_CONFIG.MIN_CIRCLES_FOR_GUARANTEE && !hasTargetColorOnScreen) {
      return targetColor;
    }

    // Если нужный цвет есть или экран не заполнен — используем базовую вероятность
    if (Math.random() < GAME_CONFIG.TARGET_COLOR_SPAWN_CHANCE) {
      return targetColor;
    }

    // Иначе — случайный цвет из остальных
    const otherColors = GAME_CONFIG.COLORS.filter((c) => c !== targetColor);
    return otherColors[Math.floor(Math.random() * otherColors.length)];
  }, []);

  // --- Спавн круга ---
  const spawnCircle = useCallback(() => {
    const app = appRef.current;
    if (!app) return;

    const freeCircle = circlesRef.current.find((c) => !c.isActive);
    if (!freeCircle) return;

    // Используем новую функцию выбора цвета
    const color = chooseColorForSpawn();

    // Полярные координаты
    const centerX = app.screen.width / 2;
    const centerY = app.screen.height / 2;
    const maxRadius = Math.min(app.screen.width, app.screen.height) / 2;

    // Случайный угол (0-2π)
    const angle = Math.random() * Math.PI * 2;

    // Случайное расстояние от центра (используем sqrt для равномерного распределения по площади)
    const distance = Math.random() * maxRadius;
    // const distance = Math.sqrt(Math.random()) * maxRadius;

    // Преобразуем в прямоугольные координаты
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    freeCircle.spawn({
      x,
      y,
      color,
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
        // Попадание: стор сам решает, как изменится комбо, счёт и бонусы
        processCorrectClick();
        spawnParticles(circle.x, circle.y, circle.color);
        circle.reset();
      } else {
        // Промах: щит в сторе может погасить его без потери жизни
        processWrongClick();

        // Спавним эффект разбитого сердца
        spawnCrackedHeart(circle.x, circle.y);

        // Замораживаем игру через ticker
        isFreezingRef.current = true;
        freezeTimeLeftRef.current = GAME_CONFIG.LOSE_LIFE_FREEZE_MS;

        circle.reset();
      }
    },
    [processCorrectClick, processWrongClick, spawnParticles, spawnCrackedHeart]
  );

  // --- Авто-пауза при скрытии вкладки ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentStatus = useGameSessionStore.getState().status;

      // Вкладка скрыта (свернули Telegram, переключили чат) — ставим игру на паузу:
      // gameTime замирает, и оставленные без присмотра круги не сгорают за спиной.
      if (document.hidden) {
        if (currentStatus === 'playing') {
          pauseGame();
        }
        return;
      }

      // Вернулись — продолжаем с того же места.
      if (currentStatus === 'paused') {
        resumeGame();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseGame, resumeGame]);

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
      // На паузе цикл стоит целиком: игровое время не копится, круги не стареют.
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

        // tickTime здесь НЕ зовётся: gameTime замирает, поэтому заморозка
        // не растягивает интервал и не сбрасывает комбо.
        return; // ← Выходим, не обновляем интерактивные объекты
      }

      // --- Обычное обновление (не freeze) ---

      // Обновляем таймеры и спавн
      tickTime(dt);

      // Смена цвета по таймеру
      if (useGameSessionStore.getState().timeToNextColor <= 0) {
        changeTargetColor();
      }

      // Спавн новых кругов: сравниваем накопленное игровое время с моментом
      // последнего спавна — свёрнутая вкладка и пауза не ускоряют поток кругов.
      const gameTime = useGameSessionStore.getState().gameTime;
      if (gameTime - lastSpawnTimeRef.current >= GAME_CONFIG.SPAWN_INTERVAL_MS) {
        spawnCircle();
        lastSpawnTimeRef.current = gameTime;
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

  // --- Очистка всех объектов при старте игры ---
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // Только вход в игру. Возврат из паузы ('paused' → 'playing') доску не трогает:
    // иначе каждое переключение вкладки стирало бы все круги с экрана.
    if (status !== 'playing' || prevStatus === 'paused') return;

    // Сбрасываем все активные круги
    circlesRef.current.forEach((circle) => {
      if (circle.isActive) {
        circle.reset();
      }
    });

    // Сбрасываем все активные частицы
    particlesRef.current.forEach((particle) => {
      if (particle.isActive) {
        particle.reset();
      }
    });

    // Сбрасываем все активные сердца
    crackedHeartsRef.current.forEach((heart) => {
      if (heart.isActive) {
        heart.reset();
      }
    });

    // Сбрасываем состояние заморозки
    isFreezingRef.current = false;
    freezeTimeLeftRef.current = 0;

    // Сбрасываем таймер спавна, чтобы первый круг появился сразу
    lastSpawnTimeRef.current = -GAME_CONFIG.SPAWN_INTERVAL_MS;
  }, [status]);
}
