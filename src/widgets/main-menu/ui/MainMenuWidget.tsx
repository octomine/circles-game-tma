'use client';

import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { TrophyIcon } from '@heroicons/react/24/solid';
import * as motion from 'motion/react-client';
import { useTranslations } from 'next-intl';

import { useGameSessionStore } from '@/entities/game-session';
import { BestScoreDisplay } from '@/entities/player-score';
import { useGameNavigation } from '@/shared/navigation';
import { AnimatedStack, AnimatedText, Button, Card, Text, Title } from '@/shared/ui';

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

        {/* Заголовок — два AnimatedText, слова появляются друг за другом (0.1 → 0.3 с).
            Классы размера продублированы на h1 осознанно: пробел между словами — это
            обычный текстовый узел внутри h1, и его ширину задаёт шрифт h1, а не
            контейнеров слов; без дублирования промежуток был бы в размер text-3xl от Title. */}
        <Title as="h1" className="mb-12 text-center text-5xl md:text-6xl">
          <AnimatedText
            text={tMenu('titleFirst')}
            delay={0.1}
            className="text-5xl font-black text-white md:text-6xl"
          />{' '}
          <AnimatedText
            text={tMenu('titleSecond')}
            delay={0.3}
            className="text-5xl font-black text-white md:text-6xl"
          />
        </Title>

        {/* delay 0.5s — карточка появляется после того, как заголовок доиграет свой
            каскад (0.1 + буквы + 0.3 + буквы ≈ 0.55 с), но раньше кнопок
            (у AnimatedStack delay 0.6): так выстраивается ритм сверху вниз.
            Классы раскладки (mb-12 w-full max-w-xs) переехали на обёртку: в
            колоночном flex-контейнере с items-center ширину задаёт flex-элемент,
            и внутри обёртки без ширины w-full у Card выродился бы в auto —
            карточка сжалась бы по содержимому. */}
        <motion.div
          className="mb-12 w-full max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
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

        {/* delay=0.6 — кнопки появляются после заголовка и карточки.
            Сами кнопки motion-компоненты со своими variants, поэтому
            каскад подхватывается без дополнительных обёрток. */}
        <AnimatedStack className="flex w-full max-w-xs flex-col gap-4" delay={0.6}>
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
