/**
 * useCommandHistory — shared localStorage hook for CommandPalette recent history.
 *
 * Both CommandPalette.tsx and TerraFusionLayout.tsx read/write the same
 * 'tf_recent_pages' key so recent pages are consistent across both palettes.
 *
 * Storage format: JSON array of { href, label } objects, max 5 entries.
 */
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tf_recent_pages';
const MAX_HISTORY = 5;

export interface RecentPage {
  href: string;
  label: string;
}

export function useCommandHistory() {
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentPage[];
        if (Array.isArray(parsed)) {
          setRecentPages(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  /**
   * Record a navigation to `href` with display `label`.
   * Deduplicates by href and keeps the most recent at the front.
   */
  const recordNavigation = useCallback((href: string, label: string) => {
    setRecentPages(prev => {
      const deduped = prev.filter(p => p.href !== href);
      const updated = [{ href, label }, ...deduped].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors (e.g. private browsing quota)
      }
      return updated;
    });
  }, []);

  /**
   * Clear all recent history.
   */
  const clearHistory = useCallback(() => {
    setRecentPages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return { recentPages, recordNavigation, clearHistory };
}
