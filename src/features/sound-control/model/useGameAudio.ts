'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useGamePush } from '@/shared/gamepush';
import { audioService } from '@/shared/lib/audio';

import {
  MUSIC_VOLUME_FIELD,
  SAVE_DEBOUNCE_MS,
  SFX_VOLUME_FIELD,
  type VolumeField,
} from './constants';
import { useGameSounds } from './useGameSounds';

export interface UseGameAudioResult {
  /** Музыка заглушена (по SDK). */
  isMusicMuted: boolean;
  /** Звуковые эффекты заглушены (по SDK). */
  isSfxMuted: boolean;
  /** Громкость музыки, 0–100. */
  musicVolume: number;
  /** Громкость эффектов, 0–100. */
  sfxVolume: number;
  /** Переключить музыку через SDK. */
  toggleMusic: () => void;
  /** Переключить звуковые эффекты через SDK. */
  toggleSfx: () => void;
  /** Новое значение громкости музыки: сразу в UI, через 500 мс — в облако. */
  updateMusicVolume: (value: number) => void;
  /** Новое значение громкости эффектов. */
  updateSfxVolume: (value: number) => void;
  /** SDK готов: до этого настройки звука недоступны. */
  isReady: boolean;
}

/** Поля, которые этот хук сохраняет: перебираем их в очистке таймеров. */
const VOLUME_FIELDS: readonly VolumeField[] = [MUSIC_VOLUME_FIELD, SFX_VOLUME_FIELD];

/**
 * Мост «настройки звука → аудио-сервис».
 *
 * Хук нужен, чтобы держать модульный сервис в актуальном состоянии, пока игра
 * смонтирована: попап настроек открывают редко, а звуки из игрового цикла должны
 * замолкать сразу после переключения. Мьют синхронизируется односторонне — из SDK
 * в сервис, потому что обратное направление обошло бы сохранение выбора в SDK.
 *
 * Громкость — другое дело: у `gp.sounds` нет плавного значения, поэтому хук сам
 * пишет его в поля игрока. Запись дебаунсится: перетаскивание ползунка рождает
 * десятки onChange, а `player.sync` — сетевой запрос.
 */
export const useGameAudio = (): UseGameAudioResult => {
  const { gp } = useGamePush();

  const {
    isMusicMuted,
    isSfxMuted,
    musicVolume: sdkMusicVolume,
    sfxVolume: sdkSfxVolume,
    toggleMusic,
    toggleSfx,
    isReady,
  } = useGameSounds();

  // Черновик значения: null — игрок ещё не трогал ползунок, показываем то, что
  // пришло из SDK. Синхронизировать состояние эффектом не нужно, и первый рендер
  // (пока player.ready не разрешён) сразу показывает прочитанное значение.
  const [draftMusicVolume, setDraftMusicVolume] = useState<number | null>(null);
  const [draftSfxVolume, setDraftSfxVolume] = useState<number | null>(null);

  const timersRef = useRef<Partial<Record<VolumeField, number>>>({});
  const pendingRef = useRef<Partial<Record<VolumeField, number>>>({});

  const musicVolume = draftMusicVolume ?? sdkMusicVolume;
  const sfxVolume = draftSfxVolume ?? sdkSfxVolume;

  const flushVolume = useCallback(
    (field: VolumeField) => {
      const value = pendingRef.current[field];

      // Значения нет — сохранять нечего (жест не доходил до этой стадии).
      if (value === undefined) return;

      // SDK ещё не готов: значение остаётся в pendingRef, а не теряется. Эффект
      // ниже допишет его, когда gp появится: попап настроек доступен сразу, и
      // игрок вполне может успеть подвигать ползунок до player.ready.
      if (!gp) return;

      delete pendingRef.current[field];

      try {
        gp.player.set(field, value);

        // Облако GamePush указываем явно: на площадке без своего облака
        // хранилище по умолчанию (preferred) могло бы оказаться неподдерживаемым.
        void gp.player.sync().catch((error: unknown) => {
          console.warn('[sound-control] Не удалось сохранить громкость в облако:', error);
        });
      } catch (error) {
        // Сбой записи не должен ронять настройки: значение остаётся в UI и
        // применится к сервису, просто не переживёт перезапуск.
        console.warn('[sound-control] Не удалось записать громкость в GamePush:', error);
      }
    },
    [gp]
  );

  const scheduleVolumeSave = useCallback(
    (field: VolumeField, value: number) => {
      pendingRef.current[field] = value;

      const timerId = timersRef.current[field];
      if (timerId !== undefined) window.clearTimeout(timerId);

      // Таймер взводится заново на каждое движение: в облако уйдёт только
      // последнее значение, когда игрок отпустил ползунок.
      timersRef.current[field] = window.setTimeout(() => {
        delete timersRef.current[field];
        flushVolume(field);
      }, SAVE_DEBOUNCE_MS);
    },
    [flushVolume]
  );

  const updateMusicVolume = useCallback(
    (value: number) => {
      setDraftMusicVolume(value);
      scheduleVolumeSave(MUSIC_VOLUME_FIELD, value);
    },
    [scheduleVolumeSave]
  );

  const updateSfxVolume = useCallback(
    (value: number) => {
      setDraftSfxVolume(value);
      scheduleVolumeSave(SFX_VOLUME_FIELD, value);
    },
    [scheduleVolumeSave]
  );

  useEffect(() => {
    // Флаг музыки в сервис: отдельный эффект на каждый флаг, чтобы запись одного
    // не зависела от того, менялся ли другой.
    audioService.muteMusic(isMusicMuted);
  }, [isMusicMuted]);

  useEffect(() => {
    audioService.muteSfx(isSfxMuted);
  }, [isSfxMuted]);

  useEffect(() => {
    // В сервис уходит доля 0–1, в UI и полях игрока — проценты.
    audioService.setMusicVolume(musicVolume / 100);
  }, [musicVolume]);

  useEffect(() => {
    audioService.setSfxVolume(sfxVolume / 100);
  }, [sfxVolume]);

  useEffect(() => {
    if (!gp) return;

    // Отложенные значения: игрок подвигал ползунок до готовности SDK, и запись
    // ждала инстанса. Досохраняем сразу, не дожидаясь следующего жеста.
    for (const field of VOLUME_FIELDS) flushVolume(field);
  }, [gp, flushVolume]);

  useEffect(
    () => () => {
      // Закрытие попапа сразу после перетаскивания не должно терять настройку:
      // снимаем таймеры и дописываем последнее значение немедленно.
      for (const field of VOLUME_FIELDS) {
        const timerId = timersRef.current[field];
        if (timerId !== undefined) window.clearTimeout(timerId);

        delete timersRef.current[field];
        flushVolume(field);
      }
    },
    [flushVolume]
  );

  return {
    isMusicMuted,
    isSfxMuted,
    musicVolume,
    sfxVolume,
    toggleMusic,
    toggleSfx,
    updateMusicVolume,
    updateSfxVolume,
    isReady,
  };
};
