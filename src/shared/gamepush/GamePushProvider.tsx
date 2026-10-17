'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

// Значения проекта из панели GamePush (Настройки проекта).
const PROJECT_ID: number = 31261;
const PUBLIC_TOKEN: string = 'eLjgUwb4xGowhrdI2LcfU1m28J89VCor';

// Плейсхолдер токена: по нему понимаем, что конфиг ещё не заполнен.
const PUBLIC_TOKEN_PLACEHOLDER = 'REPLACE_ME';

// Незаполненный конфиг — SDK не грузим вообще, иначе улетают запросы с несуществующим проектом.
const isConfigured =
  PROJECT_ID > 0 && PUBLIC_TOKEN !== '' && PUBLIC_TOKEN !== PUBLIC_TOKEN_PLACEHOLDER;

// Имя глобального колбэка: SDK ищет его в window по параметру callback из src.
const INIT_CALLBACK_NAME = 'onGPInit';
// id тега скрипта: защита от повторной вставки SDK и удобная очистка.
const SCRIPT_ID = 'gamepush-sdk';

// Зеркала CDN из официального загрузчика GamePush — перебираем до первого доступного.
const SDK_MIRRORS = [
  'https://gs.eponesh.com/sdk/game-score.js',
  'https://s3.gamepush.com/files/gs/sdk/game-score.js',
  'https://s3-eu.gamepush.com/sdk/game-score.js',
  'https://gamepush.com/sdk/game-score.js',
] as const;

// Сколько ждём HEAD-пробы зеркал, прежде чем начать перебор подряд (таймаут из офиц. сниппета).
const MIRROR_PROBE_TIMEOUT_MS = 5000;

/**
 * Хранилище, с которым синхронизируется прогресс игрока.
 * 'cloud' — облако самого GamePush (нужно там, где у площадки нет своего облака).
 */
export type GamePushStorage = 'preferred' | 'cloud' | 'platform' | 'local';

/**
 * Минимальный контракт SDK: внешний скрипт без типов, поэтому описываем только то,
 * что реально используем. По мере надобности расширяем (ads, leaderboard, achievements).
 */
export interface GamePushPlayer {
  /** Промис синхронизации игрока с сервером GamePush. */
  ready: Promise<unknown>;
  /** Значение поля игрока; поля задаются в панели GamePush. */
  get: (key: string) => unknown;
  /** Задать значение поля игрока. */
  set: (key: string, value: number | string | boolean) => void;
  /** Сохранить изменения; без опций используется хранилище из панели GamePush. */
  sync: (options?: { storage?: GamePushStorage; override?: boolean }) => Promise<unknown>;
}

export interface GamePushInstance {
  player: GamePushPlayer;
}

export interface GamePushContextValue {
  gp: GamePushInstance | null;
  isReady: boolean;
}

export const GamePushContext = createContext<GamePushContextValue | null>(null);

// Кэш на уровне модуля: SDK инициализируется один раз на страницу и повторный
// колбэк не вызывает, поэтому готовый инстанс переживает повторный маунт (StrictMode, HMR).
let gamePushInstance: GamePushInstance | null = null;

declare global {
  interface Window {
    /** Колбэк, который GamePush вызывает после инициализации SDK. */
    onGPInit?: (gpInstance: GamePushInstance) => void | Promise<void>;
  }
}

const buildSdkSrc = (mirror: string) =>
  `${mirror}?projectId=${PROJECT_ID}&publicToken=${PUBLIC_TOKEN}&callback=${INIT_CALLBACK_NAME}`;

/**
 * Читаемая реализация официального failover-загрузчика GamePush:
 * сначала HEAD-пробы зеркал, затем загрузка скрипта с первого ответившего;
 * при ошибке конкретного зеркала пробуем следующее.
 * Возвращает функцию очистки.
 */
