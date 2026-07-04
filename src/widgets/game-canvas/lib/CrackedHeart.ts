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
 */
export class CrackedHeart extends GameObject<CrackedHeartSpawnParams> {
  private text: PIXI.Text | null = null;
  private maxSize: number = 0;
  private duration: number = 0;
  private age: number = 0;

  spawn(params: CrackedHeartSpawnParams): void {
    // Очищаем предыдущий текст, если есть
    if (this.text) {
      this.text.destroy();
      this.text = null;
    }

    // Создаём текст с правильным API PIXI 8
    this.text = new PIXI.Text({
      text: '💔',
      style: {
        fontSize: 100,
        fill: '#FF0000',
      },
    });

    // Центрируем текст
    this.text.anchor.set(0.5);

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

    // Добавляем текст на stage напрямую, а не как child
    if (this.parent) {
      this.parent.addChild(this.text);
      this.text.x = this.x;
      this.text.y = this.y;
    }

    // Активируем
    this.activate();
  }

  update(dt: number): void {
    if (!this._isActive || !this.text) return;

    this.age += dt;
    const progress = this.age / this.duration;

    if (progress < 0.5) {
      // Первая половина: рост
      const scaleProgress = progress * 2; // 0 → 1
      const currentScale = scaleProgress * (this.maxSize / 100);
      this.text.scale.set(currentScale);
      this.text.alpha = scaleProgress;
    } else {
      // Вторая половина: fade-out
      const fadeProgress = (progress - 0.5) * 2; // 0 → 1
      this.text.alpha = 1 - fadeProgress;
    }

    // Смерть, когда время вышло
    if (progress >= 1) {
      this.reset();
    }
  }

  reset(): void {
    super.reset();

    // Удаляем текст из stage
    if (this.text) {
      if (this.text.parent) {
        this.text.parent.removeChild(this.text);
      }
      this.text.destroy();
      this.text = null;
    }

    this.age = 0;
    this.maxSize = 0;
    this.duration = 0;
    this.scale.set(0);
    this.alpha = 0;
  }
}
