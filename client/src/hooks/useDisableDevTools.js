import { useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────
// SSR guard — Next.js / Vite SSR safe
// ─────────────────────────────────────────────────────────────────
const isBrowser = typeof window !== 'undefined';

/**
 * useDisableDevTools
 *
 * Aggressively deters users from opening browser Developer Tools.
 *
 * ┌─ Defense Vectors ───────────────────────────────────────────────┐
 * │ 1.  Context Menu       rightclick → preventDefault              │
 * │ 2.  Keyboard Shortcuts F12 / Ctrl+Shift+I|J|C / Ctrl+U         │
 * │                        Ctrl+S|P|A|F + Mac equivalents           │
 * │ 3.  Debugger Loop      setInterval(debugger) — freezes console  │
 * │ 4.  Resize Detection   outer−inner delta > threshold            │
 * │ 5.  Getter/toString    regex toString trick — fires on DevTools  │
 * │ 6.  Timing Detection   performance.now around debugger          │
 * │ 7.  Console Suppress   override console.* to no-ops            │
 * │ 8.  Console.clear loop wipe console output on interval          │
 * │ 9.  Selection Disable  selectstart → preventDefault             │
 * │ 10. Drag Disable       dragstart → preventDefault               │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * @param {object}  options
 * @param {number}  options.threshold        px diff for resize detect (def 160)
 * @param {string}  options.redirectUrl      redirect URL on detect (def null=DOM nuke)
 * @param {number}  options.debuggerMs       debugger loop interval ms (def 100)
 * @param {boolean} options.suppressConsole  override console.* to no-ops (def true)
 * @param {boolean} options.blockSelection   disable text selection (def true)
 * @param {boolean} options.blockDrag        disable element drag (def true)
 * @param {number}  options.clearConsoleMs   console.clear interval ms (def 1000, 0=off)
 * @param {boolean} options.timingDetect     performance timing detection (def true)
 * @param {boolean} options.getterDetect     regex getter detection (def true)
 * @param {boolean} options.enabled          master switch (def true)
 */
export function useDisableDevTools({
  threshold       = 160,
  redirectUrl     = null,
  debuggerMs      = 100,
  suppressConsole = true,
  blockSelection  = true,
  blockDrag       = true,
  clearConsoleMs  = 1000,
  timingDetect    = true,
  getterDetect    = true,
  enabled         = true,
} = {}) {

  const nukedRef        = useRef(false);
  const debuggerRef     = useRef(null);
  const resizeRef       = useRef(null);
  const clearRef        = useRef(null);
  const getterRef       = useRef(null);
  const timingRef       = useRef(null);
  const workerRef       = useRef(null);
  // Keep original console methods so we can restore on unmount
  const origConsoleRef  = useRef({});

  // ── DOM Nuke / Redirect ─────────────────────────────────────────
  const handleDetected = useCallback(() => {
    if (nukedRef.current) return;
    nukedRef.current = true;

    if (redirectUrl) {
      window.location.replace(redirectUrl);
    } else {
      document.body.innerHTML =
        '<div style="display:flex;height:100vh;align-items:center;' +
        'justify-content:center;font-family:sans-serif;font-size:1.5rem;' +
        'color:#333;background:#f5f5f5">Access Restricted</div>';
    }
  }, [redirectUrl]);

  useEffect(() => {
    if (!isBrowser || !enabled) return;

    // ── 1. Context Menu ────────────────────────────────────────────
    // Block right-click across entire document
    const blockContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', blockContextMenu);

    // ── Web Worker RTT Monitoring ──────────────────────────────────
    if (timingDetect) {
      workerRef.current = new Worker(new URL('../workers/devtools.worker.js', import.meta.url), { type: 'module' });
      workerRef.current.onmessage = (e) => {
        if (e.data === 'ping_main') {
          workerRef.current.postMessage('pong');
        } else if (e.data?.type === 'DETECTED') {
          handleDetected();
        }
      };
      workerRef.current.postMessage('start');
    }

    // ── 2. Keyboard Shortcuts ──────────────────────────────────────
    // Blocks:
    //   F12                            → open DevTools
    //   Ctrl+Shift+I / Cmd+Option+I    → Inspector / Elements panel
    //   Ctrl+Shift+J / Cmd+Option+J    → Console panel
    //   Ctrl+Shift+C / Cmd+Option+C    → Element picker
    //   Ctrl+U / Cmd+U                 → View Source
    //   Ctrl+S / Cmd+S                 → Save page (reveals source)
    //   Ctrl+P / Cmd+P                 → Print (reveals layout)
    //   Ctrl+A / Cmd+A                 → Select All (reveals structure)
    //   Ctrl+F / Cmd+F                 → Find (can probe DOM text)
    const blockKeys = (e) => {
      const ctrl  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt   = e.altKey;
      const key   = e.key?.toUpperCase();

      const isDevKey =
        e.key === 'F12' ||
        (ctrl && shift && ['I', 'J', 'C'].includes(key)) ||
        (ctrl && alt   && ['I', 'J', 'C'].includes(key)) ||   // Mac Option variant
        (ctrl && !shift && ['U', 'S', 'P', 'A', 'F'].includes(key));

      if (isDevKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    // Capture phase — fires before child handlers, cannot be stopped by children
    document.addEventListener('keydown', blockKeys, true);

    // ── 3. Debugger Loop ───────────────────────────────────────────
    // Non-blocking setInterval. When DevTools is open the engine pauses
    // at each `debugger` statement, making the console unusable.
    // Use Function constructor — minifiers (esbuild/terser) strip the
    // `debugger` keyword from source but cannot strip it from strings.
    const debuggerFn = new Function('debugger;');
    debuggerRef.current = setInterval(debuggerFn, debuggerMs);

    // ── 4. Resize Detection ────────────────────────────────────────
    // Docked DevTools shrink innerWidth or innerHeight while outer stays same.
    const checkResize = () => {
      const wDelta = window.outerWidth  - window.innerWidth;
      const hDelta = window.outerHeight - window.innerHeight;
      if (wDelta > threshold || hDelta > threshold) handleDetected();
    };
    resizeRef.current = setInterval(checkResize, 500);

    // ── 5. Getter / toString Trick ─────────────────────────────────
    // When DevTools is open it eagerly formats objects for display,
    // calling toString(). We override a regex's toString to detect this.
    // We poll every 2s to keep checking — DevTools could open at any time.
    if (getterDetect) {
      const runGetterCheck = () => {
        const regex = /./;
        let triggered = false;
        regex.toString = () => { triggered = true; return ''; };
        // Intentional — this log is invisible in suppressed console
        // but DevTools own formatter still calls toString internally
        console.log('%c', regex);
        // Check after microtask queue clears
        Promise.resolve().then(() => {
          if (triggered) handleDetected();
        });
      };
      getterRef.current = setInterval(runGetterCheck, 2000);
      runGetterCheck(); // run immediately too
    }

    // ── 6. Performance Timing Detection ───────────────────────────
    // debugger statement executes near-instantly normally.
    // When DevTools is open the engine pauses — measurable with performance.now().
    // Threshold 100ms is conservative; actual pauses are 300ms+.
    if (timingDetect) {
      const runTimingCheck = () => {
        const t0 = performance.now();
        // eslint-disable-next-line no-new-func
        new Function('debugger;')();
        const elapsed = performance.now() - t0;
        if (elapsed > 100) handleDetected();
      };
      timingRef.current = setInterval(runTimingCheck, 1500);
    }

    // ── 7. Console Suppression ─────────────────────────────────────
    // Override all console methods to no-ops.
    // Prevents app logs from leaking info when DevTools is open.
    // Originals saved for restore on cleanup.
    if (suppressConsole) {
      const methods = [
        'log', 'warn', 'error', 'info', 'debug',
        'table', 'dir', 'dirxml', 'group', 'groupEnd',
        'groupCollapsed', 'trace', 'assert', 'count',
        'countReset', 'time', 'timeEnd', 'timeLog',
      ];
      methods.forEach((method) => {
        if (typeof console[method] === 'function') {
          origConsoleRef.current[method] = console[method].bind(console);
          console[method] = () => {};
        }
      });
    }

    // ── 8. Console.clear Loop ─────────────────────────────────────
    // Wipe console output on interval — even if user bypasses suppression.
    if (clearConsoleMs > 0) {
      clearRef.current = setInterval(() => {
        // Use original clear if we have it (suppress may have wiped it)
        const clearFn = origConsoleRef.current.clear || console.clear;
        if (typeof clearFn === 'function') clearFn.call(console);
      }, clearConsoleMs);
    }

    // ── 9. Text Selection Disable ──────────────────────────────────
    // Prevents users selecting and copying page structure/text for inspection.
    const blockSelect = (e) => e.preventDefault();
    if (blockSelection) {
      document.addEventListener('selectstart', blockSelect);
      // Also inject CSS — belt-and-suspenders
      const styleEl = document.createElement('style');
      styleEl.id = '__devtools-guard-style';
      styleEl.textContent = '* { user-select: none !important; -webkit-user-select: none !important; }';
      document.head.appendChild(styleEl);
    }

    // ── 10. Drag Disable ──────────────────────────────────────────
    // Dragging elements can expose DOM structure and attribute values
    // in the drop handler / drag event data.
    const blockDragFn = (e) => e.preventDefault();
    if (blockDrag) {
      document.addEventListener('dragstart', blockDragFn);
    }

    // ── Cleanup ────────────────────────────────────────────────────
    return () => {
      // Remove all event listeners
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockKeys, true);
      if (blockSelection) {
        document.removeEventListener('selectstart', blockSelect);
        const styleEl = document.getElementById('__devtools-guard-style');
        if (styleEl) styleEl.remove();
      }
      if (blockDrag) {
        document.removeEventListener('dragstart', blockDragFn);
      }

      // Clear all intervals
      clearInterval(debuggerRef.current);
      clearInterval(resizeRef.current);
      clearInterval(clearRef.current);
      clearInterval(getterRef.current);
      clearInterval(timingRef.current);

      // Restore original console methods
      if (suppressConsole) {
        Object.entries(origConsoleRef.current).forEach(([method, fn]) => {
          console[method] = fn;
        });
        origConsoleRef.current = {};
      }

      if (workerRef.current) {
        workerRef.current.postMessage('stop');
        workerRef.current.terminate();
      }

      nukedRef.current = false;
    };
  }, [
    enabled, threshold, debuggerMs, suppressConsole,
    blockSelection, blockDrag, clearConsoleMs,
    timingDetect, getterDetect, handleDetected,
  ]);
}

export default useDisableDevTools;
