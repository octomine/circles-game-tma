import * as PIXI from 'pixi.js';

export interface IHaptics {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
}

export interface UseGameEngineProps {
  appRef: React.RefObject<PIXI.Application | null>;
  isAppReady: boolean;
  haptics: IHaptics | null;
}
