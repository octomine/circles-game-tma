/**
 * Приводит значение из внешнего источника (SDK, localStorage) к числу:
 * там может прийти undefined, строка, NaN или Infinity, поэтому всё нечисловое
 * считаем нулём — потребителю нужен предсказуемый number.
 */
export const toSafeNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};
