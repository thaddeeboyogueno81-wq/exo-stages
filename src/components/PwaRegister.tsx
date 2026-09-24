'use client';

import { useEffect } from 'react';

/** Enregistre le service worker (mode hors-ligne / faible connexion). */
export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // hors-ligne ou non supporté : silencieux
      });
    }
  }, []);
  return null;
}
