import { create } from 'zustand';

import type { GameEvent, GameSessionState } from '../types/gameSessionStore.types';
import { AUDIO_CONFIG } from '../config/audioConfig';
import { GAME_CONFIG } from '../config/constants';
import {
  COMBO_CONFIG,
  getComboMilestone,
  getComboMultiplier,
  type ComboMilestone,
} from '../config/comboConfig';
import { UI_CONFIG } from '../config/uiConfig';

import { getDefaultGameData } from './defaults';

// Тип объявлен в types (стор его импортирует, поэтому объявление здесь дало бы
// цикл store ↔ types), а реэкспорт держит его доступным «из стора», как в ТЗ.
export type { GameEvent } from '../types/gameSessionStore.types';

/**
 * Идентификатор события.
 *
 * Счётчик, а не `crypto.randomUUID()`: id нужен только для удаления из очереди,
 * а UUID доступен лишь в secure context — при отладке по http на LAN-адресе
 * игра должна работать так же.
 */
let lastEventId = 0;

const nextEventId = (): string => {
  lastEventId += 1;
  return `event-${lastEventId}`;
};

/**
 * Текст сообщения на веху комбо.
 *
 * Только бонусы, которые игрок видит в HUD: `slowdown` и `all` пока не
 * реализованы, и сообщение о них было бы обещанием без механики.
 */
const MILESTONE_MESSAGE_TEXT: Partial<Record<ComboMilestone, string>> = {
  shield: '🛡️',
  extraLife: '❤️',
};

/**
 * Питч звука попадания по длине комбо.
 *
 * Индекс ограничен длиной таблицы: за её пределами тон остаётся максимальным,
 * иначе комбо 15 дало бы `undefined` в `rate()` и Howler молча ничего не сыграл бы.
 */
const getComboRate = (combo: number): number => {
  const rates = AUDIO_CONFIG.COMBO_RATES;
  const index = Math.min(Math.max(combo, 1), rates.length) - 1;

  return rates[index];
};

/**
 * Количество сообщений с текстом в очереди.
 *
 * Задержка вехи считается по ним, а не по длине очереди: событие «только звук»
 * тоже лежит в `pendingEvents`, и оно сдвигало бы появление текста на лишние
 * MESSAGE_DELAY_MS, хотя визуально ничего не рисует.
 */