const loadSdkScript = (onFail: () => void): (() => void) => {
  // Скрипт уже в документе — второй раз не вставляем.
  if (document.getElementById(SCRIPT_ID)) {
    return () => {};
  }

  const controllers: AbortController[] = [];
  const candidates: string[] = []; // порядок попыток: сначала ответившие зеркала
  const tried = new Set<string>();
  let scriptEl: HTMLScriptElement | null = null;
  let pendingProbes: number = SDK_MIRRORS.length;
  let scriptInFlight = false; // тег уже вставлен и ещё не отвалился
  let disposed = false;
  let failedNotified = false;

  const abortProbes = () => {
    controllers.forEach((controller) => controller.abort());
    controllers.length = 0;
  };

  const enqueue = (mirror: string) => {
    if (!candidates.includes(mirror)) candidates.push(mirror);
  };

  const enqueueAll = () => {
    SDK_MIRRORS.forEach(enqueue);
  };

  const notifyFailure = () => {
    if (disposed || failedNotified) return;

    failedNotified = true;
    onFail();
  };

  // Возвращает true, если попытка начата (или загрузка уже идёт).
  const attachNext = (): boolean => {
    if (disposed) return true;
    if (scriptInFlight) return true;

    const mirror = candidates.find((candidate) => !tried.has(candidate));
    if (!mirror) return false;

    tried.add(mirror);
    scriptInFlight = true;

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.dataset.gamepushSdk = 'true';
    script.async = true;
    script.src = buildSdkSrc(mirror);
    // Зеркало не отдало файл — убираем тег и переходим к следующему.
    script.onerror = () => {
      script.remove();
      if (scriptEl === script) scriptEl = null;
      scriptInFlight = false;
      // Пробы к этому моменту могли уже завершиться, поэтому список добиваем целиком.
      enqueueAll();
      if (!attachNext()) notifyFailure();
    };

    scriptEl = script;
    document.body.appendChild(script);
    return true;
  };

  // Пробы зеркал — параллельно, чтобы не терять время на мёртвых CDN.
  SDK_MIRRORS.forEach((mirror) => {
    const controller = new AbortController();
    controllers.push(controller);

    fetch(mirror, { method: 'HEAD', signal: controller.signal })
      .then((response) => {
        if (!response.ok || disposed) return;
        enqueue(mirror);
        attachNext();
      })
      // Недоступное зеркало просто игнорируем — его подхватит перебор.
      .catch(() => {})
      .finally(() => {
        pendingProbes -= 1;
        if (pendingProbes > 0 || scriptInFlight || disposed) return;

        // Ни одно зеркало не ответило (или ответившее уже отвалилось) — пробуем все подряд.
        enqueueAll();
        if (!attachNext()) notifyFailure();
      });
  });

  // Пробы зависли: не ждём их и начинаем перебор зеркал по порядку.
  const probeTimeoutId = window.setTimeout(() => {
    enqueueAll();
    abortProbes();
    if (!attachNext()) notifyFailure();
  }, MIRROR_PROBE_TIMEOUT_MS);

  return () => {
    disposed = true;
    abortProbes();
    window.clearTimeout(probeTimeoutId);
    scriptEl?.remove();
    scriptEl = null;
  };
};

export const GamePushProvider = ({ children }: PropsWithChildren) => {
  const [gp, setGp] = useState<GamePushInstance | null>(gamePushInstance);
  const [isReady, setIsReady] = useState(false);

  const value = useMemo<GamePushContextValue>(() => ({ gp, isReady }), [gp, isReady]);

  useEffect(() => {
    let cancelled = false;

    // Гард: ключи не заменены на реальные — SDK не подключаем, isReady остаётся false.
    if (!isConfigured) {
      console.warn(
        '[GamePush] Укажите реальные projectId и publicToken в src/shared/gamepush/GamePushProvider.tsx — SDK не загружен'
      );

      return () => {
        cancelled = true;
      };
    }

    const handleInit = async (gpInstance: GamePushInstance) => {
      // player.ready — синхронизация игрока с сервером GamePush. Пока промис не разрешён,
      // данные игрока (сохранения, счёт, покупки) ещё не загружены и использовать их нельзя.
      await gpInstance.player.ready;

      // Кэшируем до проверки cancelled: SDK вызывает колбэк лишь однажды,
      // поэтому готовый инстанс должен пережить повторный маунт.
      gamePushInstance = gpInstance;

      if (cancelled) return;

      setGp(gpInstance);
      setIsReady(true);
    };

    // Повторный маунт: скрипт уже загружен, берём закэшированный инстанс вместо новой загрузки.
    if (gamePushInstance) {
      void handleInit(gamePushInstance);

      return () => {
        cancelled = true;
      };
    }

    window[INIT_CALLBACK_NAME] = handleInit;

    const disposeScript = loadSdkScript(() => {
      console.warn('[GamePush] SDK не загрузился ни с одного зеркала');
    });

    return () => {
      cancelled = true;
      disposeScript();
      // Снимаем глобальный колбэк, чтобы не оставлять ссылку на размонтированный компонент.
      delete window[INIT_CALLBACK_NAME];
    };
  }, []);

  return <GamePushContext.Provider value={value}>{children}</GamePushContext.Provider>;
};

export const useGamePush = (): GamePushContextValue => {
  const context = useContext(GamePushContext);

  if (!context) {
    throw new Error('useGamePush must be used within a GamePushProvider');
  }

  return context;
};
