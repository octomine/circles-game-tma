'use client';

import { useMemo, type ReactNode } from 'react';
import { type Variants } from 'motion/react';
import * as motion from 'motion/react-client';

export interface AnimatedStackProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

/**
 * Оркестратор каскадного появления детей. Своей раскладки не задаёт: классы
 * (flex, gap, ширину) передаёт потребитель через className.
 */
export const AnimatedStack = ({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: AnimatedStackProps) => {
  // staggerChildren сдвигает старт каждого следующего ребёнка на stagger секунд,
  // delayChildren откладывает весь каскад целиком. Своих анимаций у детей нет —
  // они лишь объявляют variants, а метки hidden/visible приходят отсюда.
  const containerVariants = useMemo<Variants>(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: stagger,
          delayChildren: delay,
        },
      },
    }),
    [stagger, delay]
  );

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
};
