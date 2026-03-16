'use client';

import { type ReactNode } from 'react';
import {
  motion,
  useReducedMotion,
  type Variants,
  type HTMLMotionProps,
} from 'framer-motion';
import { useLocale } from 'next-intl';

/* ==========================================================================
   Framer Motion Primitives — reusable animation wrappers
   Respects prefers-reduced-motion automatically
   ========================================================================== */

// ---------------------------------------------------------------------------
// FadeIn — directional fade + translate on scroll or mount
// ---------------------------------------------------------------------------

type Direction = 'up' | 'down' | 'left' | 'right';

interface FadeInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
  className?: string;
}

function getDirectionOffsets(isRTL: boolean): Record<Direction, { x: number; y: number }> {
  return {
    up: { x: 0, y: 40 },
    down: { x: 0, y: -40 },
    left: { x: isRTL ? -40 : 40, y: 0 },
    right: { x: isRTL ? 40 : -40, y: 0 },
  };
}

export function FadeIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  once = true,
  amount = 0.2,
  className,
  ...props
}: FadeInProps) {
  const prefersReduced = useReducedMotion();
  const locale = useLocale();
  const offset = getDirectionOffsets(locale === 'ar')[direction];

  const variants: Variants = {
    hidden: prefersReduced
      ? { opacity: 0 }
      : { opacity: 0, x: offset.x, y: offset.y },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: prefersReduced ? 0.01 : duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StaggerContainer — orchestrates staggered children animations
// ---------------------------------------------------------------------------

interface StaggerContainerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  stagger?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
  className?: string;
}

export function StaggerContainer({
  children,
  stagger = 0.1,
  delay = 0,
  once = true,
  amount = 0.2,
  className,
  ...props
}: StaggerContainerProps) {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={containerVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StaggerItem — child of StaggerContainer, animates per parent orchestration
// ---------------------------------------------------------------------------

interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  direction?: Direction;
  className?: string;
}

export function StaggerItem({
  children,
  direction = 'up',
  className,
  ...props
}: StaggerItemProps) {
  const prefersReduced = useReducedMotion();
  const locale = useLocale();
  const offset = getDirectionOffsets(locale === 'ar')[direction];

  const itemVariants: Variants = {
    hidden: prefersReduced
      ? { opacity: 0 }
      : { opacity: 0, x: offset.x, y: offset.y },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: prefersReduced ? 0.01 : 0.5,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// ScaleIn — scale + fade entrance animation
// ---------------------------------------------------------------------------

interface ScaleInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  once?: boolean;
  className?: string;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.4,
  once = true,
  className,
  ...props
}: ScaleInProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once }}
      transition={{
        duration: prefersReduced ? 0.01 : duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// FloatingElement — gentle infinite floating animation for decorative shapes
// ---------------------------------------------------------------------------

interface FloatingElementProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  distance?: number;
  className?: string;
}

export function FloatingElement({
  children,
  duration = 6,
  delay = 0,
  distance = 20,
  className,
}: FloatingElementProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      animate={
        prefersReduced
          ? {}
          : {
              y: [-distance / 2, distance / 2, -distance / 2],
            }
      }
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
