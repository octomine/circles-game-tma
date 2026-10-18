'use client';

import { useEffect, useRef } from 'react';
import type { Application, Container, Sprite, Texture, Ticker } from 'pixi.js';

const BLUR_STRENGTH = 80; // Сила размытия
const BLOB_ALPHA = 0.32; // Прозрачность пятен
const BLOB_COUNT = 6; // Количество пятен
const PARALLAX_STRENGTH = -0.05; // Сила параллакса от мыши

// Радиус белого круга, из которого один раз запекается текстура пятна.
const BLOB_TEXTURE_RADIUS = 100;
// Размеры спрайтов пятен.
const BLOB_MIN_SIZE = 200;
const BLOB_MAX_SIZE = 500;
// Медленный дрейф в пикселях за миллисекунду (то есть 10-50 px/с).
const BLOB_MIN_SPEED = 0.01;
const BLOB_MAX_SPEED = 0.05;

// Цвета дизайн-системы: синий, красный, зелёный, золотой, розовый.
const BLOB_COLORS = [0x3b82f6, 0xef4444, 0x10b981, 0xfbbf24, 0xec4899];

interface Blob {
  sprite: Sprite;
  velocityX: number;
  velocityY: number;
}

const randomRange = (min: number, max: number): number => min + Math.random() * (max - min);

// Знак задаём отдельно: иначе пятна дрейфовали бы только вправо-вниз.
const randomSignedRange = (min: number, max: number): number =>
  randomRange(min, max) * (Math.random() < 0.5 ? -1 : 1);

/**
 * Декоративный анимированный фон: размытые цветные пятна, медленно дрейфующие
 * по экрану, с параллаксом от курсора.
 *
 * Pixi импортируется динамически внутри useEffect: модуль обращается к window
 * и не должен вычисляться на сервере.
 */
export const AnimatedBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    let isCancelled = false;
    let app: Application | null = null;
    let blobsLayer: Container | null = null;
    let observer: ResizeObserver | null = null;
    let handleMouseMove: ((event: MouseEvent) => void) | null = null;
    let handleTick: ((ticker: Ticker) => void) | null = null;
    let blobTexture: Texture | null = null;
    const blobs: Blob[] = [];

    const setup = async (): Promise<void> => {
      const PIXI = await import('pixi.js');

      const instance = new PIXI.Application();

      await instance.init({
        width: host.clientWidth || window.innerWidth,
        height: host.clientHeight || window.innerHeight,
        antialias: false,
        backgroundAlpha: 0,
        // Фон декоративный, а размытие дорогое: без DPR экономим fill-rate на мобильных.
        resolution: 1,
        autoDensity: false,
      });

      // Размонтировали, пока грузился модуль: приложение нужно погасить здесь же.
      if (isCancelled) {
        instance.destroy(true, { children: true, texture: true });
        return;
      }

      app = instance;
      instance.ticker.maxFPS = 30;

      host.appendChild(instance.canvas);
      instance.canvas.style.width = '100%';
      instance.canvas.style.height = '100%';
      instance.canvas.style.display = 'block';

      // --- Текстура пятна ---
      // Размытие запекается один раз в текстуру: BlurFilter на каждом спрайте
      // в тикере пересчитывался бы 30 раз в секунду и убил бы производительность.
      const blurFilter = new PIXI.BlurFilter({ strength: BLUR_STRENGTH });

      // Фильтр «раздувает» картинку за границы круга. generateTexture берёт
      // границы контейнера и padding фильтра не учитывает, поэтому рисуем круг
      // со смещением и задаём рамку с запасом. Иначе размытие срежется по краю
      // и вместо мягкого пятна получится резкая кромка.
      const padding = blurFilter.padding;
      const textureSize = BLOB_TEXTURE_RADIUS * 2 + padding * 2;

      const circle = new PIXI.Graphics()
        .circle(BLOB_TEXTURE_RADIUS + padding, BLOB_TEXTURE_RADIUS + padding, BLOB_TEXTURE_RADIUS)
        .fill(0xffffff);
      circle.filters = [blurFilter];

      const texture = instance.renderer.generateTexture({
        target: circle,
        frame: new PIXI.Rectangle(0, 0, textureSize, textureSize),
      });

      circle.destroy();
      blobTexture = texture;

      // --- Спрайты пятен ---
      const layer = new PIXI.Container();
      instance.stage.addChild(layer);
      blobsLayer = layer;

      for (let index = 0; index < BLOB_COUNT; index += 1) {
        const sprite = new PIXI.Sprite(texture);
        const size = randomRange(BLOB_MIN_SIZE, BLOB_MAX_SIZE);

        sprite.anchor.set(0.5);
        sprite.width = size;
        sprite.height = size;
        sprite.alpha = BLOB_ALPHA;
        sprite.tint = BLOB_COLORS[index % BLOB_COLORS.length];
        sprite.x = Math.random() * instance.screen.width;
        sprite.y = Math.random() * instance.screen.height;

        layer.addChild(sprite);
        blobs.push({
          sprite,
          velocityX: randomSignedRange(BLOB_MIN_SPEED, BLOB_MAX_SPEED),
          velocityY: randomSignedRange(BLOB_MIN_SPEED, BLOB_MAX_SPEED),
        });
      }

      // --- Дрейф ---
      // deltaMS делает движение независимым от частоты кадров.
      handleTick = (ticker: Ticker) => {
        const delta = ticker.deltaMS;
        const screenWidth = instance.screen.width;
        const screenHeight = instance.screen.height;

        for (const blob of blobs) {
          const { sprite } = blob;
          const half = sprite.width / 2;

          sprite.x += blob.velocityX * delta;
          sprite.y += blob.velocityY * delta;

          // Ушло за край — телепортируем на противоположную сторону.
          if (sprite.x - half > screenWidth) {
            sprite.x = -half;
          } else if (sprite.x + half < 0) {
            sprite.x = screenWidth + half;
          }

          if (sprite.y - half > screenHeight) {
            sprite.y = -half;
          } else if (sprite.y + half < 0) {
            sprite.y = screenHeight + half;
          }
        }
      };
      instance.ticker.add(handleTick);

      // --- Параллакс ---
      // TODO: Добавить поддержку акселерометра (DeviceOrientation) для мобильных устройств.
      handleMouseMove = (event: MouseEvent) => {
        layer.x = (event.clientX - window.innerWidth / 2) * PARALLAX_STRENGTH;
      };
      window.addEventListener('mousemove', handleMouseMove);

      // --- Ресайз ---
      observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        const { width, height } = entry.contentRect;

        if (width > 0 && height > 0) {
          instance.renderer.resize(width, height);
        }
      });
      observer.observe(host);
    };

    void setup().catch((error: unknown) => {
      console.error('AnimatedBackground: не удалось запустить PixiJS', error);
    });

    return () => {
      isCancelled = true;

      if (handleMouseMove) {
        window.removeEventListener('mousemove', handleMouseMove);
      }

      observer?.disconnect();

      if (app) {
        if (handleTick) {
          app.ticker.remove(handleTick);
        }

        app.ticker.stop();
      }

      blobsLayer?.removeChildren();

      // Спрайты уничтожаем без текстуры: она у них общая, ниже её уничтожаем один раз.
      for (const blob of blobs) {
        blob.sprite.destroy();
      }
      blobs.length = 0;

      blobTexture?.destroy(true);
      blobTexture = null;

      app?.destroy(true, { children: true, texture: true });
      app = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full overflow-hidden"
    />
  );
};
