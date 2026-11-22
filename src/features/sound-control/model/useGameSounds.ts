'use client';

import { useCallback, useEffect, useState } from 'react';

import { useGamePush } from '@/shared/gamepush';

import { DEFAULT_VOLUME, MUSIC_VOLUME_FIELD, SFX_VOLUME_FIELD, normalizeVolume } from './constants';

export interface UseGameSoundsResult {
  /** Музыка заглушена — по данным SDK, а не по локальному флагу. */
  isMusicMuted: boolean;
  /** Звуковые эффекты заглушены — по данным SDK. */
  isSfxMuted: boolean;
  /** Громкость музыки в процентах (0–100) из полей игрока. */
  musicVolume: number;
  /** Громкость эффектов в процентах (0–100) из полей игрока. */
  sfxVolume: number;
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
 * истины по мьюту — SDK: он сам запоминает выбор игрока между перезагрузками и
 * синхронизирует его с площадкой, поэтому держать мьют в полях игрока или в сторе
 * нельзя — эта копия неизбежно разойдётся с реальным состоянием.
 *
 * Громкость, наоборот, живёт в полях игрока: у `gp.sounds` есть только «вкл/выкл»,
 * а плавное значение нужно сохранять самому — этим занимается `useGameAudio`.
 */
export const useGameSounds = (): UseGameSoundsResult => {
  const { gp, isReady } = useGamePush();

  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(DEFAULT_VOLUME);
  const [sfxVolume, setSfxVolume] = useState(DEFAULT_VOLUME);

  // Ссылка на модуль звука: объект живёт вместе с инстансом SDK, поэтому
  // в зависимостях эффекта она стабильна и не переподписывает слушателей.
  const sounds = gp?.sounds ?? null;

  useEffect(() => {
    if (!isReady || !sounds || !gp) return;

    // Начальное состояние читаем из SDK, а не из дефолтов useState: к моменту
    // isReady модуль уже восстановил сохранённый выбор игрока из storage.
    setIsMusicMuted(sounds.isMusicMuted);
    setIsSfxMuted(sounds.isSFXMuted);

    // Громкость читаем здесь же: провайдер ставит isReady только после
    // `player.ready`, то есть поля уже синхронизированы с облаком. До этого
    // момента get() вернул бы undefined, и настройка мигнула бы дефолтом.
    try {
      setMusicVolume(normalizeVolume(gp.player.get(MUSIC_VOLUME_FIELD)));
      setSfxVolume(normalizeVolume(gp.player.get(SFX_VOLUME_FIELD)));
    } catch (error) {
      // Недоступное поле или сбой SDK не должны ломать настройки: остаёмся
      // на дефолтах, игра работает со звуком по умолчанию.
      console.warn('[sound-control] Не удалось прочитать громкость из GamePush:', error);
    }

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
  }, [isReady, sounds, gp]);

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

  return {
    isMusicMuted,
    isSfxMuted,
    musicVolume,
    sfxVolume,
    toggleMusic,
    toggleSfx,
    isReady,
  };
};
