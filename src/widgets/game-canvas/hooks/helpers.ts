import * as PIXI from 'pixi.js';
import type { GameCircle, Particle } from './types';
import { GAME_CONFIG } from '@/entities/game-session';

/**
 * Возвращает круг из пула и размещает его на экране
 */
export const spawnCircle = (pool: GameCircle[], app: PIXI.Application): void => {
  const freeCircle = pool.find((c) => !c.visible);
  if (!freeCircle) return;

  const color = GAME_CONFIG.COLORS[Math.floor(Math.random() * GAME_CONFIG.COLORS.length)];

  // Позиция с отступами от краев
  const x =
    Math.random() * (app.screen.width - GAME_CONFIG.CIRCLE_RADIUS * 2) + GAME_CONFIG.CIRCLE_RADIUS;
  const y =
    Math.random() * (app.screen.height - GAME_CONFIG.CIRCLE_RADIUS * 2) + GAME_CONFIG.CIRCLE_RADIUS;

  freeCircle.clear();
  freeCircle.circle(x, y, GAME_CONFIG.CIRCLE_RADIUS);
  freeCircle.fill(color);

  freeCircle.colorHex = color;
  freeCircle.isActive = true;
  freeCircle.visible = true;
};

/**
 * Возвращает объект обратно в пул (скрывает его)
 */
export const returnToPool = (obj: GameCircle | Particle): void => {
  obj.visible = false;
  if ('isActive' in obj) {
    (obj as GameCircle).isActive = false;
  }
};

/**
 * Создает эффект взрыва частиц в точке клика
 */
export const spawnParticles = (pool: Particle[], x: number, y: number, color: string): void => {
  let count = 0;
  pool.forEach((p) => {
    if (!p.visible && count < 8) {
      p.clear();
      p.circle(0, 0, GAME_CONFIG.PARTICLE_SIZE);
      p.fill(color);
      p.x = x;
      p.y = y;

      (p as Particle).velocity = {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
      };
      (p as Particle).life = GAME_CONFIG.PARTICLE_LIFE_SEC;
      p.visible = true;
      count++;
    }
  });
};
