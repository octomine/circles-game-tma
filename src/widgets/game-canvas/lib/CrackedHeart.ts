import * as PIXI from 'pixi.js';

import { GameObject } from './GameObject';

/**
 * Параметры для спавна разбитого сердца.
 */
export interface CrackedHeartSpawnParams {
  x: number;
  y: number;
  maxSize: number;
  duration: number;
}

/**
 * Разбитое сердце — визуальный эффект при потере жизни.
 * Появляется в точке клика, растёт до maxSize, затем исчезает.
 *
 * Жизненный цикл:
 * 1. spawn() — появляется в точке (x, y) с scale = 0
 * 2. update(dt) — растёт (первая половина), затем fade-out (вторая половина)
 * 3. reset() — возвращается в пул
 */
export class CrackedHeart extends GameObject<CrackedHeartSpawnParams> {
  private text: PIXI.Text | null = null;
  private maxSize: number = 0;
  private duration: number = 0;
  private age: number = 0;

  spawn(params: CrackedHeartSpawnParams): void {
    // Очищаем предыдущий текст, если есть
    if (this.text) {
      this.removeChild(this.text);
      this.text.destroy();
    }

    // Создаём текст с эмодзи
    this.text = new PIXI.Text({
      text: '💔',
      style: new PIXI.TextStyle({
        fontSize: 100,
        fill: '#FF0000',
      }),
    });

    // Центрируем текст
    this.text.anchor.set(0.5);

    // Добавляем на сцену
    this.addChild(this.text);

    // Позиционируем
    this.x = params.x;
    this.y = params.y;

    // Сохраняем параметры
    this.maxSize = params.maxSize;
    this.duration = params.duration;
    this.age = 0;

    // Начальное состояние: scale = 0, alpha = 0
    this.scale.set(0);
    this.alpha = 0;

    // Активируем (eventMode остаётся 'none' — не кликабельно)
    this.activate();
  }

  update(dt: number): void {
    if (!this._isActive || !this.text) return;

    this.age += dt;
    const progress = this.age / this.duration;

    if (progress < 0.5) {
      // Первая половина: рост
      const scaleProgress = progress * 2; // 0 → 1
      const currentScale = scaleProgress * (this.maxSize / 100); // 100 — базовый размер эмодзи
      this.scale.set(currentScale);
      this.alpha = scaleProgress; // Появляется
    } else {
      // Вторая половина: fade-out
      const fadeProgress = (progress - 0.5) * 2; // 0 → 1
      this.alpha = 1 - fadeProgress; // Исчезает
    }

    // Смерть, когда время вышло
    if (progress >= 1) {
      this.reset();
    }
  }

  reset(): void {
    super.reset();
    this.age = 0;
    this.maxSize = 0;
    this.duration = 0;
    this.scale.set(0);
    this.alpha = 0;
  }
}
