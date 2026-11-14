/**
 * Аудио-сервис игры.
 *
 * Состояние звука живёт в модульной переменной, а не в React-состоянии, потому что
 * проигрывать звуки нужно и из React-компонентов, и из игрового цикла PixiJS
 * (`useGameEngine`), где хуков нет. Источник истины при этом остаётся за SDK:
 * флаги сюда попадают из `useGameSounds`, а тот читает их у `gp.sounds`.
 *
 * Пока звуковых ассетов нет, функции воспроизведения только логируют вызов —
 * инфраструктура готова, останется подменить тела на `Howl` / `PIXI.sound`.
 */
export interface AudioService {
  /** Синхронизировать флаг музыки из SDK. */
  setMusicMuted: (muted: boolean) => void;
  /** Синхронизировать флаг звуковых эффектов из SDK. */
  setSfxMuted: (muted: boolean) => void;
  /** Проиграть эффект по имени; при заглушённых эффектах вызов игнорируется. */
  playSfx: (name: string) => void;
  /** Запустить фоновую музыку; при заглушённой музыке вызов игнорируется. */
  playMusic: () => void;
  /** Остановить фоновую музыку. */
  stopMusic: () => void;
}

// Флаги на уровне модуля: значение одно на всю игру, а не на компонент.
let isMusicMuted = false;
let isSfxMuted = false;

export const audioService: AudioService = {
  setMusicMuted: (muted: boolean) => {
    isMusicMuted = muted;
  },

  setSfxMuted: (muted: boolean) => {
    isSfxMuted = muted;
  },

  playSfx: (name: string) => {
    // Проверка на входе, а не в месте вызова: так ни один вызывающий не сыграет
    // звук в обход настроек игрока.
    if (isSfxMuted) return;

    // TODO: заменить на Howl / PIXI.sound, когда появятся звуковые ассеты.
    console.log('[audio] playSfx:', name);
  },

  playMusic: () => {
    if (isMusicMuted) return;

    // TODO: заменить на Howl / PIXI.sound с зацикленным треком.
    console.log('[audio] playMusic');
  },

  stopMusic: () => {
    // TODO: остановка текущего трека; пока останавливать нечего.
  },
};
