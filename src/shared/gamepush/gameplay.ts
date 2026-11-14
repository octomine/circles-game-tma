import { type GamePushInstance } from './GamePushProvider';

/**
 * Открыта ли геймплей-сессия прямо сейчас.
 *
 * Флаг на уровне модуля, а не в компонентах: сигналы зовут четыре разных места
 * (канвас, экран игры, пауза, размонтирование), и только общий флаг держит пару
 * start/stop согласованной. Площадка считает сессию открытой до парного stop,
 * поэтому повторный start завысил бы игровое время, а stop без start — закрыл бы
 * неоткрытую сессию.
 */
let isGameplayActive = false;

/**
 * Начинает геймплей-сессию раунда.
 *
 * Идемпотентна: StrictMode, возврат из паузы и повторный рендер не шлют второй
 * сигнал. Ошибка SDK не всплывает наружу — это инфраструктура площадки, и ронять
 * из-за неё игровой экран нельзя.
 */
export const startGameplay = (gp: GamePushInstance | null): void => {
  if (!gp || isGameplayActive) return;

  isGameplayActive = true;

  try {
    gp.gameplayStart();
  } catch (error) {
    console.warn('[GamePush] gameplayStart не выполнился:', error);
  }
};

/**
 * Завершает геймплей-сессию: game over, пауза или уход с экрана игры.
 * Парная к startGameplay; без открытой сессии ничего не отправляет.
 */
export const stopGameplay = (gp: GamePushInstance | null): void => {
  if (!gp || !isGameplayActive) return;

  isGameplayActive = false;

  try {
    gp.gameplayStop();
  } catch (error) {
    console.warn('[GamePush] gameplayStop не выполнился:', error);
  }
};
