'use client';

import { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import * as motion from 'motion/react-client';

import { useToastStore, type ToastComponent, type ToastData } from '@/shared/lib/toast';

import { GameOverToast } from './toasts';

/**
 * Реестр компонентов тостов: единственная точка расширения системы.
 *
 * Store и ToastManager не знают ни одного конкретного типа — они работают с
 * `type: string` и этим словарём. Чтобы добавить тост, достаточно создать
 * компонент в `./toasts`, экспортировать его оттуда и дописать сюда одну строку:
 * ни стор, ни менеджер, ни экран-хозяин править не нужно.
 *
 * Каст нужен ровно один и только для узкого payload: `GameOverToast` типизирует
 * свои пропсы как `ToastData<{ score: number }>`, а реестр хранит обезличенный
 * `ToastData`. При `strictFunctionTypes` пропсы контравариантны, поэтому узкий
 * тип не присваивается обезличенному автоматически. Каст локализован здесь,
 * вместо того чтобы размывать тип payload по всему стору.
 */
const TOAST_COMPONENTS: Record<string, ToastComponent> = {
  gameover: GameOverToast as ToastComponent,
};

/**
 * Типы тостов, которые ведут себя как модальное окно: пока такой тост на экране,
 * слой затемняет фон и перехватывает клики.
 *
 * Блокировка кликов здесь не косметика: под оверлеем остаётся живой Pixi-канвас,
 * и клик по кругу вызвал бы processWrongClick — то есть дописал бы промах в уже
 * проигранную партию. Затемнение — побочный, но приятный эффект.
 */
const MODAL_TOAST_TYPES = new Set<string>(['gameover']);

interface ToastItemProps {
  toast: ToastData;
}

/**
 * Обёртка одного тоста.
 *
 * Отдельный компонент, а не тело map, из-за правил хуков: таймер авто-закрытия
 * должен принадлежать конкретному тосту, иначе эффект внутри цикла нарушил бы
 * порядок вызовов при изменении массива.
 */
const ToastItem = ({ toast }: ToastItemProps) => {
  const removeToast = useToastStore((state) => state.removeToast);

  const { id, duration } = toast;

  useEffect(() => {
    // Тост без duration живёт до явного закрытия: так ведёт себя экран
    // результатов, который игрок должен прочитать сам.
    if (duration === undefined) return;

    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);

    // Таймер снимаем и при закрытии, и при размонтировании тоста (например,
    // когда экран ушёл и сделал clearToasts): иначе колбэк дёрнул бы стор
    // для уже несуществующего тоста.
    return () => clearTimeout(timer);
  }, [duration, id, removeToast]);

  const Component = TOAST_COMPONENTS[toast.type];

  if (!Component) {
    // Молчаливый пропуск спрятал бы опечатку в type: тост «не появляется» без
    // единого следа в консоли. Рендер при этом не ломается.
    console.warn('[toast] Нет компонента для типа:', toast.type);

    return null;
  }

  const handleClose = () => {
    removeToast(id);
  };

  return (
    // pointer-events-auto возвращает клики самому тосту: контейнер менеджера —
    // pointer-events-none, иначе его прозрачный слой перекрывал бы игровое поле.
    //
    // Анимируется здесь только прозрачность: выезд снизу с пружиной делает сам
    // компонент тоста. Две пружины на одну карточку дали бы двойное движение.
    <motion.div
      className="pointer-events-auto w-full max-w-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Component toast={toast} onClose={handleClose} />
    </motion.div>
  );
};

/**
 * Слой тостов поверх экрана.
 *
 * Контейнер — pointer-events-none: пока тостов нет (и на пустом фоне вокруг
 * тоста), клики проходят сквозь слой в игровое поле. Кликабельными остаются
 * только сами тосты и подложка модальных типов.
 */
export const ToastManager = () => {
  const toasts = useToastStore((state) => state.toasts);

  // Модальная подложка нужна, если на экране есть хотя бы один модальный тост.
  // Считаем флаг в рендере: список тостов меняется только через стор.
  const hasModalToast = toasts.some((toast) => MODAL_TOAST_TYPES.has(toast.type));

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-hidden">
      {/* Подложка модальных тостов. Живёт в менеджере, а не в компоненте тоста:
          карточка GameOverToast — motion-элемент с transform, а он делает её
          containing block для position: absolute — затемнение сжалось бы до
          размеров карточки вместо всего экрана. */}
      <AnimatePresence>
        {hasModalToast && (
          <motion.div
            key="toast-backdrop"
            className="pointer-events-auto absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
