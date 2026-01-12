import { useEffect, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * Returns a debounced copy of `value` that only updates after `delayMs` elapses
 * without further changes.
 *
 * @template T
 * @param {T} value The value to debounce.
 * @param {number} delayMs Debounce delay in milliseconds.
 * @returns {T} Debounced value.
 */
export default function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
