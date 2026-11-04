import * as PIXI from 'pixi.js';

import { UI_CONFIG } from '@/entities/game-session';

import { GameObject } from './GameObject';

export interface FloatingMessageSpawnParams {
  x: number;
  y: number;
  text: string;
  /** мс: сколько сообщение ждёт, оставаясь прозрачным, прежде чем проявиться. */
  delay: number;
}

/**
 * Всплывающее сообщение о событии игры (веха комбо и т.п.).
 *
 * Текст создаётся один раз в конструкторе и переиспользуется: объект живёт в
 * пуле, поэтому пересоздание `PIXI.Text` на каждый спавн означало бы запекание
 * новой текстуры в GPU по нескольку раз за партию.
 *
 * Жизненный цикл: spawn() → (задержка) → подъём с затуханием → reset().
 */
export class FloatingMessage extends GameObject<FloatingMessageSpawnParams> {
  // Сообщение — визуальный эффект: заморозка за промах его не останавливает.
  // Флаг декларативный, движок читает его вручную в ветке freeze.
  protected readonly ignoresFreeze = true;

  private readonly textNode: PIXI.Text;

  /** Остаток задержки появления, мс. Пока > 0 — сообщение невидимо и не движется. */
  private delayRemaining: number = 0;

  constructor() {
    super();

    this.textNode = new PIXI.Text({
      text: '',
      style: {
        fontSize: UI_CONFIG.MESSAGE_FONT_SIZE,
        fill: 0xffffff,
        // Обводка держит читаемость на любом цвете круга: белый текст на светлом
        // фоне иначе растворяется, а цвет фона здесь случайный.
        stroke: { color: 0x000000, width: 4 },
      },
    });

    // anchor вместо pivot: текст центрируется сам, а позицию задаёт контейнер.
    this.textNode.anchor.set(0.5);
    this.textNode.visible = false;

    // Pixi 8 в конструкторе Graphics выставляет allowChildren = false и считает
    // детей у Graphics устаревшими: без этого флага каждый addChild пишет
    // deprecation-warning со стеком. Флаг включаем осознанно — база пула
    // (GameObject) рисует через Graphics, а содержимое сообщения — обычный
    // PIXI.Text. Дети Graphics рендерятся штатно: они попадают в renderGroup
    // родителя через parentRenderGroup (collectRenderablesSimple).
    this.allowChildren = true;
    this.addChild(this.textNode);

    this.visible = false;
    this.alpha = 0;
  }

  spawn({ x, y, text, delay }: FloatingMessageSpawnParams): void {
    this.textNode.text = text;
    this.textNode.visible = true;

    // Разброс по X: несколько сообщений в одной точке не сливаются в одно пятно.
    this.x = x + (Math.random() - 0.5) * UI_CONFIG.MESSAGE_X_SPREAD;
    this.y = y;

    this.delayRemaining = delay;

    this.activate();

    // activate() принудительно ставит alpha = 1, поэтому отложенное сообщение
    // гасим ПОСЛЕ него: иначе оно мигнуло бы на один кадр раньше срока.
    this.alpha = delay > 0 ? 0 : 1;
  }

  update(dt: number): void {
    if (!this._isActive) return;

    // Задержка — «карантин» перед появлением: пока она не вышла, сообщение
    // прозрачно и не поднимается, поэтому пачка событий проявляется по очереди,
    // а не наплывает одним кадром. Время жизни при этом ещё не тикает.
    if (this.delayRemaining > 0) {
      this.delayRemaining -= dt;

      if (this.delayRemaining > 0) return;

      this.delayRemaining = 0;
      this.alpha = 1;
    }

    // Подъём вверх: скорость в px/мс, потому что dt из тикера — миллисекунды.
    this.y -= UI_CONFIG.MESSAGE_FLOAT_SPEED * dt;

    // Затухание: за MESSAGE_LIFESPAN_MS alpha проходит путь от 1 до 0.
    this.alpha -= dt / UI_CONFIG.MESSAGE_LIFESPAN_MS;

    if (this.alpha <= 0) {
      this.reset();
    }
  }

  reset(): void {
    // deactivate() внутри: visible = false, _isActive = false.
    super.reset();

    // Текст не уничтожаем — объект вернётся в пул и получит новый текст на спавне.
    this.textNode.visible = false;
    this.textNode.text = '';

    this.delayRemaining = 0;
    this.alpha = 0;
  }

  override destroy(options?: PIXI.DestroyOptions): void {
    // Текст — ребёнок, созданный вручную. Движок уничтожает пул без опций, то есть
    // без { children: true }, поэтому освобождаем текст сами: иначе его текстура
    // осталась бы в памяти GPU. Повторный destroy безопасен — Container его гардит.
    this.textNode.destroy();
    super.destroy(options);
  }
}
