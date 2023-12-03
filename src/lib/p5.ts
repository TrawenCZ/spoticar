import React from "react";

import * as test from "@/sketches/test-sketch";

const HANDLERS = [
  "deviceMoved",
  "deviceShaken",
  "deviceTurned",
  "doubleClicked",
  "draw",
  "keyPressed",
  "keyReleased",
  "keyTyped",
  "mouseClicked",
  "mouseDragged",
  "mouseMoved",
  "mousePressed",
  "mouseReleased",
  "mouseWheel",
  "preload",
  "setup",
  "touchEnded",
  "touchMoved",
  "touchStarted",
  "windowResized",
] as const;
type Handler = (typeof HANDLERS)[number];
type SketchModule = Partial<Record<Handler, () => void>>;

const SKETCHES: Record<string, SketchModule> = { test };

// TODO Investigate typing and runtime handling of empty handlers
const EMPTY = () => undefined;

function cleanup() {
  if (typeof window.remove === "function") window.remove();
  HANDLERS.forEach((h) => (window[h] = EMPTY));
  window.p5 = null!;
}

// TODO Investigate stale handlers and their side effects
function loadHandlers(id: string) {
  const sketch = SKETCHES[id];
  HANDLERS.forEach((h) => (window[h] = sketch?.[h] ?? EMPTY));
}

function loadP5() {
  void import("p5").then((mod) => (window.p5 = mod.default));

  return cleanup;
}

export function useSketch(id: string) {
  React.useEffect(() => loadHandlers(id), [id]);
  React.useEffect(() => loadP5(), []);
}
