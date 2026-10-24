'use client';

import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { TrophyIcon } from '@heroicons/react/24/solid';
import * as motion from 'motion/react-client';
import { useTranslations } from 'next-intl';

import { useGameSessionStore } from '@/entities/game-session';
import { BestScoreDisplay } from '@/entities/player-score';
import { useGameNavigation } from '@/shared/navigation';
import { AnimatedStack, Button, Card, Text, Title } from '@/shared/ui';

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

  // Фон (AnimatedBackground) живёт в GameRouterView: сам экран прозрачный,
  // иначе он перекрыл бы PixiJS-слой.
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        <Button
          variant="icon"
          aria-label={tMenu('settingsLabel')}
          onClick={handleOpenSettings}
          className="absolute top-6 right-6"
        >
          {/* Вращение вешаем на иконку, а не на кнопку: у Button уже есть свой
              whileHover (scale), и два whileHover на одном элементе перетирали бы
              друг друга. Элементы разные — scale и rotate не конфликтуют.
              motion.div, а не span: transform не применяется к inline-элементам. */}
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </motion.div>
        </Button>

        <Title as="h1" className="mb-12 text-center text-5xl md:text-6xl">
          {tMenu('titleFirst')}{' '}
          <span className="from-primary bg-gradient-to-r to-[#EC4899] bg-clip-text text-transparent">
            {tMenu('titleSecond')}
          </span>
        </Title>

        {/* delay 0.1s — карточка появляется сразу после заголовка, но раньше кнопок
            (у AnimatedStack delay 0.2): так выстраивается ритм сверху вниз.
            Классы раскладки (mb-12 w-full max-w-xs) переехали на обёртку: в
            колоночном flex-контейнере с items-center ширину задаёт flex-элемент,
            и внутри обёртки без ширины w-full у Card выродился бы в auto —
            карточка сжалась бы по содержимому. */}
        <motion.div
          className="mb-12 w-full max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
        >
          <Card className="py-6 text-center">
            <TrophyIcon className="text-gold mx-auto mb-2 h-10 w-10" />
            <Text className="mb-1 text-xs tracking-widest uppercase">
              {tMenu('bestScoreLabel')}
            </Text>
            <BestScoreDisplay
              valueOnly
              className="text-text block text-4xl font-black tabular-nums"
            />
          </Card>
        </motion.div>

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
