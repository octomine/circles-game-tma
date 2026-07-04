import { GAME_CONFIG } from '@/entities/game-session';

import { GameObject } from './GameObject';

export interface CircleSpawnParams {
  x: number;
  y: number;
  color: string;
}

export class Circle extends GameObject<CircleSpawnParams> {
  private colorHex: string = '';
  private age: number = 0;
  private lifetime: number = 0;
  private radius: number = 0;
  private hasSwitchedPivot: boolean = false;

  get color(): string {
    return this.colorHex;
  }

  private getRandomPointInside(maxOffset: number): { x: number; y: number } {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * maxOffset;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  }

  spawn(params: CircleSpawnParams): void {
    const variance = GAME_CONFIG.CIRCLE_RADIUS_VARIANCE;
    const minRadius = GAME_CONFIG.CIRCLE_RADIUS * (1 - variance);
    const maxRadius = GAME_CONFIG.CIRCLE_RADIUS * (1 + variance);
    this.radius = minRadius + Math.random() * (maxRadius - minRadius);

    const lifetimeVariance = GAME_CONFIG.CIRCLE_LIFETIME_VARIANCE;
    const minLifetime = GAME_CONFIG.CIRCLE_LIFETIME_MS * (1 - lifetimeVariance);
    const maxLifetime = GAME_CONFIG.CIRCLE_LIFETIME_MS * (1 + lifetimeVariance);
    this.lifetime = minLifetime + Math.random() * (maxLifetime - minLifetime);

    this.clear();
    this.circle(0, 0, this.radius);
    this.fill(params.color);

    this.x = params.x;
    this.y = params.y;

    this.colorHex = params.color;
    this.age = 0;
    this.hasSwitchedPivot = false;

    // Точка A для первой половины жизни
    const pointA = this.getRandomPointInside(this.radius);
    this.pivot.set(pointA.x, pointA.y);

    this.scale.set(0);
    this.activate();

    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  update(dt: number): void {
    if (!this._isActive) return;

    this.age += dt;
    const progress = this.age / this.lifetime;
    const scale = Math.sin(progress * Math.PI);
    this.scale.set(scale);

    // 🔄 Смена pivot в середине жизни + компенсация позиции
    if (progress >= 0.5 && !this.hasSwitchedPivot) {
      const oldPivotX = this.pivot.x;
      const oldPivotY = this.pivot.y;
      const pointB = this.getRandomPointInside(this.radius * 0.4);

      // 🛡️ Компенсация: сдвигаем x/y так, чтобы визуальная позиция не изменилась
      this.x += (pointB.x - oldPivotX) * scale;
      this.y += (pointB.y - oldPivotY) * scale;

      this.pivot.set(pointB.x, pointB.y);
      this.hasSwitchedPivot = true;
    }

    if (this.age >= this.lifetime) {
      this.reset();
    }
  }

  reset(): void {
    super.reset();
    this.age = 0;
    this.colorHex = '';
    this.lifetime = 0;
    this.radius = 0;
    this.hasSwitchedPivot = false;
    this.scale.set(0);
    this.pivot.set(0, 0);
    this.eventMode = 'none';
    this.cursor = 'default';
  }
}
