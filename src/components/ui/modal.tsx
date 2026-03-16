'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface ModalProps extends HTMLAttributes<HTMLDialogElement> {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  /** Width class, defaults to max-w-lg */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-3xl',
} as const;

// =============================================================================
// Component
// =============================================================================

export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  size = 'lg',
  className,
  ...props
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  const handleCancel = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      onClose();
    },
    [onClose],
  );

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed inset-0 z-50 m-auto w-full rounded-2xl border border-border bg-card p-0 shadow-xl',
        'backdrop:bg-black/60 backdrop:backdrop-blur-md backdrop:transition-all backdrop:duration-300',
        'open:animate-scale-in',
        sizeClasses[size],
        className,
      )}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      {...props}
    >
      {/* Header */}
      {(title || description) && (
        <div className="flex items-start justify-between gap-4 border-b border-border p-6 pb-4">
          <div>
            {title && (
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-6">{children}</div>
    </dialog>
  );
}
