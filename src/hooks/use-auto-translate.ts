'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

// =============================================================================
// useAutoTranslate — debounced client-side translation via /api/translate
// =============================================================================

interface UseAutoTranslateOptions {
  /** Source locale — the field the user is typing in */
  from: 'ar' | 'en';
  /** Target locale — the field to auto-fill */
  to: 'ar' | 'en';
  /** Debounce delay in ms (default 800) */
  delay?: number;
  /** Whether auto-translate is enabled (default true) */
  enabled?: boolean;
}

interface UseAutoTranslateReturn {
  /** Whether a translation request is in-flight */
  isTranslating: boolean;
  /** Whether the target field was auto-translated (not manually edited) */
  isAutoTranslated: boolean;
  /** Call when the source field value changes */
  onSourceChange: (value: string) => void;
  /** Call when the target field is manually edited by the user */
  onTargetManualEdit: () => void;
  /** The auto-translated text for the target field (null if none) */
  translatedText: string | null;
}

export function useAutoTranslate({
  from,
  to,
  delay = 800,
  enabled = true,
}: UseAutoTranslateOptions): UseAutoTranslateReturn {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAutoTranslated, setIsAutoTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const manuallyEdited = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const onSourceChange = useCallback(
    (value: string) => {
      if (!enabled || from === to || manuallyEdited.current) return;

      // Clear previous timer
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();

      const trimmed = value.trim();
      if (!trimmed) {
        setTranslatedText(null);
        setIsAutoTranslated(false);
        return;
      }

      timerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;
        setIsTranslating(true);

        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: trimmed, from, to }),
            signal: controller.signal,
          });

          if (res.ok && !controller.signal.aborted) {
            const { translated } = await res.json();
            if (translated && !manuallyEdited.current) {
              setTranslatedText(translated);
              setIsAutoTranslated(true);
            }
          }
        } catch {
          // Aborted or network error — ignore silently
        } finally {
          if (!controller.signal.aborted) {
            setIsTranslating(false);
          }
        }
      }, delay);
    },
    [from, to, delay, enabled],
  );

  const onTargetManualEdit = useCallback(() => {
    manuallyEdited.current = true;
    setIsAutoTranslated(false);
  }, []);

  return {
    isTranslating,
    isAutoTranslated,
    onSourceChange,
    onTargetManualEdit,
    translatedText,
  };
}
