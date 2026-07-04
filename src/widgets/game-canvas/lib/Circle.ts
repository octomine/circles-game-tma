import { GAME_CONFIG } from '@/entities/game-session';

import { GameObject } from './GameObject';

/**
 * Параметры для спавна круга.
 */
export interface CircleSpawnParams {
  x: number;
  y: number;
  color: string;
  lifetime: number;
}

/**
 * Игровой круг — кликабельный объект с временем жизни.
 *
 * Жизненный цикл:
 * 1. spawn() — появляется в точке (x, y) с заданным цветом
 * 2. update(dt) — стареет, плавно исчезает в конце жизни
 * 3. reset() — возвращается в пул, когда lifetime истёк
 */
export class Circle extends GameObject<CircleSpawnParams> {
  private colorHex: string = '';
  private age: number = 0;
  private lifetime: number = 0;
  private fadeDuration: number = 2;

  /** Геттер цвета — для проверки клика */
  get color(): string {
    return this.colorHex;
  }

  spawn(params: CircleSpawnParams): void {
    // Рисуем круг в локальных координатах (центр в 0,0)
    this.clear();
    this.circle(0, 0, GAME_CONFIG.CIRCLE_RADIUS);
    this.fill(params.color);

    // Позиционируем на сцене
    this.x = params.x;
    this.y = params.y;

    // Сохраняем параметры
    this.colorHex = params.color;
    this.lifetime = params.lifetime;
    this.fadeDuration = Math.min(2, params.lifetime * 0.25);
    this.age = 0;

    // Активируем
    this.activate();

    // Делаем кликабельным
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  update(dt: number): void {
    if (!this._isActive) return;

    this.age += dt;

    // Плавное исчезновение в последние секунды
    const fadeStart = this.lifetime - this.fadeDuration;
    if (this.age >= fadeStart) {
      const fadeProgress = (this.age - fadeStart) / this.fadeDuration;
      this.alpha = Math.max(0, 1 - fadeProgress);
    }

    // Смерть по таймеру
    if (this.age >= this.lifetime) {
      this.reset();
    }
  }

  reset(): void {
    super.reset();
    this.age = 0;
    this.colorHex = '';
    this.lifetime = 0;
    this.eventMode = 'none';
    this.cursor = 'default';
  }
}
