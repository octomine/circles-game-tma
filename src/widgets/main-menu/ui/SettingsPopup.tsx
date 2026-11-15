'use client';

import { useEffect } from 'react';
import { MusicalNoteIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { AnimatePresence } from 'motion/react';
import * as motion from 'motion/react-client';
import { useTranslations } from 'next-intl';

import { useGameSounds } from '@/features/sound-control';
import { cn } from '@/shared/lib/cn';
import { Button, Card, Text, Title, Toggle } from '@/shared/ui';

export interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Модальное окно настроек звука.
 *
 * Состояние переключателей приходит из `useGameSounds`, то есть из SDK: попап
 * ничего не хранит сам и не помнит выбор между открытиями — это делает GamePush.
 */
export const SettingsPopup = ({ isOpen, onClose }: SettingsPopupProps) => {
  const tSettings = useTranslations('settings');

  const { isMusicMuted, isSfxMuted, toggleMusic, toggleSfx } = useGameSounds();

  // Включённое состояние — это отсутствие мьюта, поэтому инвертируем ровно здесь,
  // а не в разметке: так положение переключателя и цвет иконки читаются из одного флага.
  const isMusicEnabled = !isMusicMuted;
  const isSfxEnabled = !isSfxMuted;

  useEffect(() => {
    if (!isOpen) return;

    // Esc — привычный способ закрыть модалку; слушатель живёт только пока окно открыто,
    // иначе он перехватывал бы нажатия на других экранах.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Подложка — кнопка, а не div с onClick: у неё есть семантика действия
              и клавиатурная активация. tabIndex={-1} убирает её из обхода по Tab,
              чтобы фокус не уезжал на затемнение мимо содержимого окна. */}
          <button
            type="button"
            tabIndex={-1}
            aria-label={tSettings('close')}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={tSettings('title')}
            className="relative w-full max-w-sm"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <Card className="flex flex-col gap-6 p-6">
              <Title as="h2" className="text-2xl">
                {tSettings('title')}
              </Title>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <MusicalNoteIcon
                      className={cn(
                        'h-6 w-6 transition-colors',
                        isMusicEnabled ? 'text-primary' : 'text-text-muted'
                      )}
                    />
                    <Text className="text-text">{tSettings('music')}</Text>
                  </div>

                  <Toggle
                    checked={isMusicEnabled}
                    onToggle={toggleMusic}
                    label={tSettings('music')}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <SpeakerWaveIcon
                      className={cn(
                        'h-6 w-6 transition-colors',
                        isSfxEnabled ? 'text-primary' : 'text-text-muted'
                      )}
                    />
                    <Text className="text-text">{tSettings('sfx')}</Text>
                  </div>

                  <Toggle checked={isSfxEnabled} onToggle={toggleSfx} label={tSettings('sfx')} />
                </div>
              </div>

              <Button variant="secondary" size="md" className="w-full" onClick={onClose}>
                {tSettings('close')}
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
