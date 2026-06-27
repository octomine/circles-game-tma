import * as PIXI from 'pixi.js';
import { RefObject } from 'react';

export interface IHaptics {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
}

export interface UseGameEngineProps {
  appRef: RefObject<PIXI.Application | null>;
  isAppReady: boolean;
  haptics: IHaptics | null;
}

// Расширяем стандартные классы PixiJS для хранения наших данных
export interface GameCircle extends PIXI.Graphics {
  colorHex: string;
  isActive: boolean;
  lifetime: number; // Максимальное время жизни
  age: number; // Текущий возраст
}

export interface Particle extends PIXI.Graphics {
  velocity: { x: number; y: number };
  life: number;
}
