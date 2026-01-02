import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onPlayPause,
  onNext,
  onPrevious,
  onEscape,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input/textarea
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        onPlayPause?.();
        break;
      case 'k':
        e.preventDefault();
        onPlayPause?.();
        break;
      case 'n':
      case 'j':
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          onNext?.();
        }
        break;
      case 'p':
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          onPrevious?.();
        }
        break;
      case 'escape':
        onEscape?.();
        break;
    }
  }, [onPlayPause, onNext, onPrevious, onEscape]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}
