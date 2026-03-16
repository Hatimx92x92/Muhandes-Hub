'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ==========================================================================
   AnimatedIcon — Lucide icon with entrance + infinite pulse + hover effects
   ========================================================================== */

interface AnimatedIconProps {
  icon: LucideIcon;
  containerClassName?: string;
  iconClassName?: string;
  size?: number;
}

export function AnimatedIcon({
  icon: Icon,
  containerClassName,
  iconClassName,
  size = 28,
}: AnimatedIconProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0, rotate: -180 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        duration: prefersReduced ? 0.01 : undefined,
      }}
      whileHover={
        prefersReduced
          ? {}
          : {
              scale: 1.2,
              rotate: [0, -10, 10, -5, 5, 0],
              transition: { duration: 0.5 },
            }
      }
      className={cn(
        'flex items-center justify-center',
        containerClassName,
      )}
    >
      <motion.div
        animate={
          prefersReduced
            ? {}
            : {
                scale: [1, 1.15, 1],
                rotate: [0, 3, -3, 0],
              }
        }
        transition={
          prefersReduced
            ? {}
            : {
                duration: 3,
                repeat: Infinity,
                repeatType: 'loop' as const,
                ease: 'easeInOut',
              }
        }
        className="flex items-center justify-center"
      >
        <Icon className={iconClassName} size={size} />
      </motion.div>
    </motion.div>
  );
}
