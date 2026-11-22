/**
 * Ключи полей игрока GamePush и границы громкости.
 *
 * Поля объявлены в панели GamePush (`musicVolume`, `sfxVolume`, тип «число»).
 * Читает их `useGameSounds`, пишет `useGameAudio`, поэтому ключи живут в одном
 * месте: разойдись они — настройка сохранялась бы в одно поле, а читалась из другого.
 */
export const MUSIC_VOLUME_FIELD = 'musicVolume';
export const SFX_VOLUME_FIELD = 'sfxVolume';

/** Поле игрока, в котором хранится громкость. */
export type VolumeField = typeof MUSIC_VOLUME_FIELD | typeof SFX_VOLUME_FIELD;

/** Громкость в процентах: ползунок и UI работают в 0–100, сервис — в 0–1. */
export const MIN_VOLUME = 0;
export const MAX_VOLUME = 100;

/** Значение по умолчанию для игрока, у которого поля ещё нет. */
export const DEFAULT_VOLUME = 100;

/** Пауза перед записью в облако: drag по ползунку рождает десятки значений. */
export const SAVE_DEBOUNCE_MS = 500;

const clampVolume = (value: number): number => Math.min(Math.max(value, MIN_VOLUME), MAX_VOLUME);

/**
 * Приводит значение поля SDK к процентам 0–100.
 *
 * SDK отдаёт `unknown`: поле может отсутствовать (undefined), прийти строкой из
 * облака или быть испорченным. Любое нечисловое значение превращается в дефолт,
 * иначе NaN уехал бы в Howler и заглушил звук.
 */
export const normalizeVolume = (value: unknown): number => {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(numeric)) return DEFAULT_VOLUME;

  return clampVolume(Math.round(numeric));
};
