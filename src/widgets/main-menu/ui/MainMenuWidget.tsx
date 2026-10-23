'use client';

import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';

import { useGameSessionStore } from '@/entities/game-session';
import { BestScoreDisplay } from '@/entities/player-score';
import { useGameNavigation } from '@/shared/navigation';
import { AnimatedBackground, AnimatedStack, Button, Card, Text, Title } from '@/shared/ui';

export const MainMenuWidget = () => {
  const tMenu = useTranslations('menu');
  const tCommon = useTranslations('common');

  const { setScreen } = useGameNavigation();

  const startGame = useGameSessionStore((state) => state.startGame);

  const handleStartGame = () => {
    // startGame() переводит сессию в 'playing': без него игровой цикл и HUD не запустятся.
    startGame();
    setScreen('game');
  };

  const handleOpenLeaderboard = () => {
    setScreen('leaderboard');
  };

  const handleOpenSettings = () => {
    // TODO: открыть экран настроек, когда он появится в GameScreen.
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        <Button
          variant="icon"
          aria-label={tMenu('settingsLabel')}
          onClick={handleOpenSettings}
          className="absolute top-6 right-6"
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </Button>

        <Title as="h1" className="mb-12 text-center text-5xl md:text-6xl">
          {tMenu('titleFirst')}{' '}
          <span className="from-primary bg-gradient-to-r to-[#EC4899] bg-clip-text text-transparent">
            {tMenu('titleSecond')}
          </span>
        </Title>

        <Card className="mb-12 w-full max-w-xs py-6 text-center">
          <TrophyIcon className="text-gold mx-auto mb-2 h-10 w-10" />
          <Text className="mb-1 text-xs tracking-widest uppercase">{tMenu('bestScoreLabel')}</Text>
          <BestScoreDisplay
            valueOnly
            className="text-text block text-4xl font-black tabular-nums"
          />
        </Card>

        {/* delay=0.2 — кнопки появляются после заголовка и карточки.
            Сами кнопки motion-компоненты со своими variants, поэтому
            каскад подхватывается без дополнительных обёрток. */}
        <AnimatedStack className="flex w-full max-w-xs flex-col gap-4" delay={0.2}>
          <Button variant="primary" size="lg" className="w-full text-xl" onClick={handleStartGame}>
            {tCommon('buttons.play')}
          </Button>

          <Button variant="secondary" size="md" className="w-full" onClick={handleOpenLeaderboard}>
            {tCommon('buttons.leaderboard')}
          </Button>
        </AnimatedStack>
      </div>
    </div>
  );
};
