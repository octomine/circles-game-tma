import { Howl } from 'howler';

/**
 * Описание одного аудио-ассета. Структурный тип, а не импорт из entities:
 * shared не имеет права зависеть от слоя entities, поэтому конфиг приходит
 * аргументом `init` и проверяется здесь по форме.
 */
export interface AudioAssetConfig {
  id: string;
  src: string;
}

/** Конфиг аудио: музыка, набор эффектов и питч для комбо. */
export interface AudioConfig {
  MUSIC: { MAIN: AudioAssetConfig };
  SFX: Record<string, AudioAssetConfig>;
  COMBO_RATES: readonly number[];
}

export interface AudioService {
  /** Создать Howl-объекты по конфигу. Повторный вызов ничего не делает. */
  init: (config: AudioConfig) => void;
  /** Запустить фоновую музыку. Запрос запоминается, чтобы мьют не терял его. */
  playMusic: () => void;
  /** Остановить музыку и забыть запрос на воспроизведение. */
  stopMusic: () => void;
  /** Проиграть эффект по id; `rate` меняет тон (питч) конкретного проигрывания. */
  playSfx: (id: string, rate?: number) => void;
  /** Громкость музыки, 0–1. */
  setMusicVolume: (volume: number) => void;
  /** Громкость эффектов, 0–1. */
  setSfxVolume: (volume: number) => void;
  muteMusic: (muted: boolean) => void;
  muteSfx: (muted: boolean) => void;
  /** Заглушить или вернуть весь звук сразу. */
  muteAll: (muted: boolean) => void;
  /** Выгрузить все Howl и сбросить сервис. */
  destroy: () => void;
}

/** Пределы громкости и питча, которые поддерживает Howler. */
const MIN_VOLUME = 0;
const MAX_VOLUME = 1;
const MIN_RATE = 0.5;
const MAX_RATE = 4;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Состояние живёт в модульных переменных, а не в React-состоянии: звуки нужно
 * запускать и из компонентов, и из игрового цикла PixiJS (`useGameEngine`), где
 * хуков нет. Громкость и мьют применяются и до `init` — значения просто
 * запоминаются и попадают в Howl при создании.
 */
let isInitialized = false;
let musicHowl: Howl | null = null;
let sfxHowls = new Map<string, Howl>();

let musicVolume = MAX_VOLUME;
let sfxVolume = MAX_VOLUME;

let isMusicMuted = false;
let isSfxMuted = false;

/**
 * Запрос на музыку переживает мьют: игрок нажал «Играть» с выключённой музыкой,
 * потом включил её в настройках — трек должен заиграть, а не требовать ещё одного
 * захода в игру.
 */
let isMusicRequested = false;

/** Об id, которого нет в конфиге, предупреждаем один раз, а не на каждый клик. */
const warnedMissingIds = new Set<string>();

const warnLoadError = (id: string) => (soundId: number, error: unknown) => {
  // Отсутствующий файл — штатная ситуация до появления ассетов: игра продолжает
  // работать без звука, поэтому warn, а не throw.
  console.warn(`[audio] Не удалось загрузить звук «${id}»:`, error ?? soundId);
};

/**
 * Громкость и мьют применяются вместе, но раздельно: мьют — это флаг Howl, а не
 * нулевая громкость. Иначе снятие мьюта возвращало бы звук на нуле, и позицию
 * ползунка пришлось бы восстанавливать вручную.
 */
const applyMusicState = () => {
  if (!musicHowl) return;

  musicHowl.volume(musicVolume);
  musicHowl.mute(isMusicMuted);
};

const applySfxState = () => {
  for (const howl of sfxHowls.values()) {
    howl.volume(sfxVolume);
    howl.mute(isSfxMuted);
  }
};

