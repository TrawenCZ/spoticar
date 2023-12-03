// TODO Make this only apply to global sketch pages

import * as P5 from "p5";
import "p5/global";

declare global {
  interface Window extends P5 {
    p5: typeof P5.default;
  }
}

export as namespace p5;
