'use client';

import { useEffect } from 'react';
import { MusicalNoteIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { AnimatePresence } from 'motion/react';
import * as motion from 'motion/react-client';
import { useTranslations } from 'next-intl';

import { useGameAudio } from '@/features/sound-control';
import { Button, Card, Text, Title, VolumeSlider } from '@/shared/ui';

export interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Модальное окно настроек звука.
 *
 * Мьют приходит из `useGameSounds`, то есть из SDK: попап ничего не хранит сам и
 * не помнит выбор между открытиями — это делает GamePush. Громкость — поля игрока
 * в облаке; запись дебаунсится внутри `useGameAudio`, поэтому ползунок можно
 * свободно тянуть, а в сеть уйдёт только итоговое значение.
 */
export const SettingsPopup = ({ isOpen, onClose }: SettingsPopupProps) => {
  const tSettings = useTranslations('settings');

  const {
    isMusicMuted,
    isSfxMuted,
    musicVolume,
    sfxVolume,
    toggleMusic,
    toggleSfx,
    updateMusicVolume,
    updateSfxVolume,
  } = useGameAudio();

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

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Text className="text-text">{tSettings('music')}</Text>
                    {/* Процент дублирует положение ползунка словами: у треугольника
                        без бегунка точное значение на глаз не прочитать. */}
                    <Text className="text-text-muted text-sm tabular-nums">{musicVolume}%</Text>
                  </div>

                  <VolumeSlider
                    value={musicVolume}
                    onChange={updateMusicVolume}
                    isMuted={isMusicMuted}
                    onToggleMute={toggleMusic}
                    icon={<MusicalNoteIcon className="h-6 w-6" />}
                    label={tSettings('music')}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Text className="text-text">{tSettings('sfx')}</Text>
                    <Text className="text-text-muted text-sm tabular-nums">{sfxVolume}%</Text>
                  </div>

                  <VolumeSlider
                    value={sfxVolume}
                    onChange={updateSfxVolume}
                    isMuted={isSfxMuted}
                    onToggleMute={toggleSfx}
                    icon={<SpeakerWaveIcon className="h-6 w-6" />}
                    label={tSettings('sfx')}
                  />
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
