import * as PIXI from 'pixi.js';

export interface UseGameEngineProps {
  appRef: React.RefObject<PIXI.Application | null>;
  isAppReady: boolean;
}
