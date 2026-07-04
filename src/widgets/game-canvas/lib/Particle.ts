import { GAME_CONFIG } from '@/entities/game-session';

import { GameObject } from './GameObject';

/**
 * Параметры для спавна частицы.
 */
export interface ParticleSpawnParams {
  x: number;
  y: number;
  color: string;
  velocity: { x: number; y: number };
  life: number;
}

/**
 * Частица — неинтерактивный визуальный эффект.
 * Летит по вектору и затухает.
 *
 * Жизненный цикл:
 * 1. spawn() — появляется в точке (x, y) с вектором скорости
 * 2. update(dt) — движется, затухает
 * 3. reset() — возвращается в пул, когда life истекла
 */
export class Particle extends GameObject<ParticleSpawnParams> {
  private velocityX: number = 0;
  private velocityY: number = 0;
  private life: number = 0;
  private maxLife: number = 0;

  protected readonly ignoresFreeze = true;

  spawn(params: ParticleSpawnParams): void {
    // Рисуем частицу в локальных координатах
    this.clear();
    this.circle(0, 0, GAME_CONFIG.PARTICLE_SIZE);
    this.fill(params.color);

    // Позиционируем на сцене
    this.x = params.x;
    this.y = params.y;

    // Сохраняем параметры
    this.velocityX = params.velocity.x;
    this.velocityY = params.velocity.y;
    this.life = params.life;
    this.maxLife = params.life;

    // Активируем (eventMode остаётся 'none' — не кликабельна)
    this.activate();
  }

  update(dt: number): void {
    if (!this._isActive) return;

    // Движение по вектору
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Затухание пропорционально оставшейся жизни
    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);

    // Смерть, когда жизнь закончилась
    if (this.life <= 0) {
      this.reset();
    }
  }

  reset(): void {
    super.reset();
    this.velocityX = 0;
    this.velocityY = 0;
    this.life = 0;
    this.maxLife = 0;
  }
}
