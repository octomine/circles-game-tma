'use client';

import { Fragment, useMemo } from 'react';
import { type Variants } from 'motion/react';
import * as motion from 'motion/react-client';

import { cn } from '@/shared/lib/cn';

export interface AnimatedTextProps {
  /** Текст, который появляется по буквам. */
  text: string;
  /** Классы контейнера: размер шрифта, цвет или градиент (bg-clip-text). */
  className?: string;
  /** Задержка перед началом анимации, сек. */
  delay?: number;
  /** Задержка между соседними буквами, сек. */
  stagger?: number;
}

/**
 * То, что motion прокидывает в variants-функцию через проп custom.
 * Отдельный тип нужен, чтобы variants остались константами вне компонента
 * и не пересоздавались на каждый рендер.
 */
interface AnimatedTextCustom {
  delay: number;
  stagger: number;
}

/**
 * Контейнер сам ничего не двигает: он объявляет метки hidden/visible и
 * раскладывает старт детей во времени. staggerChildren сдвигает каждую
 * следующую букву, delayChildren откладывает весь каскад целиком.
 * Значения приходят через custom-функцию — так варианты остаются константой,
 * а delay/stagger становятся её параметрами.
 */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (custom: AnimatedTextCustom) => ({
    opacity: 1,
    transition: { staggerChildren: custom.stagger, delayChildren: custom.delay },
  }),
};

/** Буква: появление с лёгким «подлётом» — прозрачность + масштаб + сдвиг вверх. */
const letterVariants: Variants = {
  hidden: { opacity: 0, scale: 1.2, y: -5 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

export const AnimatedText = ({ text, className, delay = 0, stagger = 0.05 }: AnimatedTextProps) => {
  // Режем строку по пробелам, а не по символам: пробел — часть текста, но не буква.
  // Если анимировать его как букву, он станет inline-block нулевой ширины и слова
  // слипнутся. Поэтому слова — отдельные span'ы, а пробел вставляем между ними
  // обычным текстовым узлом (внешний маппинг), сохраняя переносы строк.
  const words = useMemo(() => text.split(' '), [text]);

  // custom читается motion'ом при разрешении вариантов, поэтому объект мемоизируем:
  // новая ссылка на каждом рендере — лишний повод пересчитать variants у детей.
  const custom = useMemo<AnimatedTextCustom>(() => ({ delay, stagger }), [delay, stagger]);

  return (
    <motion.span
      className={cn('inline-block', className)}
      variants={containerVariants}
      custom={custom}
      initial="hidden"
      animate="visible"
      // Цельный текст для скринридера: сами буквы помечены aria-hidden.
      aria-label={text}
    >
      {words.map((word, wordIndex) => (
        <Fragment key={`${word}-${wordIndex}`}>
          {wordIndex > 0 && ' '}

          {/* inline-block + whitespace-nowrap: слово не рвётся переносом между
              буквами, а transform (scale/y) букв работает — к inline-элементам
              transform не применяется. */}
          <span className="inline-block whitespace-nowrap">
            {Array.from(word).map((letter, letterIndex) => (
              <motion.span
                key={`${letter}-${letterIndex}`}
                className="inline-block"
                variants={letterVariants}
                aria-hidden="true"
              >
                {letter}
              </motion.span>
            ))}
          </span>
        </Fragment>
      ))}
    </motion.span>
  );
};
