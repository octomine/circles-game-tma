import { GameCanvasWidget } from '@/widgets/game-canvas';

export const GameView = () => {
  return (
    <div className="relative h-screen w-full">
      <GameCanvasWidget />
    </div>
  );
};
