import React from 'react';
import { useDisableDevTools } from '../hooks/useDisableDevTools';

/**
 * DevToolsGuard
 *
 * Wrapper component. Drop around your app root (or any subtree).
 * Forwards all props to useDisableDevTools.
 *
 * Usage:
 *   // Next.js — layout.jsx (mark 'use client' at top)
 *   <DevToolsGuard enabled={process.env.NODE_ENV === 'production'}>
 *     <Component {...pageProps} />
 *   </DevToolsGuard>
 *
 *   // Vite — main.jsx
 *   <DevToolsGuard
 *     redirectUrl="/access-denied"
 *     suppressConsole
 *     blockSelection
 *     blockDrag
 *     clearConsoleMs={1000}
 *     timingDetect
 *     getterDetect
 *     enabled={import.meta.env.MODE === 'production'}
 *   >
 *     <App />
 *   </DevToolsGuard>
 *
 * Props:
 *   children          ReactNode  — subtree to protect
 *   enabled           boolean    — master switch (default true)
 *   threshold         number     — px delta for resize detection (default 160)
 *   redirectUrl       string     — redirect on detection (default null = DOM nuke)
 *   debuggerMs        number     — debugger loop interval ms (default 100)
 *   suppressConsole   boolean    — override console.* to no-ops (default true)
 *   blockSelection    boolean    — disable text selection (default true)
 *   blockDrag         boolean    — disable element drag (default true)
 *   clearConsoleMs    number     — console.clear interval ms, 0=off (default 1000)
 *   timingDetect      boolean    — performance timing detection (default true)
 *   getterDetect      boolean    — regex getter detection (default true)
 */
export function DevToolsGuard({
  children,
  enabled           = true,
  threshold         = 160,
  redirectUrl       = null,
  debuggerMs        = 100,
  suppressConsole   = true,
  blockSelection    = true,
  blockDrag         = true,
  clearConsoleMs    = 1000,
  timingDetect      = true,
  getterDetect      = true,
}) {
  useDisableDevTools({
    enabled,
    threshold,
    redirectUrl,
    debuggerMs,
    suppressConsole,
    blockSelection,
    blockDrag,
    clearConsoleMs,
    timingDetect,
    getterDetect,
  });

  // No DOM wrapper — renders children unchanged
  return <>{children}</>;
}

export default DevToolsGuard;
