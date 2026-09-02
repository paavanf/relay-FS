// Sets the browser tab title. Every page calls this on mount.
import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} - Relay` : 'Relay';
  }, [title]);
}