const countPendingMessages = (events: GameEvent[]): number =>
  events.filter((event) => event.type === 'SPAWN_MESSAGE' && event.text !== undefined).length;

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  ...getDefaultGameData(),

  gameOver: () =>
    // Переход только из 'playing': повторный вызов из тикера и смена статуса после
    // паузы не должны перезаписывать уже выставленный результат.
    set((state) => (state.status === 'playing' ? { status: 'gameover' } : state)),

  startGame: () => {
    const defaults = getDefaultGameData();
    const randomColor = GAME_CONFIG.COLORS[Math.floor(Math.random() * GAME_CONFIG.COLORS.length)];

    set({
      ...defaults,
      status: 'playing',
      targetColor: randomColor,
    });
  },

  addScore: (points) => set((state) => ({ score: state.score + points })),

  loseLife: () =>
    set((state) => {
      const newLives = state.lives - 1;
      return { lives: newLives };
    }),

  changeTargetColor: () => {
    const currentColor = get().targetColor;
    const available = GAME_CONFIG.COLORS.filter((c) => c !== currentColor);
    const newColor = available[Math.floor(Math.random() * available.length)];

    set({
      targetColor: newColor,
      timeToNextColor: GAME_CONFIG.TIME_TO_CHANGE_COLOR_MS,
    });
  },

  tickTime: (dt) =>
    set((state) => {
      if (state.status !== 'playing') return state;

      // Игровое время копится только при активной игре. Движок не зовёт tickTime
      // во время заморозки за промах и на паузе, поэтому там gameTime замирает —
      // именно из-за этого интервалы комбо считаются по нему, а не по Date.now().
      const gameTime = state.gameTime + dt;
      const newTime = state.timeToNextColor - dt;

      // --- Таймаут комбо ---
      //
      // Сброс живёт здесь, а не в processCorrectClick, потому что окно комбо —
      // величина ВРЕМЕННАЯ, а время прибывает только в tickTime. Если игрок
      // перестал кликать, processCorrectClick больше не вызовется вообще, и серия
      // осталась бы «живой» (с множителем) до следующего тапа, хотя окно уже
      // закрыто. Тикер же зовётся каждый кадр, поэтому он единственное место,
      // где сброс происходит в реальном времени.
      let combo = state.combo;
      let lastInterval = state.lastInterval;
      let lastClickGameTime = state.lastClickGameTime;
      let intervalHistory = state.intervalHistory;

      if (lastClickGameTime !== null) {
        const elapsed = gameTime - lastClickGameTime;

        // lastInterval === 0 означает «эталона ещё нет» — так его ставит первый
        // клик (см. processCorrectClick). Поэтому 0 через || превращается в
        // MAX_INTERVAL: та же формула, что и в ComboHistogram, иначе стор и порог
        // покраснения активного столбца разошлись бы.
        const limit = lastInterval || COMBO_CONFIG.MAX_INTERVAL;

        if (elapsed >= limit) {
          // Окно закрылось: следующий клик уже не может быть ускорением
          // (interval > limit >= limit - MIN_DIFF), значит множитель держать
          // не за что. Чистим и опорную точку, и историю: для гистограммы
          // lastClickGameTime === null — сигнал скрыть активный столбец и
          // остановить rAF, а пустая история убирает завершённые столбцы.
          combo = 0;
          lastInterval = null;
          lastClickGameTime = null;
          intervalHistory = [];
        }
      }

      if (newTime <= 0) {
        const available = GAME_CONFIG.COLORS.filter((c) => c !== state.targetColor);
        const newColor = available[Math.floor(Math.random() * available.length)];

        return {
          gameTime,
          combo,
          lastInterval,
          lastClickGameTime,
          intervalHistory,
          timeToNextColor: GAME_CONFIG.TIME_TO_CHANGE_COLOR_MS,
          targetColor: newColor,
        };
      }

      return {
        gameTime,
        combo,
        lastInterval,
        lastClickGameTime,
        intervalHistory,
        timeToNextColor: newTime,
      };
    }),

  processCorrectClick: (x, y) =>
    set((state) => {
      const { gameTime, combo, lastClickGameTime, lastInterval, intervalHistory } = state;

      let nextCombo: number;
      let nextLastInterval: number;
      let nextIntervalHistory: number[];

      if (lastClickGameTime === null) {
        // Первый клик: опорной точки ещё нет, интервал считать не из чего.
        // lastInterval = 0, а не null: иначе на втором клике ветка «lastInterval === null»
        // перехватила бы анти-спам. История пустая — пустого столбца в гистограмме не будет.
        nextCombo = 1;
        nextLastInterval = 0;
        nextIntervalHistory = [];
      } else {
        const interval = Math.max(gameTime - lastClickGameTime, 0);

        if (interval > COMBO_CONFIG.MAX_INTERVAL || lastInterval === null) {
          // Слишком долгая пауза между кликами — серия начинается заново,
          // но интервал становится новым эталоном для сравнения.
          nextCombo = 1;
          nextLastInterval = interval;
          nextIntervalHistory = [interval];
        } else if (interval < COMBO_CONFIG.MIN_CLICK_INTERVAL) {
          // Анти-спам: клик слишком частый, для комбо его игнорируем, а эталон
          // и историю не трогаем — иначе спам «подтягивал» бы эталон к нулю.
          nextCombo = combo;
          nextLastInterval = lastInterval;
          nextIntervalHistory = intervalHistory;
        } else if (interval < lastInterval - COMBO_CONFIG.MIN_DIFF) {
          // Клик заметно быстрее предыдущего — серия растёт.
          nextCombo = combo + 1;
          nextLastInterval = interval;
          nextIntervalHistory = [...intervalHistory, interval];
        } else {
          // Замедление: ускорения нет, серия сбрасывается.
          nextCombo = 1;
          nextLastInterval = interval;
          nextIntervalHistory = [interval];
        }
      }

      const points = COMBO_CONFIG.POINTS_BASE * getComboMultiplier(nextCombo);

      // Веха: начисляем один раз за партию. 'slowdown' и 'all' пока только
      // фиксируются — механики слоудауна в игре ещё нет.
      const milestone = getComboMilestone(nextCombo);
      const isNewMilestone = milestone !== null && !state.milestonesHit.includes(nextCombo);

      let nextLives = state.lives;
      let nextHasShield = state.hasShield;

      if (isNewMilestone) {
        if (milestone === 'extraLife') {
          nextLives = Math.min(state.lives + 1, GAME_CONFIG.MAX_LIVES);
        }

        if (milestone === 'shield') {
          nextHasShield = true;
        }
      }

      // Сообщение о вехе уходит в очередь событий, а не рисуется прямо здесь:
      // стор ничего не знает про PixiJS, а движок вычитывает очередь в тикере.
      const milestoneText =
        isNewMilestone && milestone !== null ? MILESTONE_MESSAGE_TEXT[milestone] : undefined;

      // Звук попадания — отдельным событием на КАЖДЫЙ клик: текст ему не нужен,
      // но тон (rate) растёт вместе с комбо, а вычисляет его стор, который знает
      // актуальную серию. Движок только проигрывает то, что здесь названо.
      const clickEvent: GameEvent = {
        id: nextEventId(),
        type: 'SPAWN_MESSAGE',
        x,
        y,
        delay: 0,
        sfx: AUDIO_CONFIG.SFX.CLICK.id,
        rate: getComboRate(nextCombo),
      };

      // Задержка = число уже стоящих в очереди сообщений * MESSAGE_DELAY_MS:
      // пачка текстов, рождённая одним апдейтом, проявится по очереди. Отдельного
      // executeAt нет намеренно: очередь вычитывается в ближайшем кадре, поэтому
      // момент «когда применить» уже задан кадровой границей, а разнос по времени —
      // забота самого FloatingMessage. Один таймер в одном месте вместо двух.
      const milestoneEvent: GameEvent | null = milestoneText
        ? {
            id: nextEventId(),
            type: 'SPAWN_MESSAGE',
            x,
            y,
            text: milestoneText,
            delay: countPendingMessages(state.pendingEvents) * UI_CONFIG.MESSAGE_DELAY_MS,
            sfx: AUDIO_CONFIG.SFX.MILESTONE.id,
          }
        : null;

      const pendingEvents: GameEvent[] = milestoneEvent
        ? [...state.pendingEvents, clickEvent, milestoneEvent]
        : [...state.pendingEvents, clickEvent];

      // Всё пишем одним обновлением: счёт, жизни и комбо должны меняться вместе,
      // иначе подписчики успели бы увидеть промежуточное состояние.
      return {
        combo: nextCombo,
        lastClickGameTime: gameTime,
        lastInterval: nextLastInterval,
        intervalHistory: nextIntervalHistory,
        score: state.score + points,
        lives: nextLives,
        hasShield: nextHasShield,
        milestonesHit: isNewMilestone ? [...state.milestonesHit, nextCombo] : state.milestonesHit,
        pendingEvents,
      };
    }),

  processWrongClick: (x, y) => {
    const { hasShield, lives, pendingEvents } = get();

    // Щит гасит промах целиком: ни жизни, ни комбо не теряем, но сам щит
    // сгорает. shielded: true говорит движку, что промах уже оплачен щитом —
    // значит, ни разбитого сердца, ни заморозки быть не должно.
    if (hasShield) {
      set({
        hasShield: false,
        pendingEvents: [
          ...pendingEvents,
          {
            id: nextEventId(),
            type: 'WRONG_CLICK',
            x,
            y,
            shielded: true,
            delay: 0,
            // Щит — не наказание: мягкий звук интерфейса вместо тревожного
            // промаха, чтобы игрок услышал, что защита сработала.
            sfx: AUDIO_CONFIG.SFX.SHIELD.id,
          },
        ],
      });
      return;
    }

    // Промах без щита: комбо и опорные точки сбрасываются, жизнь снимается —
    // всё одним обновлением, чтобы подписчики не увидели промежуточное состояние.
    // Отдельный loseLife() убрал бы обновление стора на два, и часть UI успела
    // бы отрисоваться с новыми жизнями, но со старым комбо.
    //
    // Статус здесь НЕ переводится в 'gameover' даже при lives === 0, и это
    // осознанный инвариант: тикер останавливается сразу, как только статус
    // перестал быть 'playing', поэтому событие WRONG_CLICK осталось бы в очереди
    // необработанным — смертельный промах прошёл бы без разбитого сердца, звука
    // и заморозки. Переход делает движок (gameOver()) после LOSE_LIFE_FREEZE_MS,
    // когда наказание уже отыграно.
    set({
      combo: 0,
      lastInterval: null,
      lastClickGameTime: null,
      intervalHistory: [],
      lives: lives - 1,
      pendingEvents: [
        ...pendingEvents,
        {
          id: nextEventId(),
          type: 'WRONG_CLICK',
          x,
          y,
          shielded: false,
          delay: 0,
          sfx: AUDIO_CONFIG.SFX.WRONG.id,
        },
      ],
    });
  },

  consumeEvent: (id) =>
    set((state) => ({
      pendingEvents: state.pendingEvents.filter((event) => event.id !== id),
    })),

  // Пауза не трогает комбо и таймеры: gameTime и так стоит (tickTime не зовётся),
  // а серия сохраняется — переключение вкладки в Telegram не должно её обнулять.
  pauseGame: () => set((state) => (state.status === 'playing' ? { status: 'paused' } : state)),

  resumeGame: () => set((state) => (state.status === 'paused' ? { status: 'playing' } : state)),

  reset: () => set(getDefaultGameData()),
}));
