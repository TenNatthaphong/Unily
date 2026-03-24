import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

/**
 * Renders children into document.body, escaping any CSS stacking-context
 * (backdrop-filter, transform, etc.) so `position: fixed` overlays truly
 * center to the viewport.
 */
export default function Portal({ children }: PortalProps) {
  const el = useRef(document.createElement('div'));

  useEffect(() => {
    const container = el.current;
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, []);

  return createPortal(children, el.current);
}
