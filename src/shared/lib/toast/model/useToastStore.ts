import { create } from 'zustand';

import type { ToastData } from './types';

/**
 * Идентификатор тоста.
 *
 * Счётчик, а не `crypto.randomUUID()`: id нужен только для удаления из массива,
 * а UUID доступен лишь в secure context — при отладке по http на LAN-адресе
 * тосты должны работать так же. Тот же приём, что и у `GameEvent`.
 */
let lastToastId = 0;

const nextToastId = (): string => {
  lastToastId += 1;
  return `toast-${lastToastId}`;
};

export interface ToastState {
  toasts: ToastData[];
  /**
   * Добавляет тост и возвращает его id.
   *
   * id генерирует стор, а не вызывающий код: тост обязан получить уникальный
   * ключ до попадания в массив, иначе AnimatePresence не отличит два одинаковых
   * тоста друг от друга и анимация выхода отработает не по тому элементу.
   */
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = nextToastId();

    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    return id;
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  clearToasts: () => set({ toasts: [] }),
}));
