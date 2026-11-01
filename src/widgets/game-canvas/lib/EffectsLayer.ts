import * as PIXI from 'pixi.js';

import { UI_CONFIG } from '@/entities/game-session';

/**
 * Иконка щита — Heroicons 24/solid ShieldCheckIcon (@heroicons/react 2.2.0).
 *
 * SVG-строка, а не импорт React-компонента: щит живёт в Pixi-сцене, а не в React.
 * Заливка задана белым, чтобы иконку можно было красить через `tint`: он
 * умножается на цвет пикселя, то есть красить можно только из белого. Вырез
 * внутри щита разбирается парсером Pixi по fill-rule.
 */
const SHIELD_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"/></svg>';

/** Сторона viewBox у иконок Heroicons 24 — база для пересчёта масштаба щита. */
const HEROICON_VIEWBOX_SIZE = 24;

/** Сила размытия свечения по краям. */
const GLOW_BLUR_STRENGTH = 20;

/** Насколько щит сдвинут за правый верхний край — доля его собственного размера. */
const SHIELD_EDGE_OFFSET = 0.15;

/**
 * Слой фоновых эффектов игрового экрана: тонировка, свечение по краям и щит.
 *
 * Живёт ПОД кругами (движок добавляет его на сцену первым), поэтому эффекты не
 * перекрывают игровые объекты, а клики по канвасу достаются кругам.
 *
 * Ни один эффект не обновляется в тикере: тонировка и щит меняются только по
 * событию (подписки на стор живут в движке), а свечение запекается в текстуру
 * один раз на размер экрана. Кадровая работа — ноль.
 */
export class EffectsLayer extends PIXI.Container {
  private readonly app: PIXI.Application;
  private readonly tintGraphics: PIXI.Graphics;
  private readonly glowSource: PIXI.Graphics;
  private readonly glowSprite: PIXI.Sprite;
  private readonly glowFilter: PIXI.BlurFilter;
  private readonly shieldIcon: PIXI.Graphics;
  private glowTexture: PIXI.Texture | null = null;

  /** Последний разложенный размер сцены: нужен для перепекания свечения. */
  private screenWidth = 0;
  private screenHeight = 0;

  constructor(app: PIXI.Application) {
    super();

    this.app = app;

    // Слой декоративный: он не должен участвовать в hit-testing, иначе
    // полноэкранная тонировка перехватывала бы клики по кругам под ней.
    this.eventMode = 'none';

    // --- Тонировка ---
    // Белый прямоугольник на весь экран: цвет даёт `tint`, прозрачность — alpha.
    this.tintGraphics = new PIXI.Graphics();
    this.tintGraphics.alpha = UI_CONFIG.TINT_ALPHA;
    this.addChild(this.tintGraphics);

    // --- Свечение по краям ---
    // Источник свечения в сцену не добавляется: он нужен только для запекания.
    this.glowFilter = new PIXI.BlurFilter({ strength: GLOW_BLUR_STRENGTH });
    this.glowSource = new PIXI.Graphics();
    this.glowSource.filters = [this.glowFilter];

    this.glowSprite = new PIXI.Sprite();
    this.glowSprite.alpha = UI_CONFIG.GLOW_ALPHA;
    this.addChild(this.glowSprite);

    // --- Щит ---
    this.shieldIcon = new PIXI.Graphics();
    this.shieldIcon.svg(SHIELD_SVG);
    this.shieldIcon.alpha = UI_CONFIG.SHIELD_ALPHA;
    // pivot — центр viewBox: позиция задаёт центр иконки, а не её левый верх.
    this.shieldIcon.pivot.set(HEROICON_VIEWBOX_SIZE / 2, HEROICON_VIEWBOX_SIZE / 2);
    this.shieldIcon.visible = false;
    this.addChild(this.shieldIcon);

    // Поворот экрана и изменение окна перепекают свечение и переставляют щит.
    // Подписка здесь, потому что размер сцены — забота самого слоя.
    this.app.renderer.on('resize', this.handleResize);

    this.layout(this.app.screen.width, this.app.screen.height);
  }

  /** Цвет-цель: тонировка и свечение меняются вместе с ним. */
  setTargetColor(color: string): void {
    this.tintGraphics.tint = color;
    this.glowSprite.tint = color;
  }

  /** Щит статичен: видимость переключается без анимаций и пульсации. */
  setShieldVisible(visible: boolean): void {
    this.shieldIcon.visible = visible;
  }

  override destroy(): void {
    this.app.renderer.off('resize', this.handleResize);

    // Источник свечения и его фильтр не дети слоя, поэтому `children: true` их не
    // заберёт — уничтожаем руками. Текстуру запекания тоже: у спрайта она общая
    // с ним, и без явного destroy она осталась бы в памяти GPU.
    this.glowSource.destroy({ context: true });
    this.glowFilter.destroy();

    this.glowTexture?.destroy(true);
    this.glowTexture = null;

    super.destroy({ children: true });
  }

  private readonly handleResize = (width: number, height: number): void => {
    this.layout(width, height);
  };

  private layout(width: number, height: number): void {
    // Нулевой размер приходит до первого реального измерения контейнера,
    // а запекать текстуру 0×0 нельзя — Pixi падает на пустом кадре.
    if (width <= 0 || height <= 0) return;

    this.screenWidth = width;
    this.screenHeight = height;

    this.tintGraphics.clear().rect(0, 0, width, height).fill(0xffffff);

    this.bakeGlow();
    this.layoutShield();
  }

  /**
   * Запекает свечение в текстуру.
   *
   * BlurFilter — полноэкранный проход, поэтому держать его на живом объекте
   * нельзя: размытие пересчитывалось бы каждый кадр, хотя картинка не меняется.
   * Считаем его один раз здесь, дальше свечение живёт обычным спрайтом, а цвет
   * ему даёт бесплатный `tint`.
   */
  private bakeGlow(): void {
    // Рамка ровно по краям экрана, stroke alignment: 1 — вся толщина внутрь.
    // Наружу уходит только размытие, то есть срезается ровно то, что и так было
    // бы за границей экрана.
    this.glowSource
      .clear()
      .rect(0, 0, this.screenWidth, this.screenHeight)
      .stroke({ width: UI_CONFIG.GLOW_THICKNESS, color: 0xffffff, alignment: 1 });

    const texture = this.app.renderer.generateTexture({
      target: this.glowSource,
      // Явный кадр вместо getLocalBounds: рамка со stroke и размытием даёт
      // границы больше экрана, и без кадра текстура вышла бы крупнее нужного.
      frame: new PIXI.Rectangle(0, 0, this.screenWidth, this.screenHeight),
      // Свечение размытое: полноэкранная текстура в DPR устройства не даёт
      // видимой разницы, зато экономит память GPU.
      resolution: 1,
      antialias: false,
    });

    this.glowTexture?.destroy(true);
    this.glowTexture = texture;
    this.glowSprite.texture = texture;
  }

  /** Правый верхний угол, слегка сдвинутый за правый край экрана. */
  private layoutShield(): void {
    const size = this.screenHeight * UI_CONFIG.SHIELD_SIZE_PERCENT;
    const offset = size * SHIELD_EDGE_OFFSET;

    // pivot — центр viewBox, поэтому позиция задаёт центр иконки. По вертикали
    // иконка прижата к верхнему краю (size / 2), по горизонтали — чуть уходит
    // за правый край, чтобы читалась как фоновый элемент, а не как часть HUD.
    this.shieldIcon.scale.set(size / HEROICON_VIEWBOX_SIZE);
    this.shieldIcon.position.set(this.screenWidth - size / 2 + offset, size / 2);
  }
}