export const audioService: AudioService = {
  init: (config) => {
    // На сервере (статический экспорт) Howl создать нельзя: он работает с Audio
    // и AudioContext. Клиентский эффект вызовет init повторно уже в браузере.
    if (isInitialized || typeof window === 'undefined') return;

    isInitialized = true;

    try {
      musicHowl = new Howl({
        src: [config.MUSIC.MAIN.src],
        // html5: трек длинный, декодировать его целиком в память незачем.
        html5: true,
        loop: true,
        // preload: false — браузер не тянет мегабайты до первого жеста игрока,
        // а загрузка начнётся по play() из обработчика клика.
        preload: false,
        volume: musicVolume,
        mute: isMusicMuted,
        onloaderror: warnLoadError(config.MUSIC.MAIN.id),
      });
    } catch (error) {
      // Сбой конструктора (например, нет Web Audio и html5-режима) не должен
      // ронять игру: остаёмся без музыки, но с работающим геймплеем.
      console.warn('[audio] Музыка недоступна:', error);
      musicHowl = null;
    }

    sfxHowls = new Map();

    for (const asset of Object.values(config.SFX)) {
      try {
        const howl = new Howl({
          src: [asset.src],
          // Эффекты короткие и играются по нескольку раз за раунд — держим их
          // предзагруженными, чтобы клик не ждал сети.
          preload: true,
          volume: sfxVolume,
          mute: isSfxMuted,
          onloaderror: warnLoadError(asset.id),
        });

        sfxHowls.set(asset.id, howl);
      } catch (error) {
        console.warn(`[audio] Эффект «${asset.id}» недоступен:`, error);
      }
    }
  },

  playMusic: () => {
    isMusicRequested = true;

    if (!musicHowl || isMusicMuted) return;

    // Повторный вызов не должен перезапускать трек с начала.
    if (musicHowl.playing()) return;

    try {
      musicHowl.play();
    } catch (error) {
      // Автовоспроизведение заблокировано или файла нет — игра продолжается молча.
      console.warn('[audio] Не удалось запустить музыку:', error);
    }
  },

  stopMusic: () => {
    isMusicRequested = false;

    try {
      musicHowl?.stop();
    } catch (error) {
      console.warn('[audio] Не удалось остановить музыку:', error);
    }
  },

  playSfx: (id, rate) => {
    // Проверка на входе, а не в месте вызова: так ни один вызывающий не сыграет
    // звук в обход настроек игрока.
    if (isSfxMuted) return;

    const howl = sfxHowls.get(id);

    if (!howl) {
      if (!warnedMissingIds.has(id)) {
        warnedMissingIds.add(id);
        console.warn(`[audio] Звук «${id}» отсутствует в конфиге`);
      }

      return;
    }

    try {
      const soundId = howl.play();

      // play() возвращает null, если спрайт не найден; типы Howler объявляют
      // number, поэтому проверяем фактическое значение, а не полагаемся на тип.
      if (rate === undefined || !Number.isFinite(soundId)) return;

      // rate на конкретный soundId, а не на весь Howl: иначе следующий клик
      // унаследовал бы питч предыдущего.
      howl.rate(clamp(rate, MIN_RATE, MAX_RATE), soundId);
    } catch (error) {
      console.warn(`[audio] Не удалось проиграть звук «${id}»:`, error);
    }
  },

  setMusicVolume: (volume) => {
    musicVolume = clamp(volume, MIN_VOLUME, MAX_VOLUME);
    applyMusicState();
  },

  setSfxVolume: (volume) => {
    sfxVolume = clamp(volume, MIN_VOLUME, MAX_VOLUME);
    applySfxState();
  },

  muteMusic: (muted) => {
    isMusicMuted = muted;
    applyMusicState();

    // Мьют не останавливает трек, а глушит его: позиция сохраняется, и снятие
    // мьюта возвращает музыку с того же места. Отдельно дозапускаем её, если
    // запрос был сделан, пока музыка стояла на паузе из-за мьюта.
    if (!muted && isMusicRequested) audioService.playMusic();
  },

  muteSfx: (muted) => {
    isSfxMuted = muted;
    applySfxState();
  },

  muteAll: (muted) => {
    audioService.muteMusic(muted);
    audioService.muteSfx(muted);
  },

  destroy: () => {
    try {
      musicHowl?.unload();
      for (const howl of sfxHowls.values()) howl.unload();
    } catch (error) {
      console.warn('[audio] Ошибка при выгрузке звуков:', error);
    }

    musicHowl = null;
    sfxHowls = new Map();
    isInitialized = false;
    isMusicRequested = false;
    warnedMissingIds.clear();
  },
};
