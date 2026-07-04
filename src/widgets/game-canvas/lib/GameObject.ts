import * as PIXI from 'pixi.js';

/**
 * Абстрактный базовый класс для всех игровых объектов.
 *
 * Отвечает за:
 * - Состояние активности (жив/мёртв)
 * - Видимость на сцене
 * - Базовый жизненный цикл (spawn → update → reset)
 *
 * НЕ отвечает за:
 * - Где находится (stage, app) — это знает движок
 * - Как обрабатываются события — это тоже знает движок
 * - Конкретную отрисовку — это знает наследник
 */
export abstract class GameObject<TSpawnParams = void> extends PIXI.Graphics {
  protected _isActive: boolean = false;

  /**
   * Геттер для проверки активности.
   * Внешний код (движок) не должен менять это напрямую.
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * "Оживить" объект с заданными параметрами.
   * Наследник должен:
   * - Нарисовать себя (clear + circle/fill/etc)
   * - Сохранить параметры в свои поля
   * - Вызвать activate()
   */
  abstract spawn(params: TSpawnParams): void;

  /**
   * Обновить состояние на один кадр.
   * Вызывается движком каждый кадр с delta time в секундах.
   * Наследник должен:
   * - Обновить свою внутреннюю логику (возраст, позиция, etc)
   * - Вызвать reset(), если "умер"
   */
  abstract update(dt: number): void;

  /**
   * Вернуть объект в пул.
   * Сбрасывает состояние, скрывает объект.
   * Вызывается либо самим объектом (при смерти), либо движком.
   */
  reset(): void {
    this.deactivate();
  }

  /**
   * Внутренний метод для "активации".
   * Устанавливает базовые свойства для видимого объекта.
   */
  protected activate(): void {
    this._isActive = true;
    this.visible = true;
    this.alpha = 1;
    this.eventMode = 'none'; // По умолчанию не интерактивен
  }

  /**
   * Внутренний метод для "деактивации".
   * Скрывает объект и сбрасывает состояние.
   */
  protected deactivate(): void {
    this._isActive = false;
    this.visible = false;
  }
}
