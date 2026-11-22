/**
 * Аудио-конфиг игры: идентификаторы, пути к ассетам и питч для комбо.
 *
 * Лежит в entities, а не в shared, потому что описывает содержание конкретной игры
 * (какие звуки бывают и как растёт тон за серию), а не механизм воспроизведения.
 * Сам сервис живёт в shared и получает этот объект аргументом `init`, поэтому
 * обратной зависимости shared → entities нет.
 *
 * Ассетов пока нет: пути заглушки. Сервис логирует `console.warn` на ошибке
 * загрузки и продолжает работу, поэтому отсутствие файлов игру не ломает.
 */
export const AUDIO_CONFIG = {
  MUSIC: {
    MAIN: { id: 'music_main', src: '/audio/bgm.ogg' },
  },
  SFX: {
    CLICK: { id: 'sfx_click', src: '/audio/click.ogg' },
    WRONG: { id: 'sfx_wrong', src: '/audio/wrong.ogg' },
    MILESTONE: { id: 'sfx_milestone', src: '/audio/milestone.ogg' },
    SHIELD: { id: 'sfx_shield', src: '/audio/shield.ogg' },
    GAMEOVER: { id: 'sfx_gameover', src: '/audio/gameover.ogg' },
    UI: { id: 'sfx_ui', src: '/audio/ui.ogg' },
  },
  /**
   * Питч звука попадания по индексу комбо: комбо 1 → 1.0, комбо 3 → 1.2 …
   * Верхняя граница 2.0 совпадает с пределом, который поддерживает Howler.
   */
  COMBO_RATES: [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0],
} as const;
