'use client';

import { useEffect, useRef, useState } from "react";
import * as PIXI from 'pixi.js';

export function GameCanvasWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    const app = new PIXI.Application();
    appRef.current = app;

    app.init({
      background: '#1c1c1c',
      resizeTo: containerRef.current,
      antialias: true,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    }).then(() => {
      if (!containerRef.current) return;

      containerRef.current.appendChild(app.canvas);
      setIsInitialized(true);

      // TODO: game loop here

      const graphics = new PIXI.Graphics();
      graphics.circle(app.screen.width / 2, app.screen.height / 2, 50);
      graphics.fill(0x3390ec);
      app.stage.addChild(graphics);
    });

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
        setIsInitialized(false);
      }
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute w-full h-full touch-none"
      style={{ backgroundColor: "var(--tg-theme-bg-color, #1c1c1e)" }}
    >
      {!isInitialized && <div className="absolute inset-0 flex items-center justify-center text-[var(--tg-theme-hint-color, #f3f3f3)]">
        Загрузка...
      </div>}
    </div>
  )
}
