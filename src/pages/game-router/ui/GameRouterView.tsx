'use client';

import { type ComponentType } from 'react';

import { GameView } from '@/pages/game';
import { useGameNavigation, type GameScreen } from '@/shared/navigation';
import { GameOverWidget } from '@/widgets/game-over';
import { MainMenuWidget } from '@/widgets/main-menu';

const SCREEN_COMPONENTS: Record<GameScreen, ComponentType> = {
  menu: MainMenuWidget,
  game: GameView,
  gameover: GameOverWidget,
};

export const GameRouterView = () => {
  const { screen } = useGameNavigation();

  const Screen = SCREEN_COMPONENTS[screen];

  return <Screen />;
};
