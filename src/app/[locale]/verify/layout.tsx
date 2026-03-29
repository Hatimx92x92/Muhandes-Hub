import type { ReactNode } from 'react';

// =============================================================================
// Verification Gates Layout — minimal centered layout for verification flow
// =============================================================================

export default function VerifyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
