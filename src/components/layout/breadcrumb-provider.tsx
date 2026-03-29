'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

// =============================================================================
// Breadcrumb Override Context
// Allows pages to inject dynamic labels for [id] segments
// =============================================================================

interface BreadcrumbContextValue {
  /** Map of segment → display label (e.g. { "abc-123": "My Project" }) */
  overrides: Record<string, string>;
  /** Register an override for a specific URL segment */
  setOverride: (segment: string, label: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  overrides: {},
  setOverride: () => {},
});

/**
 * Wrap layout children with this provider to enable dynamic breadcrumb labels.
 */
export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const setOverride = useCallback((segment: string, label: string) => {
    setOverrides((prev) => {
      if (prev[segment] === label) return prev;
      return { ...prev, [segment]: label };
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ overrides, setOverride }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

/**
 * Hook to read breadcrumb overrides (used by BreadcrumbNav).
 */
export function useBreadcrumbOverrides() {
  return useContext(BreadcrumbContext);
}

/**
 * Drop this component inside any page to set a dynamic breadcrumb label.
 *
 * @example
 * // In dashboard/projects/[id]/page.tsx:
 * <BreadcrumbOverride segment={params.id} label={project.title} />
 */
export function BreadcrumbOverride({
  segment,
  label,
}: {
  segment: string;
  label: string;
}) {
  const { setOverride } = useContext(BreadcrumbContext);

  useEffect(() => {
    if (segment && label) {
      setOverride(segment, label);
    }
  }, [segment, label, setOverride]);

  return null;
}
