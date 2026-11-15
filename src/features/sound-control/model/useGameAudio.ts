'use client';

import { useEffect } from 'react';

import { audioService } from './audio-service';
import { useGameSounds } from './useGameSounds';

export interface UseGameAudioResult {
  /** Музыка заглушена (по SDK). */
  isMusicMuted: boolean;
  /** Звуковые эффекты заглушены (по SDK). */
  isSfxMuted: boolean;
  /** Переключить музыку через SDK. */
  toggleMusic: () => void;
  /** Переключить звуковые эффекты через SDK. */
  toggleSfx: () => void;
  /** SDK готов: до этого настройки звука недоступны. */
  isReady: boolean;
  /** Проиграть звуковой эффект; игнорируется, если эффекты заглушены. */
  playSfx: (name: string) => void;
  /** Запустить музыку; игнорируется, если музыка заглушена. */
  playMusic: () => void;
  /** Остановить музыку. */
  stopMusic: () => void;
}

/**
 * Мост «настройки звука → аудио-сервис».
 *
 * Хук нужен, чтобы держать модульный сервис в актуальном состоянии, пока игра
 * смонтирована: попап настроек открывают редко, а звуки из игрового цикла должны
 * замолкать сразу после переключения. Синхронизация односторонняя — из SDK в
 * сервис, потому что обратное направление обошло бы сохранение выбора в SDK.
 */
export const useGameAudio = (): UseGameAudioResult => {
  const { isMusicMuted, isSfxMuted, toggleMusic, toggleSfx, isReady } = useGameSounds();

  useEffect(() => {
    // Флаг музыки в сервис: отдельный эффект на каждый флаг, чтобы запись одного
    // не зависела от того, менялся ли другой.
    audioService.setMusicMuted(isMusicMuted);
  }, [isMusicMuted]);

  useEffect(() => {
    audioService.setSfxMuted(isSfxMuted);
  }, [isSfxMuted]);

  // Функции берём прямо из модуля: они стабильны между рендерами и не требуют
  // useCallback — сервис не привязан к жизненному циклу компонента.
  return {
    isMusicMuted,
    isSfxMuted,
    toggleMusic,
    toggleSfx,
    isReady,
    playSfx: audioService.playSfx,
    playMusic: audioService.playMusic,
    stopMusic: audioService.stopMusic,
  };
};
