import React from "react";

/**
 * Used for bailing out of async callbacks when a
 * component has unmounted during async execution.
 *
 * One common case of this is when calling `setState` in
 * an async callback, which can result in a memory leak.
 *
 * ```typescript
 * // BAD
 * const [state, setState] = React.useState("foo");
 * React.useEffect(() => {
 *   void somePromise().then(() => {
 *     setState("bar");
 *   })
 * }, []);
 * ```
 *
 * To fix this, we can use `useIsUnmounted` to bail out
 *
 * ```typescript
 * // GOOD
 * const [state, setState] = React.useState("foo");
 * const isUnmounted = useIsUnmounted();
 * React.useEffect(() => {
 *   void somePromise().then(() => {
 *     if (isUnmounted()) return;
 *     setState("bar");
 *   })
 * }, []);
 *
 * Note that this only protects the immediately following
 * synchronous block of code. If a function uses multiple
 * async calls, `isUnmounted` should be called again.
 * ```
 */
export default function useIsUnmounted() {
  const ref = React.useRef(false);
  React.useEffect(() => {
    ref.current = false;
    return () => void (ref.current = true);
  }, []);
  return React.useCallback(() => ref.current, []);
}
