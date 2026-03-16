'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TypingTextProps {
  text: string;
  /** Delay in seconds before typing begins */
  delay?: number;
  /** Duration in seconds per character */
  speed?: number;
  /** Called when all characters have been revealed */
  onComplete?: () => void;
  className?: string;
  /** Show blinking cursor at end */
  cursor?: boolean;
  /** HTML tag to render as */
  as?: 'h1' | 'h2' | 'p' | 'span';
}

const charVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function TypingText({
  text,
  delay = 0,
  speed = 0.04,
  onComplete,
  className,
  cursor = true,
  as: Tag = 'span',
}: TypingTextProps) {
  const prefersReduced = useReducedMotion();
  const [done, setDone] = useState(false);

  // Split text into characters, preserving spaces
  const chars = text.split('');

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: delay,
        staggerChildren: prefersReduced ? 0 : speed,
      },
    },
  };

  // Fire onComplete after the last character finishes
  useEffect(() => {
    if (prefersReduced) {
      setDone(true);
      onComplete?.();
      return;
    }

    const totalTime = delay + chars.length * speed + 0.15; // +0.15s buffer for last char transition
    const timer = setTimeout(() => {
      setDone(true);
      onComplete?.();
    }, totalTime * 1000);

    return () => clearTimeout(timer);
    // Only depend on stable values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, speed, text, prefersReduced]);

  const MotionTag = motion.create(Tag);

  return (
    <MotionTag
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-label={text}
    >
      {chars.map((char, i) => (
        <motion.span
          key={`${i}-${char}`}
          variants={charVariants}
          transition={{ duration: 0.05 }}
          aria-hidden="true"
          style={char === ' ' ? { display: 'inline', whiteSpace: 'pre' } : undefined}
        >
          {char}
        </motion.span>
      ))}
      {cursor && (
        <span
          className={`inline-block w-0.5 align-middle ms-0.5 bg-current ${
            done ? 'animate-blink-cursor opacity-0' : 'animate-blink-cursor'
          }`}
          style={{ height: '0.85em' }}
          aria-hidden="true"
        />
      )}
    </MotionTag>
  );
}
