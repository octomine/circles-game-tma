import { GameCanvasWidget } from "@/widgets/game-canvas/ui/GameCanvasWidget"

export const GameView = () => {
  return (
    <div className="relative w-full h-screen">
      <GameCanvasWidget />
    </div>
  )
}
