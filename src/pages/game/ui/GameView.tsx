import { GameCanvasWidget } from '@/widgets/game-canvas';
import { GameHUDWidget } from '@/widgets/game-hud';

export const GameView = () => {
  return (
    <div className="relative h-screen w-full">
      <GameCanvasWidget />
      <GameHUDWidget />
    </div>
  );
};
