'use client';

import { useCallback, useEffect, useState } from 'react';

import { useGamePush } from '@/shared/gamepush';

export interface UseGameSoundsResult {
  /** Музыка заглушена — по данным SDK, а не по локальному флагу. */
  isMusicMuted: boolean;
  /** Звуковые эффекты заглушены — по данным SDK. */
  isSfxMuted: boolean;
  /** Переключить музыку: команда уходит в SDK, состояние придёт событием. */
  toggleMusic: () => void;
  /** Переключить звуковые эффекты. */
  toggleSfx: () => void;
  /** SDK инициализирован: до этого управлять звуком нечем. */
  isReady: boolean;
}

/**
 * Управление звуком через модуль `gp.sounds` GamePush SDK.
 *
 * Локальное состояние здесь — только копия для рендера. Единственный источник
 * истины — SDK: он сам запоминает выбор игрока между перезагрузками и
 * синхронизирует его с площадкой, поэтому держать мьют в полях игрока или в сторе
 * нельзя — эта копия неизбежно разойдётся с реальным состоянием.
 */
export const useGameSounds = (): UseGameSoundsResult => {
  const { gp, isReady } = useGamePush();

  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);

  // Ссылка на модуль звука: объект живёт вместе с инстансом SDK, поэтому
  // в зависимостях эффекта она стабильна и не переподписывает слушателей.
  const sounds = gp?.sounds ?? null;

  useEffect(() => {
    if (!isReady || !sounds) return;

    // Начальное состояние читаем из SDK, а не из дефолтов useState: к моменту
    // isReady модуль уже восстановил сохранённый выбор игрока из storage.
    setIsMusicMuted(sounds.isMusicMuted);
    setIsSfxMuted(sounds.isSFXMuted);

    // Обработчики объявлены константами, а не инлайн-стрелками: off принимает
    // только ту же ссылку, что получил on. Иначе в очистке окажется новая функция,
    // старая подписка останется в SDK и будет дёргать setState после размонтирования.
    const handleMuteMusic = () => setIsMusicMuted(true);
    const handleUnmuteMusic = () => setIsMusicMuted(false);
    const handleMuteSfx = () => setIsSfxMuted(true);
    const handleUnmuteSfx = () => setIsSfxMuted(false);

    // Глобальный mute площадки (реклама, пауза, кнопка вне игры) не равен выбору
    // игрока, поэтому здесь не угадываем true/false, а перечитываем фактическое
    // состояние из SDK — так UI не покажет неверное положение переключателя.
    const syncFromSdk = () => {
      setIsMusicMuted(sounds.isMusicMuted);
      setIsSfxMuted(sounds.isSFXMuted);
    };

    sounds.on('mute:music', handleMuteMusic);
    sounds.on('unmute:music', handleUnmuteMusic);
    sounds.on('mute:sfx', handleMuteSfx);
    sounds.on('unmute:sfx', handleUnmuteSfx);
    sounds.on('mute', syncFromSdk);
    sounds.on('unmute', syncFromSdk);

    return () => {
      sounds.off('mute:music', handleMuteMusic);
      sounds.off('unmute:music', handleUnmuteMusic);
      sounds.off('mute:sfx', handleMuteSfx);
      sounds.off('unmute:sfx', handleUnmuteSfx);
      sounds.off('mute', syncFromSdk);
      sounds.off('unmute', syncFromSdk);
    };
  }, [isReady, sounds]);

  const toggleMusic = useCallback(() => {
    if (!sounds) return;

    try {
      // Состояние меняем ТОЛЬКО через SDK. Он сохранит выбор, синхронизирует его
      // с площадкой и пришлёт событие, по которому обновится локальная копия.
      // Прямой setIsMusicMuted(!isMusicMuted) здесь разошёлся бы с SDK, если
      // площадка в этот момент глушит звук или метод не сработал.
      if (isMusicMuted) {
        sounds.unmuteMusic();
      } else {
        sounds.muteMusic();
      }
    } catch (error) {
      // Сбой площадки не должен ронять UI настроек: это инфраструктура SDK.
      console.warn('[sound-control] Не удалось переключить музыку:', error);
    }
  }, [sounds, isMusicMuted]);

  const toggleSfx = useCallback(() => {
    if (!sounds) return;

    try {
      if (isSfxMuted) {
        sounds.unmuteSFX();
      } else {
        sounds.muteSFX();
      }
    } catch (error) {
      console.warn('[sound-control] Не удалось переключить звуковые эффекты:', error);
    }
  }, [sounds, isSfxMuted]);

  return { isMusicMuted, isSfxMuted, toggleMusic, toggleSfx, isReady };
};
