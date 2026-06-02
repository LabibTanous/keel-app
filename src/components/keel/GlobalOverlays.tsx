'use client';

/**
 * GlobalOverlays.tsx — Root-level AddFlow and Assistant sheets.
 *
 * Renders both overlays at the layout level so they can be triggered
 * from any page's Dock without prop-drilling through page components.
 *
 * Usage: place <GlobalOverlays /> inside layout.tsx body.
 * The Dock's onAdd / onAssistant props should call the global openers
 * exposed via CustomEvents dispatched from page Docks.
 */

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { usePlan } from '@/lib/store';
import { AddFlow } from './AddFlow';
import { Assistant } from './Assistant';

// ── Custom event names ────────────────────────────────────────────────────────

export const KEEL_OPEN_ADD       = 'keel:open-add';
export const KEEL_OPEN_ASSISTANT = 'keel:open-assistant';

// ── Component ─────────────────────────────────────────────────────────────────

export function GlobalOverlays() {
  const [addOpen, setAddOpen]   = useState(false);
  const [asstOpen, setAsstOpen] = useState(false);
  const { plan } = usePlan();
  const pathname = usePathname();

  // Close overlays when the route changes (prevents auto-open on navigation)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setAddOpen(false);
    setAsstOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Only open via explicit user-initiated events — never from mount or navigation
    function onOpenAdd()  { setAddOpen(true);  }
    function onOpenAsst() { setAsstOpen(true); }

    window.addEventListener(KEEL_OPEN_ADD,       onOpenAdd);
    window.addEventListener(KEEL_OPEN_ASSISTANT, onOpenAsst);

    return () => {
      window.removeEventListener(KEEL_OPEN_ADD,       onOpenAdd);
      window.removeEventListener(KEEL_OPEN_ASSISTANT, onOpenAsst);
    };
  }, []);

  return (
    <>
      <AddFlow   open={addOpen}  onClose={() => setAddOpen(false)}  />
      <Assistant open={asstOpen} onClose={() => setAsstOpen(false)} plan={plan} />
    </>
  );
}
